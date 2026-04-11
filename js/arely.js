// ══════════════════════════════════════════════════════════
// ARELY — Household Expense Manager · 1311 Old Robinson Trail
// Everything in English · Pink palette · Budget-focused
// ══════════════════════════════════════════════════════════

// ── FORMAT (USD) ─────────────────────────────────────────
function fmtUSD(n){
  return '$' + parseFloat(n||0).toLocaleString('en-US',{minimumFractionDigits:2, maximumFractionDigits:2});
}

// ── NAVIGATION ───────────────────────────────────────────
function arelyShow(name){
  document.querySelectorAll('#arelyShell .view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('#arelyBottomNav .nav-btn').forEach(b => b.classList.remove('active','a-active'));
  document.getElementById('av' + name).classList.add('active');
  const btn = document.getElementById('an' + name);
  if(btn){ btn.classList.add('active','a-active'); }
  if(name === 'Dashboard')  loadArelyDashboard();
  if(name === 'AddExpense') loadArelyRecentExp();
  if(name === 'Budget')     loadArelyBudgetView();
  if(name === 'Calendar')   renderArelyCalendar();
  if(name === 'Checklist')  { buildArelyTodoCatGrid(); loadArelyTodos(); }
}

// ── LOAD ALL DATA ────────────────────────────────────────
async function loadArelyData(){
  const COLS = 'id,date,description,category,cat_label,month,month_display,month_num,year,amount,type,person,direction,created_at,edited_at,edited_by';
  const {data} = await db.from('transactions')
    .select(COLS).eq('person','arely')
    .order('created_at',{ascending:false});
  arelyTx = data || [];

  // Load budget from localStorage
  const savedBudget = localStorage.getItem('arely_budget_' + getCurrentMonthKey());
  arelyBudget = savedBudget ? parseFloat(savedBudget) : 0;

  renderArelyBanner();
}

function getCurrentMonthKey(){
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
}

function getArelyCurrentMonthTx(){
  const now = new Date();
  const m = now.getMonth() + 1;
  const y = now.getFullYear();
  return arelyTx.filter(t => {
    const mn = t.month_num || parseInt((t.date||'').split('/')[1]) || 0;
    const yr = t.year || new Date(t.created_at).getFullYear();
    return mn === m && yr === y && t.direction === 'expense';
  });
}

// ── BANNER ───────────────────────────────────────────────
function renderArelyBanner(){
  const monthTx = getArelyCurrentMonthTx();
  const spent   = sumAmt(monthTx);
  const remaining = Math.max(0, arelyBudget - spent);
  const pct = arelyBudget > 0 ? Math.min(100, (spent / arelyBudget) * 100) : 0;

  document.getElementById('arelyBudgetTotal').textContent    = fmtUSD(arelyBudget);
  document.getElementById('arelyBannerSpent').textContent    = fmtUSD(spent);
  document.getElementById('arelyBannerRemaining').textContent= fmtUSD(remaining);

  const bar = document.getElementById('arelyBudgetBar');
  bar.style.width = pct + '%';
  bar.className = 'arely-budget-bar' + (pct > 90 ? ' bar-danger' : pct > 70 ? ' bar-warning' : '');
  document.getElementById('arelyBudgetPct').textContent = pct.toFixed(0) + '%';

  document.getElementById('arelyHdrSub').textContent = `${MONTHS_EN[new Date().getMonth()+1]} · ${fmtUSD(spent)} spent`;
}

// ── DASHBOARD ────────────────────────────────────────────
async function loadArelyDashboard(){
  show('aDashLoading'); hide('aDashContent'); hide('aDashEmpty');
  await loadArelyData();
  hide('aDashLoading');

  const monthTx = getArelyCurrentMonthTx();
  if(!monthTx.length && !arelyTx.length){ show('aDashEmpty'); return; }
  show('aDashContent');

  renderArelyCatBreakdown(monthTx);
  renderArelyDonut(monthTx);
  renderArelyTrend();
  renderArelyTxTable();
}

// ── CATEGORY BREAKDOWN WITH PROGRESS BARS ────────────────
function renderArelyCatBreakdown(tx){
  const cats = {};
  tx.forEach(t => { cats[t.category] = (cats[t.category]||0) + parseFloat(t.amount||0); });
  const sorted = Object.entries(cats).sort((a,b) => b[1]-a[1]);
  const total  = sorted.reduce((s,[,v]) => s+v, 0) || 1;

  document.getElementById('arelyCatBreakdown').innerHTML = sorted.map(([k, amt]) => {
    const cat = ARELY_CAT[k] || {emoji:'📦', label:k, color:'#90A4AE'};
    const pct = ((amt/total)*100).toFixed(1);
    return `
    <div class="arely-cat-row">
      <div class="arely-cat-icon" style="background:${cat.color}20;color:${cat.color}">${cat.emoji}</div>
      <div class="arely-cat-info">
        <div class="arely-cat-name">${cat.label}</div>
        <div class="arely-cat-bar-wrap">
          <div class="arely-cat-bar" style="width:${pct}%;background:${cat.color}"></div>
        </div>
      </div>
      <div class="arely-cat-amt">${fmtUSD(amt)}<span class="arely-cat-pct">${pct}%</span></div>
    </div>`;
  }).join('') || '<p style="color:#aaa;text-align:center;padding:16px">No expenses this month.</p>';
}

// ── DONUT CHART ──────────────────────────────────────────
function renderArelyDonut(tx){
  const cats   = {};
  tx.forEach(t => { cats[t.category] = (cats[t.category]||0) + parseFloat(t.amount||0); });
  const sorted = Object.entries(cats).sort((a,b) => b[1]-a[1]);
  const total  = sorted.reduce((s,[,v]) => s+v, 0) || 1;

  if(arelyDonutChart) arelyDonutChart.destroy();
  arelyDonutChart = new Chart(document.getElementById('arelyDonutCanvas'), {
    type: 'doughnut',
    data: {
      labels:   sorted.map(([k]) => ARELY_CAT[k]?.label||k),
      datasets: [{
        data:            sorted.map(([,v]) => v),
        backgroundColor: sorted.map(([k]) => ARELY_CAT[k]?.color||'#ccc'),
        borderWidth: 2, borderColor: '#fff',
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '60%',
      plugins: {
        legend: {position:'right', labels:{font:{size:9}, padding:7, boxWidth:11}},
        tooltip: {callbacks:{label: c => ` ${fmtUSD(c.raw)} (${((c.raw/total)*100).toFixed(1)}%)`}},
      },
    },
  });
}

// ── SPENDING TREND (line chart – last 6 months) ──────────
function renderArelyTrend(){
  const now = new Date();
  const months = [];
  for(let i=5; i>=0; i--){
    const d = new Date(now.getFullYear(), now.getMonth()-i, 1);
    months.push({
      key: `${d.getFullYear()}-${d.getMonth()+1}`,
      label: MONTHS_EN[d.getMonth()+1]?.slice(0,3) || '',
      m: d.getMonth()+1,
      y: d.getFullYear(),
    });
  }

  const data = months.map(mo => {
    return arelyTx
      .filter(t => {
        const mn = t.month_num || parseInt((t.date||'').split('/')[1]) || 0;
        const yr = t.year || new Date(t.created_at).getFullYear();
        return mn === mo.m && yr === mo.y && t.direction === 'expense';
      })
      .reduce((s,t) => s + parseFloat(t.amount||0), 0);
  });

  if(arelyTrendChart) arelyTrendChart.destroy();
  arelyTrendChart = new Chart(document.getElementById('arelyTrendCanvas'), {
    type: 'line',
    data: {
      labels: months.map(m => m.label),
      datasets: [{
        label: 'Spending',
        data: data,
        borderColor: '#D06B8D',
        backgroundColor: 'rgba(208,107,141,0.12)',
        fill: true,
        tension: 0.35,
        pointBackgroundColor: '#D06B8D',
        pointRadius: 5,
        pointHoverRadius: 7,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: {display: false},
        tooltip: {callbacks:{label: c => fmtUSD(c.raw)}},
      },
      scales: {
        x: {grid:{display:false}},
        y: {ticks:{callback: v => '$'+(v>=1000?(v/1000).toFixed(0)+'k':v)}, grid:{color:'#f0f0f0'}},
      },
    },
  });
}

// ── TRANSACTIONS TABLE ───────────────────────────────────
function renderArelyTxTable(){
  const tx = arelyTx.filter(t => t.direction === 'expense');
  if(!tx.length){
    document.getElementById('arelyTxBody').innerHTML = '<tr><td colspan="5" style="text-align:center;padding:18px;color:#aaa">No transactions</td></tr>';
    return;
  }
  document.getElementById('arelyTxBody').innerHTML = tx.slice(0,30).map(t => `
    <tr${t.edited_at?' class="was-edited"':''}>
      <td>${t.date||'—'}${t.edited_at?'<span class="edited-mark">✏️</span>':''}</td>
      <td style="max-width:130px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${t.description}">${t.description}</td>
      <td><span class="badge b-arely-cat">${ARELY_CAT[t.category]?.emoji||'📦'} ${ARELY_CAT[t.category]?.label||t.category}</span></td>
      <td class="amount-neg">${fmtUSD(t.amount)}</td>
      <td><button class="del-btn" onclick="deleteTx('${t.id}','arely')">🗑</button></td>
    </tr>`).join('');
}

// ── SAVE EXPENSE ─────────────────────────────────────────
async function saveArelyExpense(){
  const date = document.getElementById('arelyExpDate').value;
  const desc = document.getElementById('arelyExpDesc').value.trim();
  const amt  = parseFloat(document.getElementById('arelyExpAmt').value);
  const al   = document.getElementById('arelyAddAlert');
  if(!date || !desc || !amt || amt<=0 || !arelySelectedCat){
    showAlert(al, 'Please fill in all fields.', 'error');
    return;
  }
  const dp = date.split('-');
  const mn = parseInt(dp[1]);
  const yr = parseInt(dp[0]);
  const {error} = await db.from('transactions').insert([{
    date: `${dp[2]}/${dp[1]}`, description: desc,
    category: arelySelectedCat, cat_label: ARELY_CAT[arelySelectedCat]?.label||arelySelectedCat,
    month: MONTHS_EN[mn].toLowerCase(), month_display: MONTHS_EN[mn], month_num: mn, year: yr,
    amount: amt, type: 'cash', person: 'arely', direction: 'expense',
  }]);
  if(error){ showAlert(al, 'Error: ' + error.message, 'error'); return; }
  showAlert(al, '✅ Saved!', 'success');
  document.getElementById('arelyExpDesc').value = '';
  document.getElementById('arelyExpAmt').value  = '';
  arelySelectedCat = '';
  document.querySelectorAll('#arelyCatGrid .opt-btn').forEach(b => b.classList.remove('sel','sel-arely'));
  loadArelyData();
  loadArelyRecentExp();
}

async function loadArelyRecentExp(){
  await loadArelyData();
  const monthTx = getArelyCurrentMonthTx();
  const recent  = monthTx.slice(0, 8);
  const box     = document.getElementById('arelyRecentExp');
  if(!recent.length){
    box.innerHTML = '<p style="color:var(--muted);font-size:.82rem;text-align:center;padding:10px">No expenses yet this month.</p>';
    return;
  }
  box.innerHTML = `<table style="width:100%;font-size:.78rem;border-collapse:collapse">
    ${recent.map(t => `
    <tr style="border-bottom:1px solid #f0f0f0">
      <td style="padding:6px 5px">${ARELY_CAT[t.category]?.emoji||'📦'}</td>
      <td style="padding:6px 4px;max-width:110px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${t.description}</td>
      <td style="padding:6px 4px;color:#D06B8D;font-weight:700">${fmtUSD(t.amount)}</td>
      <td><button class="del-btn" onclick="deleteTx('${t.id}','arely')">🗑</button></td>
    </tr>`).join('')}
  </table>`;
}

// ── BUDGET VIEW ──────────────────────────────────────────
function loadArelyBudgetView(){
  document.getElementById('arelyBudgetInput').value = arelyBudget || '';
  renderArelyBudgetCategories();
}

function saveArelyBudget(){
  const val = parseFloat(document.getElementById('arelyBudgetInput').value);
  const al  = document.getElementById('arelyBudgetAlert');
  if(!val || val <= 0){ showAlert(al, 'Enter a valid budget amount.', 'error'); return; }
  arelyBudget = val;
  localStorage.setItem('arely_budget_' + getCurrentMonthKey(), val);
  showAlert(al, '✅ Budget saved!', 'success');
  renderArelyBanner();
  renderArelyBudgetCategories();
}

function renderArelyBudgetCategories(){
  const monthTx = getArelyCurrentMonthTx();
  const cats = {};
  monthTx.forEach(t => { cats[t.category] = (cats[t.category]||0) + parseFloat(t.amount||0); });
  const sorted = Object.entries(cats).sort((a,b) => b[1]-a[1]);
  const total  = sorted.reduce((s,[,v]) => s+v, 0);

  const catBudget = arelyBudget > 0 && sorted.length > 0
    ? arelyBudget / Object.keys(ARELY_CAT).length  // equal share estimate
    : 0;

  document.getElementById('arelyBudgetCatList').innerHTML = sorted.length ? sorted.map(([k, amt]) => {
    const cat = ARELY_CAT[k] || {emoji:'📦', label:k, color:'#90A4AE'};
    const budgetPct = arelyBudget > 0 ? ((amt / arelyBudget) * 100).toFixed(1) : 0;
    return `
    <div class="arely-budget-cat-row">
      <div class="arely-cat-icon" style="background:${cat.color}20;color:${cat.color}">${cat.emoji}</div>
      <div class="arely-cat-info">
        <div class="arely-cat-name">${cat.label}</div>
        <div class="arely-cat-bar-wrap">
          <div class="arely-cat-bar" style="width:${Math.min(100,budgetPct)}%;background:${cat.color}"></div>
        </div>
      </div>
      <div class="arely-cat-amt">${fmtUSD(amt)}<span class="arely-cat-pct">${budgetPct}% of budget</span></div>
    </div>`;
  }).join('') : '<p style="color:#aaa;text-align:center;padding:16px">No spending data yet.</p>';

  // Summary
  const pct = arelyBudget > 0 ? ((total / arelyBudget) * 100).toFixed(1) : 0;
  document.getElementById('arelyBudgetCatList').innerHTML += `
    <div class="arely-budget-summary">
      <div><strong>Total Spent:</strong> ${fmtUSD(total)}</div>
      <div><strong>Budget:</strong> ${fmtUSD(arelyBudget)}</div>
      <div><strong>Used:</strong> <span style="color:${pct>90?'#e53935':pct>70?'#f57c00':'#43a047'}">${pct}%</span></div>
    </div>`;
}

// ── CALENDAR ─────────────────────────────────────────────
function renderArelyCalendar(){
  loadArelyData().then(() => {
    const now   = new Date();
    const year  = now.getFullYear();
    const month = now.getMonth(); // 0-indexed
    const today = now.getDate();
    const daysInMonth = new Date(year, month+1, 0).getDate();
    const firstDay   = new Date(year, month, 1).getDay(); // 0=Sun

    // Budget status
    const monthTx = getArelyCurrentMonthTx();
    const spent   = sumAmt(monthTx);
    const pct     = arelyBudget > 0 ? (spent / arelyBudget) * 100 : 0;
    const daysLeft = daysInMonth - today;
    const budgetAlert = pct >= 90 && daysLeft > 5;

    // Build calendar grid
    const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    let html = `<div class="arely-cal-title">${MONTHS_EN[month+1]} ${year}</div>`;
    html += '<div class="arely-cal-grid">';
    // Header row
    dayNames.forEach(d => { html += `<div class="arely-cal-hdr">${d}</div>`; });
    // Empty slots before day 1
    for(let i=0; i<firstDay; i++) html += '<div class="arely-cal-day empty"></div>';
    // Days
    for(let d=1; d<=daysInMonth; d++){
      let cls = 'arely-cal-day';
      if(d === today) cls += ' cal-today-day';
      else if(d < today) cls += ' cal-past-day';
      else if(budgetAlert) cls += ' cal-alert-day';
      html += `<div class="${cls}">${d}</div>`;
    }
    html += '</div>';

    document.getElementById('arelyCalendar').innerHTML = html;

    // Budget status card
    const statusColor = pct >= 90 ? '#e53935' : pct >= 70 ? '#f57c00' : '#43a047';
    const statusText  = pct >= 90
      ? (daysLeft > 5 ? `⚠️ Budget is ${pct.toFixed(0)}% used with ${daysLeft} days remaining!` : `Budget is ${pct.toFixed(0)}% used — ${daysLeft} days left`)
      : `Budget is ${pct.toFixed(0)}% used — ${daysLeft} days remaining`;

    document.getElementById('arelyCalBudgetStatus').innerHTML = `
      <div class="arely-cal-status" style="border-left:4px solid ${statusColor}">
        <div class="arely-cal-status-pct" style="color:${statusColor}">${pct.toFixed(0)}%</div>
        <div class="arely-cal-status-text">${statusText}</div>
        <div class="arely-cal-status-detail">
          ${fmtUSD(spent)} of ${fmtUSD(arelyBudget)} · ${fmtUSD(Math.max(0, arelyBudget - spent))} remaining
        </div>
      </div>`;
  });
}

// ── CHECKLIST / TODOS ────────────────────────────────────
function toggleArelyTodoForm(){
  const w = document.getElementById('arelyTodoFormWrap');
  w.style.display = w.style.display === 'none' ? 'block' : 'none';
}

function buildArelyTodoCatGrid(){
  document.getElementById('arelyTodoCatGrid').innerHTML = ARELY_TODO_CATS.map(c =>
    `<button class="opt-btn" onclick="this.parentElement.querySelectorAll('.opt-btn').forEach(b=>b.classList.remove('sel','sel-arely'));this.classList.add('sel-arely');arelySelectedTodoCat='${c.k}'">
    <span class="opt-icon">${c.icon}</span>${c.label}</button>`
  ).join('');
}

async function saveArelyTodo(){
  const title = document.getElementById('arelyTodoTitle').value.trim();
  const due   = document.getElementById('arelyTodoDate').value || null;
  const al    = document.getElementById('arelyTodoAlert');
  if(!title){ showAlert(al, 'Please enter a task description.', 'error'); return; }
  const {error} = await db.from('todos').insert([{
    title, due_date: due, person: 'arely',
    category: arelySelectedTodoCat || 'other',
    completed: false,
  }]);
  if(error){ showAlert(al, 'Error: ' + error.message, 'error'); return; }
  showAlert(al, '✅ Task saved!', 'success');
  document.getElementById('arelyTodoTitle').value = '';
  document.getElementById('arelyTodoDate').value  = '';
  arelySelectedTodoCat = '';
  document.querySelectorAll('#arelyTodoCatGrid .opt-btn').forEach(b => b.classList.remove('sel','sel-arely'));
  loadArelyTodos();
}

async function loadArelyTodos(){
  const {data} = await db.from('todos')
    .select('id,title,due_date,completed,category,created_at')
    .eq('person','arely')
    .order('completed').order('due_date',{ascending:true,nullsFirst:false}).order('created_at',{ascending:false});
  const todos = data || [];
  const done  = todos.filter(t => t.completed);
  const pending = todos.filter(t => !t.completed);

  // Progress bar
  const total = todos.length;
  const pct   = total > 0 ? ((done.length / total) * 100).toFixed(0) : 0;
  document.getElementById('arelyTodoProgress').innerHTML = total > 0 ? `
    <div class="arely-todo-prog-text">
      <span>✅ ${done.length} done</span>
      <span>⏳ ${pending.length} remaining</span>
    </div>
    <div class="arely-todo-prog-bar-wrap">
      <div class="arely-todo-prog-bar" style="width:${pct}%"></div>
    </div>
    <div class="arely-todo-prog-pct">${pct}% complete</div>
  ` : '';

  // List
  const renderItem = (t) => {
    const catInfo = ARELY_TODO_CATS.find(c => c.k === t.category) || {icon:'💡', label:'Other'};
    const dueStr  = t.due_date ? `<span class="arely-todo-due">${t.due_date}</span>` : '';
    return `
    <div class="arely-todo-item ${t.completed ? 'todo-done' : ''}">
      <button class="arely-todo-check" onclick="toggleArelyTodo('${t.id}',${!t.completed})">
        ${t.completed ? '☑️' : '⬜'}
      </button>
      <div class="arely-todo-body">
        <span class="arely-todo-cat-icon">${catInfo.icon}</span>
        <span class="arely-todo-title-text ${t.completed ? 'strike' : ''}">${escHtml(t.title)}</span>
        ${dueStr}
      </div>
      <button class="del-btn" onclick="deleteArelyTodo('${t.id}')">🗑</button>
    </div>`;
  };

  document.getElementById('arelyTodoList').innerHTML =
    (pending.length ? '<div class="arely-todo-section-lbl">⏳ Pending</div>' + pending.map(renderItem).join('') : '') +
    (done.length ? '<div class="arely-todo-section-lbl" style="margin-top:16px">✅ Completed</div>' + done.map(renderItem).join('') : '') +
    (!todos.length ? '<div class="empty" style="padding:20px"><div class="empty-icon">📋</div><p>No tasks yet. Add one!</p></div>' : '');
}

async function toggleArelyTodo(id, completed){
  await db.from('todos').update({completed}).eq('id', id);
  loadArelyTodos();
}

async function deleteArelyTodo(id){
  if(!confirm('Delete this task?')) return;
  await db.from('todos').delete().eq('id', id);
  loadArelyTodos();
}

// HTML escape helper (if not already available)
function escHtml(s){
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}
