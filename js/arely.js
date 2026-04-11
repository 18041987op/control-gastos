// ══════════════════════════════════════════════════════════
// ARELY — Household Expense Manager · 1311 Old Robinson Trail
// Everything in English · Pink palette · Budget-focused
// ══════════════════════════════════════════════════════════

// ── FORMAT (USD) ─────────────────────────────────────────
function fmtUSD(n){
  return '$' + parseFloat(n||0).toLocaleString('en-US',{minimumFractionDigits:2, maximumFractionDigits:2});
}

// Sam's avatar helper
function samIcon(size){
  size = size || 24;
  return `<img src="img/sam.svg" alt="Sam" class="sam-avatar" style="width:${size}px;height:${size}px;border-radius:50%;vertical-align:middle">`;
}
function catEmoji(k){
  if(k === 'sam') return samIcon(22);
  return ARELY_CAT[k]?.emoji || '📦';
}

// Custom category grid for Arely (shows Sam's avatar)
function buildArelyCatGrid(containerId, onSelect){
  document.getElementById(containerId).innerHTML = Object.entries(ARELY_CAT).map(([k,v]) => {
    const icon = k === 'sam' ? samIcon(20) : `<span class="opt-icon">${v.emoji}</span>`;
    return `<button class="opt-btn" onclick="this.parentElement.querySelectorAll('.opt-btn').forEach(b=>b.classList.remove('sel','sel-arely'));this.classList.add('sel-arely');(${onSelect.toString()})('${k}')">
    ${icon}${v.label.replace(/^[^\s]+\s/,'')}</button>`;
  }).join('');
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
  if(name === 'Upload')     { /* ready */ }
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
      <div class="arely-cat-icon" style="background:${cat.color}20;color:${cat.color}">${k === 'sam' ? samIcon(28) : cat.emoji}</div>
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
      <td><span class="badge b-arely-cat">${catEmoji(t.category)} ${ARELY_CAT[t.category]?.label||t.category}</span></td>
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
      <td style="padding:6px 5px">${catEmoji(t.category)}</td>
      <td style="padding:6px 4px;max-width:110px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${t.description}</td>
      <td style="padding:6px 4px;color:#D06B8D;font-weight:700">${fmtUSD(t.amount)}</td>
      <td><button class="del-btn" onclick="deleteTx('${t.id}','arely')">🗑</button></td>
    </tr>`).join('')}
  </table>`;
}

// ── BUDGET VIEW ──────────────────────────────────────────
function loadArelyBudgetView(){
  document.getElementById('arelyBudgetInput').value = arelyBudget > 0 ? arelyBudget : '';
  const hint = document.getElementById('arelyBudgetHint');
  if(hint) hint.textContent = arelyBudget > 0
    ? 'Current budget: ' + fmtUSD(arelyBudget)
    : 'Enter your total monthly household budget';
  renderArelyBudgetCategories();
}

function saveArelyBudget(){
  const raw = document.getElementById('arelyBudgetInput').value.replace(/[^0-9.]/g,'');
  const val = parseFloat(raw);
  const al  = document.getElementById('arelyBudgetAlert');
  if(!val || val <= 0){ showAlert(al, 'Enter a valid budget amount.', 'error'); return; }
  arelyBudget = val;
  localStorage.setItem('arely_budget_' + getCurrentMonthKey(), val);
  showAlert(al, '✅ Budget set to ' + fmtUSD(val) + '!', 'success');
  document.getElementById('arelyBudgetHint').textContent = 'Current budget: ' + fmtUSD(val);
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
      <div class="arely-cat-icon" style="background:${cat.color}20;color:${cat.color}">${k === 'sam' ? samIcon(28) : cat.emoji}</div>
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

// ── CSV UPLOAD & PARSER ──────────────────────────────────
let arelyPendingCsv = [];

function arelyDragOver(e){ e.preventDefault(); document.getElementById('arelyUploadArea').classList.add('drag'); }
function arelyDragLeave(){ document.getElementById('arelyUploadArea').classList.remove('drag'); }
function arelyDrop(e){ e.preventDefault(); arelyDragLeave(); const f = e.dataTransfer.files[0]; if(f) arelyProcessFile(f); }
function arelyFileSelect(e){ const f = e.target.files[0]; if(f) arelyProcessFile(f); }

function arelyProcessFile(f){
  const reader = new FileReader();
  reader.onload = e => { arelyPendingCsv = arelyParseCSV(e.target.result); arelyShowPreview(arelyPendingCsv, f.name); };
  reader.readAsText(f, 'utf-8');
}

// Auto-categorize for household expenses (US context)
function arelyCategorize(desc){
  const d = desc.toUpperCase();
  // Electricity & Power
  if(/DUKE ENERGY|POWER|ELECTRIC|ENERGY BILL|SCE&G|DOMINION/.test(d)) return 'electricity';
  // Water
  if(/WATER|CHARLOTTE WATER|AQUA|SEWER/.test(d)) return 'water';
  // Gas / Fuel
  if(/\bGAS\b|PIEDMONT|NATURAL GAS|ATMOS|SHELL|EXXON|CIRCLE K|SPEEDWAY|MARATHON|QT |QUIKTRIP|CHEVRON|BP |WAWA|RACETRAC|SHEETZ/.test(d)) return 'gas';
  // Internet / Cable
  if(/SPECTRUM|ATT|AT&T|COMCAST|XFINITY|VERIZON FIO|GOOGLE FIBER|TMOBILE HOME|STARLINK|HULU|NETFLIX|DISNEY|YOUTUBE|APPLE.COM|SPOTIFY/.test(d)) return 'internet';
  // Phone
  if(/T-MOBILE|TMOBILE|VERIZON WIRE|CRICKET|BOOST|METRO BY|MINT MOBILE|VISIBLE/.test(d)) return 'phone';
  // Groceries
  if(/WALMART|ALDI|LIDL|FOOD LION|PUBLIX|KROGER|HARRIS TEETER|TRADER JOE|WHOLE FOODS|COSTCO|SAM'S CLUB|TARGET|DOLLAR TREE|DOLLAR GEN|FAMILY DOLLAR|GROCERY|MARKET|PRICESMART/.test(d)) return 'groceries';
  // Rent / Mortgage
  if(/RENT|MORTGAGE|LEASE|HOA|PROPERTY|ZILLOW|APARTMENT/.test(d)) return 'rent';
  // Sam (Pet)
  if(/PET|PETCO|PETSMART|VET |VETERINAR|BANFIELD|CHEWY|DOG |PUPPY|GROOM/.test(d)) return 'sam';
  // Transportation
  if(/UBER|LYFT|DMV|AUTO|CAR WASH|JIFFY|FIRESTONE|AUTOZONE|O'REILLY|ADVANCE AUTO|PARKING|TOLL|EZ PASS/.test(d)) return 'transport';
  // Health
  if(/PHARMACY|CVS|WALGREEN|RITE AID|DOCTOR|HOSPITAL|URGENT|DENTAL|OPTOM|MEDIC|HEALTH|HIMS|PRESCRIPTION/.test(d)) return 'health';
  // Home Maintenance
  if(/LOWES|LOWE'S|HOME DEPOT|HARDWARE|PLUMB|ROOF|REPAIR|CLEAN|MAID|LAWN/.test(d)) return 'maintenance';
  // Dining
  if(/DOORDASH|GRUBHUB|UBEREATS|MCDONALD|CHICK-FIL|WENDY|BURGER|PIZZA|RESTAURANT|GRILL|DINER|CAFE|COFFEE|STARBUCK|DUNKIN|TACO|CHIPOTLE|OLIVE GARDEN|IHOP|WAFFLE|BUFFET|KEBAB|RED LOBSTER|PAPA JOHN|KID CASHEW/.test(d)) return 'dining';
  // Insurance
  if(/INSURANCE|GEICO|STATE FARM|ALLSTATE|PROGRESSIVE|LIBERTY|USAA/.test(d)) return 'insurance';
  // Clothing
  if(/SHEIN|ZARA|H&M|OLD NAVY|GAP|ROSS|MARSHALL|TJ MAXX|NORDSTROM|MACYS|FASHION|CLOTH|APPAREL/.test(d)) return 'clothing';
  // Entertainment
  if(/CINEMA|MOVIE|AMC|REGAL|GAME|STEAM|PLAYSTATION|XBOX|BOWLING|MINIATURE|CONCERT|TICKET/.test(d)) return 'entertainment';
  // Payment / Skip
  if(/PAYMENT|THANK YOU|AUTOPAY/.test(d)) return 'PAYMENT';
  return 'other';
}

function arelyParseCSV(content){
  const lines = content.split(/\r?\n/);
  const txns = [];

  for(let i = 0; i < lines.length; i++){
    const line = lines[i].trim();
    if(!line) continue;

    // Parse quoted CSV: "Date","Amount","*","","Description"
    const cols = [];
    let cur = '', inQ = false;
    for(let j = 0; j < line.length; j++){
      const c = line[j];
      if(c === '"'){ inQ = !inQ; }
      else if(c === ',' && !inQ){ cols.push(cur.trim()); cur = ''; }
      else { cur += c; }
    }
    cols.push(cur.trim());

    if(cols.length < 2) continue;
    // Date should be MM/DD/YYYY
    const dateParts = cols[0].split('/');
    if(dateParts.length < 3) continue;
    const mm = parseInt(dateParts[0]);
    const dd = parseInt(dateParts[1]);
    const yyyy = parseInt(dateParts[2]);
    if(!mm || !dd || !yyyy || mm < 1 || mm > 12) continue;

    const amount = parseFloat(cols[1]);
    if(isNaN(amount) || amount === 0) continue;

    const desc = cols[cols.length - 1] || cols[4] || cols[3] || cols[2] || '';
    if(!desc) continue;

    const isExpense = amount < 0;
    const absAmt = Math.abs(amount);
    const cat = arelyCategorize(desc);

    if(cat === 'PAYMENT') continue; // Skip credit card payments

    const fmtDate = `${String(mm).padStart(2,'0')}/${String(dd).padStart(2,'0')}`;
    txns.push({
      date: fmtDate,
      description: desc.replace(/\s{2,}/g,' ').trim(),
      category: isExpense ? cat : 'other',
      cat_label: isExpense ? (ARELY_CAT[cat]?.label || cat) : 'Income',
      month: MONTHS_EN[mm].toLowerCase(),
      month_display: MONTHS_EN[mm],
      month_num: mm,
      year: yyyy,
      amount: absAmt,
      type: 'bank',
      person: 'arely',
      direction: isExpense ? 'expense' : 'income',
    });
  }
  return txns;
}

// Build a fingerprint for duplicate detection (date + amount + description)
function arelyTxFingerprint(t){
  return `${t.date}|${parseFloat(t.amount).toFixed(2)}|${(t.description||'').toUpperCase().replace(/\s+/g,' ').trim()}`;
}

function arelyShowPreview(txns, filename){
  const al = document.getElementById('arelyUploadAlert');
  if(!txns.length){ showAlert(al, 'No transactions found in this file.', 'error'); return; }
  hideAlert(al);

  // ── Per-transaction duplicate detection ──
  // Build fingerprint set from existing DB transactions
  const existingFP = new Set(arelyTx.map(t => arelyTxFingerprint(t)));
  // Mark each CSV row as duplicate or new
  txns.forEach(t => { t._isDup = existingFP.has(arelyTxFingerprint(t)); });
  const dupes   = txns.filter(t => t._isDup);
  const newOnes = txns.filter(t => !t._isDup);

  const expenses = txns.filter(t => t.direction === 'expense');
  const incomes  = txns.filter(t => t.direction === 'income');

  let titleText = `Preview: ${expenses.length} expenses + ${incomes.length} income from "${filename}"`;
  if(dupes.length > 0) titleText += ` — ${dupes.length} duplicate${dupes.length===1?'':'s'} found`;
  document.getElementById('arelyPreviewTitle').textContent = titleText;

  document.getElementById('arelyPreviewBox').innerHTML = `
    <table style="width:100%;font-size:.76rem;border-collapse:collapse">
      <thead><tr style="background:var(--arely-bg)">
        <th style="padding:4px 7px;text-align:left">Date</th>
        <th style="padding:4px 7px;text-align:left">Description</th>
        <th style="padding:4px 7px;text-align:left">Category</th>
        <th style="padding:4px 7px;text-align:right">Amount</th>
        <th style="padding:4px 7px;text-align:center">Status</th>
      </tr></thead>
      <tbody>${txns.slice(0,80).map(t => `
        <tr style="border-bottom:1px solid #f5f0f3;${t._isDup ? 'opacity:.45;background:#fff3f3;' : ''}">
          <td style="padding:3px 7px">${t.date}</td>
          <td style="padding:3px 7px;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${escHtml(t.description)}">${escHtml(t.description)}</td>
          <td style="padding:3px 7px"><span class="badge b-arely-cat">${catEmoji(t.category)} ${t.cat_label}</span></td>
          <td style="padding:3px 7px;text-align:right;color:${t.direction==='income'?'var(--green)':'var(--red)'};font-weight:600">${fmtUSD(t.amount)}</td>
          <td style="padding:3px 7px;text-align:center;font-size:.7rem">${t._isDup ? '⚠️ Dup' : '✅ New'}</td>
        </tr>`).join('')}
        ${txns.length > 80 ? `<tr><td colspan="5" style="text-align:center;padding:8px;color:var(--muted)">… and ${txns.length-80} more</td></tr>` : ''}
      </tbody>
    </table>`;

  // Show duplicate warning and configure buttons
  const dupWarn    = document.getElementById('arelyDupWarning');
  const importBtn  = document.getElementById('arelyImportBtn');
  const replaceBtn = document.getElementById('arelyReplaceBtn');

  if(dupes.length > 0 && newOnes.length > 0){
    showAlert(dupWarn, `⚠️ ${dupes.length} duplicate transaction${dupes.length===1?'':'s'} detected (same date, amount & description). Only ${newOnes.length} new ones will be imported.`, 'error');
    importBtn.style.display  = 'block';
    importBtn.textContent    = `✅ Import ${newOnes.length} New Transactions`;
    replaceBtn.style.display = 'block';
    replaceBtn.textContent   = `🔄 Import ALL (${txns.length}) — ignore duplicates`;
  } else if(dupes.length > 0 && newOnes.length === 0){
    showAlert(dupWarn, `⚠️ All ${dupes.length} transactions already exist in the database. Nothing new to import.`, 'error');
    importBtn.style.display  = 'none';
    replaceBtn.style.display = 'block';
    replaceBtn.textContent   = `🔄 Force Import ALL (${txns.length})`;
  } else {
    hideAlert(dupWarn);
    importBtn.style.display  = 'block';
    importBtn.textContent    = `✅ Import ${txns.length} Transactions`;
    replaceBtn.style.display = 'none';
  }

  document.getElementById('arelyPreviewSection').style.display = 'block';
}

async function arelyImportCSV(){
  const btn = document.getElementById('arelyImportBtn');
  const al  = document.getElementById('arelyUploadAlert');
  if(!arelyPendingCsv.length) return;
  // Only import non-duplicate transactions
  const toImport = arelyPendingCsv.filter(t => !t._isDup);
  if(!toImport.length){
    showAlert(al, 'No new transactions to import — all are duplicates.', 'error');
    return;
  }
  btn.disabled = true; btn.textContent = 'Importing…';
  // Remove internal _isDup flag before inserting
  const clean = toImport.map(t => { const c = {...t}; delete c._isDup; return c; });
  const {error} = await db.from('transactions').insert(clean);
  btn.disabled = false; btn.textContent = '✅ Import Transactions';
  if(error){ showAlert(al, 'Error: ' + error.message, 'error'); return; }
  const skipped = arelyPendingCsv.length - toImport.length;
  let msg = `✅ ${toImport.length} transactions imported!`;
  if(skipped > 0) msg += ` (${skipped} duplicates skipped)`;
  showAlert(al, msg, 'success');
  arelyCancelUpload();
  await loadArelyData();
}

async function arelyReplaceCSV(){
  const btn = document.getElementById('arelyReplaceBtn');
  const al  = document.getElementById('arelyUploadAlert');
  if(!arelyPendingCsv.length) return;
  btn.disabled = true; btn.textContent = 'Importing…';
  // Force import ALL — clean _isDup flag
  const clean = arelyPendingCsv.map(t => { const c = {...t}; delete c._isDup; return c; });
  const {error} = await db.from('transactions').insert(clean);
  btn.disabled = false; btn.textContent = '🔄 Force Import ALL';
  if(error){ showAlert(al, 'Error: ' + error.message, 'error'); return; }
  showAlert(al, `✅ ${clean.length} transactions imported (including duplicates)!`, 'success');
  arelyCancelUpload();
  await loadArelyData();
}

function arelyCancelUpload(){
  arelyPendingCsv = [];
  document.getElementById('arelyPreviewSection').style.display = 'none';
  document.getElementById('arelyCsvInput').value = '';
  document.getElementById('arelyImportBtn').style.display = 'block';
  document.getElementById('arelyReplaceBtn').style.display = 'none';
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


// ── CSV DOWNLOAD ─────────────────────────────────────────
function downloadCSVArely(filename){
  const tx = arelyTx;
  const n = tx.length;
  if(!confirm(`Download expense history as CSV?\n\n${n} transaction${n===1?'':'s'} will be exported.`)) return;
  const hdrs = ['Date','Description','Category','Month','Type','Direction','Amount ($)'];
  const esc  = v => `"${String(v==null?'':v).replace(/"/g,'""')}"`;
  const lines = [hdrs.map(esc).join(',')];
  tx.forEach(t => {
    lines.push([
      t.date, t.description, ARELY_CAT[t.category]?.label||t.category||'',
      t.month_display||t.month||'', t.type||'bank', t.direction||'expense',
      parseFloat(t.amount||0).toFixed(2),
    ].map(esc).join(','));
  });
  const blob = new Blob(['\uFEFF'+lines.join('\n')], {type:'text/csv;charset=utf-8'});
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
