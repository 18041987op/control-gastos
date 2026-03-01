// ── NAVEGACIÓN ADMIN ──────────────────────────────────────
function adminShowView(name){
  if(currentPerson !== 'sharelyn') return;
  document.querySelectorAll('#sharelySection .view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('#adminNav .nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('view' + name).classList.add('active');
  document.getElementById('nav'  + name).classList.add('active');
  if(name === 'Dashboard') loadDashboard();
  if(name === 'Add')       loadRecentCash();
  if(name === 'Todo')      { buildTodoCatGrid(); loadTodos(); }
}

function switchPerson(p){
  currentPerson = p;
  document.getElementById('tabSharelyn').classList.toggle('active', p === 'sharelyn');
  document.getElementById('tabTeresa').classList.toggle('active',   p === 'teresa');
  document.getElementById('sharelySection').style.display = p === 'sharelyn' ? '' : 'none';
  document.getElementById('teresaSection').style.display  = p === 'teresa'   ? '' : 'none';
  document.getElementById('adminNav').style.display       = p === 'sharelyn' ? '' : 'none';
  if(p === 'teresa') loadTeresaAdminView();
}

// ── DASHBOARD SHARELYN ────────────────────────────────────
// ── AÑO A PARTIR DE created_at ───────────────────────────
function txYear(t){ return new Date(t.created_at).getFullYear(); }

async function loadDashboard(){
  show('dashLoading'); hide('dashContent'); hide('dashEmpty');
  const COLS = 'id,date,description,category,cat_label,month,month_display,month_num,amount,type,person,direction,payment_method,created_at,has_receipt,edited_at,edited_by';
  const {data, error} = await db.from('transactions')
    .select(COLS).eq('person','sharelyn')
    .order('month_num').order('date');
  hide('dashLoading');
  if(error || !data?.length){ show('dashEmpty'); return; }
  allTx = data;

  // Fijar año por defecto al año actual si existe, sino al más reciente
  const years  = [...new Set(allTx.map(txYear))].sort();
  const nowY   = new Date().getFullYear();
  if(!years.includes(currentYear))
    currentYear = years.includes(nowY) ? nowY : years[years.length - 1];

  buildYearTabs(years);
  renderBalanceCards();
  show('dashContent');
  renderDashboard();
}

function renderBalanceCards(){
  const income = sumAmt(allTx.filter(t => t.direction === 'income'));
  const spent  = sumAmt(allTx.filter(t => t.direction !== 'income'));
  const bal    = income - spent;
  const hasIncome = income > 0;
  document.getElementById('balanceCards').style.display = hasIncome ? 'grid' : 'none';
  if(hasIncome){
    document.getElementById('bc_received').textContent = fmt(income);
    document.getElementById('bc_spent').textContent    = fmt(spent);
    document.getElementById('bc_balance').textContent  = fmt(bal);
    document.getElementById('bc_sub').textContent      = `${fmt(income)} recibido — ${fmt(spent)} gastado`;
  }
  if(currentUser === 'sharelyn'){
    document.getElementById('slyBannerBalance').textContent  = fmt(bal);
    document.getElementById('slyBannerReceived').textContent = fmt(income);
    document.getElementById('slyBannerSpent').textContent    = fmt(spent);
  }
}

// ── SELECTOR DE AÑO ──────────────────────────────────────
function buildYearTabs(years){
  const el = document.getElementById('filterYearRow');
  if(years.length <= 1){
    el.style.display = 'none';
  } else {
    el.style.display = 'flex';
    el.innerHTML = years.map(y =>
      `<button class="year-tab${currentYear===y?' active':''}" onclick="setYear(${y})">${y}</button>`
    ).join('');
  }
  _rebuildMonthPills();
}

function setYear(year){
  currentYear   = year;
  currentFilter = 'all';
  document.querySelectorAll('.year-tab').forEach(t =>
    t.classList.toggle('active', +t.textContent === year)
  );
  _rebuildMonthPills();
  renderDashboard();
}

// ── PILLS DE MES ─────────────────────────────────────────
function _rebuildMonthPills(){
  const yearTx = allTx.filter(t => txYear(t) === currentYear);
  const months  = uniqSorted(yearTx.filter(t => t.direction !== 'income'), 'month');
  const displays = months.map(m => yearTx.find(t => t.month === m)?.month_display || m);

  // actualizar header
  document.getElementById('adminHdrSub').textContent = displays.join(' · ') + ' · L';

  buildFilterPills(months, displays);
}

function buildFilterPills(months, displays){
  document.getElementById('filterRow').innerHTML =
    `<button class="pill admin${currentFilter==='all'?' active':''}" onclick="setFilter('all')">Todos</button>` +
    months.map((m,i) =>
      `<button class="pill admin${currentFilter===m?' active':''}" onclick="setFilter('${m}')">${displays[i]}</button>`
    ).join('');
}

function setFilter(f){
  currentFilter = f;
  _rebuildMonthPills();
  renderDashboard();
}

function filteredS(){
  const expense = allTx.filter(t => t.direction !== 'income' && txYear(t) === currentYear);
  return currentFilter === 'all' ? expense : expense.filter(t => t.month === currentFilter);
}

function filteredAll(){
  const yearly = allTx.filter(t => txYear(t) === currentYear);
  return currentFilter === 'all' ? yearly : yearly.filter(t => t.month === currentFilter);
}

function renderDashboard(){
  const tx = filteredS();
  renderSCards(tx);
  renderDonut(tx);
  renderBar();
  renderTopPlaces(tx);
  renderSTable(filteredAll());
}

function renderSCards(tx){
  const total  = sumAmt(tx);
  const cats   = groupSum(tx, 'category');
  const top    = topEntry(cats);
  const bankT  = sumAmt(tx.filter(t => t.type === 'bank'));
  document.getElementById('summaryCards').innerHTML = `
    <div class="stat-card hl span2"><div class="lbl">💸 Total Gastado</div><div class="val">${fmt(total)}</div><div class="sub">${tx.length} movimientos</div></div>
    <div class="stat-card gd"><div class="lbl">🔥 Mayor Cat.</div><div class="val" style="font-size:.88rem">${top ? ALL_CATS[top[0]]?.label||top[0] : '—'}</div><div class="sub">${top ? fmt(top[1]) : ''}</div></div>
    <div class="stat-card"><div class="lbl">🏦 Banco</div><div class="val">${fmt(bankT)}</div></div>`;
}

function renderDonut(tx){
  const cats   = groupSum(tx, 'category');
  const sorted = Object.entries(cats).sort((a,b) => b[1]-a[1]);
  const total  = sorted.reduce((s,[,v]) => s+v, 0);
  if(donutChart) donutChart.destroy();
  donutChart = new Chart(document.getElementById('donutChart'), {
    type: 'doughnut',
    data: {
      labels:   sorted.map(([k]) => ALL_CATS[k]?.label||k),
      datasets: [{
        data:            sorted.map(([,v]) => v),
        backgroundColor: sorted.map(([k]) => ALL_CATS[k]?.color||'#ccc'),
        borderWidth: 2, borderColor: '#fff',
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '60%',
      plugins: {
        legend: {position:'right', labels:{font:{size:9}, padding:7, boxWidth:11}},
        tooltip: {callbacks:{label: c => ` ${fmt(c.raw)} (${((c.raw/total)*100).toFixed(1)}%)`}},
      },
    },
  });
}

function renderBar(){
  const expenseTx = allTx.filter(t => t.direction !== 'income' && txYear(t) === currentYear);
  const months    = uniqSorted(expenseTx, 'month');
  const mDisp     = months.map(m => expenseTx.find(t => t.month === m)?.month_display || m);
  const catKeys   = Object.keys(CAT).filter(k => expenseTx.some(t => t.category === k));
  if(barChart) barChart.destroy();
  barChart = new Chart(document.getElementById('barChart'), {
    type: 'bar',
    data: {
      labels:   mDisp,
      datasets: catKeys.map(k => ({
        label:           CAT[k].label,
        data:            months.map(m => sumAmt(expenseTx.filter(t => t.month===m && t.category===k))),
        backgroundColor: CAT[k].color,
        borderRadius:    4,
      })),
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: {display:false},
        tooltip: {callbacks:{label: c => `${c.dataset.label}: ${fmt(c.raw)}`}},
      },
      scales: {
        x: {stacked:true, grid:{display:false}},
        y: {stacked:true, ticks:{callback: v => 'L '+(v/1000).toFixed(0)+'k'}},
      },
    },
  });
}

function renderTopPlaces(tx){
  const places = groupSum(tx, 'description');
  const sorted = Object.entries(places).sort((a,b) => b[1]-a[1]).slice(0,10);
  const max    = sorted[0]?.[1] || 1;
  document.getElementById('topPlaces').innerHTML = sorted.map(([n,a]) => `
    <div class="top-item">
      <div class="top-lbl" title="${n}">${n}</div>
      <div class="top-track"><div class="top-fill admin" style="width:${(a/max*100).toFixed(1)}%"></div></div>
      <div class="top-amt admin">${fmt(a)}</div>
    </div>`).join('');
}

function renderSTable(tx){
  if(!tx.length){
    document.getElementById('txBody').innerHTML = '<tr><td colspan="7" style="text-align:center;padding:18px;color:#aaa">Sin resultados</td></tr>';
    return;
  }
  document.getElementById('txBody').innerHTML = [...tx].reverse().map(t => `
    <tr${t.edited_at?' class="was-edited"':''}>
      <td>${t.date}${t.edited_at?`<span class="edited-mark" title="Editado por ${t.edited_by||'?'}">✏️</span>`:''}</td>
      <td style="max-width:130px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${t.description}">${t.description}</td>
      <td><span class="badge ${t.direction==='income'?'b-income':'b-cat-admin'}">${t.direction==='income'?'💰':''}${ALL_CATS[t.category]?.emoji||'📦'}</span></td>
      <td><span class="badge m-${t.month||'otros'}">${t.month_display||t.month}</span></td>
      <td><span class="badge ${t.direction==='income'?'b-income':t.type==='cash'?'b-cash':'b-bank'}">${t.direction==='income'?'💰 Ingreso':t.type==='cash'?'💵':'🏦'}</span></td>
      <td class="${t.direction==='income'?'amount-pos':'amount-neg'}">${fmt(t.amount)}</td>
      <td style="white-space:nowrap">
        ${t.direction!=='income'?`<button class="del-btn" title="Editar" style="color:#b3c6e8" onclick="openEditModal('${t.id}','sharelyn')">✏️</button>`:''}
        <button class="del-btn" onclick="deleteTx('${t.id}','sharelyn')">🗑</button>
      </td>
    </tr>`).join('');
}

// ── AGREGAR GASTO EN EFECTIVO ─────────────────────────────
async function saveCash(){
  const date = document.getElementById('cashDate').value;
  const desc = document.getElementById('cashDesc').value.trim();
  const amt  = parseFloat(document.getElementById('cashAmt').value);
  const al   = document.getElementById('addAlert');
  if(!date || !desc || !amt || amt<=0 || !selectedCat){
    showAlert(al, 'Completa todos los campos.', 'error');
    return;
  }
  const dp = date.split('-');
  const mn = parseInt(dp[1]);
  const {error} = await db.from('transactions').insert([{
    date: `${dp[2]}/${dp[1]}`, description: desc,
    category: selectedCat, cat_label: CAT[selectedCat]?.label||selectedCat,
    month: MONTHS_ES[mn].toLowerCase(), month_display: MONTHS_ES[mn], month_num: mn,
    amount: amt, type: 'cash', person: 'sharelyn', direction: 'expense',
  }]);
  if(error){ showAlert(al, 'Error: ' + error.message, 'error'); return; }
  showAlert(al, '✅ Guardado', 'success');
  document.getElementById('cashDesc').value = '';
  document.getElementById('cashAmt').value  = '';
  selectedCat = '';
  document.querySelectorAll('#catGrid .opt-btn').forEach(b => b.classList.remove('sel','sel-admin','sel-teal'));
  loadRecentCash();
}

async function loadRecentCash(){
  const {data} = await db.from('transactions')
    .select('id,date,description,category,month,month_display,amount,type')
    .eq('person','sharelyn').eq('type','cash').eq('direction','expense')
    .order('created_at',{ascending:false}).limit(8);
  const box = document.getElementById('recentCash');
  if(!data?.length){
    box.innerHTML = '<p style="color:var(--muted);font-size:.82rem;text-align:center;padding:10px">Sin gastos en efectivo aún.</p>';
    return;
  }
  box.innerHTML = `<table style="width:100%;font-size:.78rem;border-collapse:collapse">
    ${data.map(t => `
    <tr style="border-bottom:1px solid #f0f0f0">
      <td style="padding:6px 5px">${ALL_CATS[t.category]?.emoji||'📦'}</td>
      <td style="padding:6px 4px;max-width:110px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${t.description}</td>
      <td style="padding:6px 4px"><span class="badge m-${t.month||'otros'}">${t.month_display}</span></td>
      <td style="padding:6px 4px;color:var(--red);font-weight:700">${fmt(t.amount)}</td>
      <td><button class="del-btn" onclick="deleteTx('${t.id}','sharelyn')">🗑</button></td>
    </tr>`).join('')}
  </table>`;
}
