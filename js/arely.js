// ══════════════════════════════════════════════════════════
// ARELY — Household Expense Manager · 1311 Old Robinson Trail
// Everything in English · Pink palette · Budget-focused
// v2.0 — Multi-source import, income tracking, per-cat budgets, custom cats
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
  const cat = ARELY_CAT[k] || ARELY_INCOME_SOURCES[k];
  return cat?.emoji || '📦';
}

// ── CUSTOM CATEGORIES (localStorage) ─────────────────────
function loadCustomCategories(){
  try {
    const stored = localStorage.getItem('arely_custom_cats');
    if(!stored) return;
    const customs = JSON.parse(stored);
    customs.forEach(c => {
      if(c.k && c.label) ARELY_CAT[c.k] = {label:c.label, color:c.color||'#90A4AE', emoji:c.emoji||'📦'};
    });
  } catch(e){}
}

function saveCustomCategoryData(k, label, color, emoji){
  try {
    const stored = localStorage.getItem('arely_custom_cats');
    const customs = stored ? JSON.parse(stored) : [];
    const idx = customs.findIndex(c => c.k === k);
    const entry = {k, label, color, emoji};
    if(idx >= 0) customs[idx] = entry; else customs.push(entry);
    localStorage.setItem('arely_custom_cats', JSON.stringify(customs));
    ARELY_CAT[k] = {label, color, emoji};
  } catch(e){ alert('Error saving custom category'); }
}

function openCreateCategoryModal(){
  document.getElementById('arelyCatModalOverlay')?.remove();
  const overlay = document.createElement('div');
  overlay.id = 'arelyCatModalOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9500;display:flex;align-items:flex-end;justify-content:center';
  overlay.innerHTML = `
    <div style="background:#fff;border-radius:20px 20px 0 0;width:100%;max-width:430px;padding:22px 18px 32px;box-shadow:0 -4px 24px rgba(0,0,0,.15)">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <span style="font-weight:800;font-size:1.05rem;color:var(--arely-dark)">➕ New Category</span>
        <button onclick="document.getElementById('arelyCatModalOverlay').remove()" style="background:none;border:none;font-size:1.3rem;cursor:pointer">✕</button>
      </div>
      <label style="font-size:.75rem;font-weight:700;color:var(--muted);text-transform:uppercase">Category Name</label>
      <input id="newCatName" type="text" maxlength="24" placeholder="e.g. Gym, Childcare…"
        style="width:100%;padding:12px 14px;border:2px solid var(--arely-lighter);border-radius:10px;font-size:.95rem;margin:6px 0 14px;box-sizing:border-box">
      <div style="display:flex;gap:12px;align-items:flex-end;margin-bottom:14px">
        <div style="flex:1">
          <label style="font-size:.75rem;font-weight:700;color:var(--muted);text-transform:uppercase">Emoji</label>
          <input id="newCatEmoji" type="text" maxlength="2" placeholder="📦" value="📦"
            style="width:100%;padding:12px 14px;border:2px solid var(--arely-lighter);border-radius:10px;font-size:1.4rem;margin-top:6px;text-align:center;box-sizing:border-box">
        </div>
        <div style="flex:1">
          <label style="font-size:.75rem;font-weight:700;color:var(--muted);text-transform:uppercase">Color</label>
          <input id="newCatColor" type="color" value="#D06B8D"
            style="width:100%;height:48px;border:2px solid var(--arely-lighter);border-radius:10px;padding:4px;margin-top:6px;cursor:pointer;box-sizing:border-box">
        </div>
      </div>
      <button onclick="saveCustomCategoryFromModal()" class="btn btn-arely" style="margin-top:0">✅ Save Category</button>
    </div>`;
  overlay.addEventListener('click', e => { if(e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
  setTimeout(() => document.getElementById('newCatName').focus(), 100);
}

function saveCustomCategoryFromModal(){
  const name  = (document.getElementById('newCatName').value||'').trim();
  const emoji = (document.getElementById('newCatEmoji').value||'📦').trim() || '📦';
  const color = document.getElementById('newCatColor').value || '#90A4AE';
  if(!name){ alert('Please enter a category name.'); return; }
  const k = 'custom_' + name.toLowerCase().replace(/[^a-z0-9]/g,'_').slice(0,20) + '_' + Date.now().toString(36).slice(-4);
  saveCustomCategoryData(k, name, color, emoji);
  document.getElementById('arelyCatModalOverlay')?.remove();
  // Re-render the category grid if Add Expense view is open
  if(document.getElementById('avAddExpense').classList.contains('active')) buildArelyCatGrid('arelyCatGrid', v => arelySelectedCat = v);
  // Re-render budget view
  if(document.getElementById('avBudget').classList.contains('active')) loadArelyBudgetView();
  showToast('Category "' + name + '" created!');
}

function showToast(msg){
  let t = document.getElementById('arelyToast');
  if(!t){ t = document.createElement('div'); t.id='arelyToast'; document.body.appendChild(t); }
  t.textContent = msg;
  t.className = 'arely-toast arely-toast-show';
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('arely-toast-show'), 2500);
}

// Custom category grid for Arely
function buildArelyCatGrid(containerId, onSelect){
  document.getElementById(containerId).innerHTML = Object.entries(ARELY_CAT).map(([k,v]) => {
    const icon = k === 'sam' ? samIcon(20) : `<span class="opt-icon">${v.emoji}</span>`;
    return `<button class="opt-btn" onclick="this.parentElement.querySelectorAll('.opt-btn').forEach(b=>b.classList.remove('sel','sel-arely'));this.classList.add('sel-arely');(${onSelect.toString()})('${k}')">
    ${icon}${v.label.replace(/^[^\s]+\s/,'')}</button>`;
  }).join('') +
  `<button class="opt-btn" style="border:2px dashed var(--arely-lighter);color:var(--arely)" onclick="openCreateCategoryModal()">
    <span class="opt-icon">➕</span>New</button>`;
}

// ── PER-CATEGORY BUDGETS ──────────────────────────────────
function getCatBudgets(m, y){
  const mo = m || arelyViewMonth;
  const yr = y || arelyViewYear;
  const key = `arely_cat_budgets_${yr}-${String(mo).padStart(2,'0')}`;
  try { return JSON.parse(localStorage.getItem(key) || '{}'); } catch(e){ return {}; }
}

function setCatBudget(cat, amount, m, y){
  const mo = m || arelyViewMonth;
  const yr = y || arelyViewYear;
  const key = `arely_cat_budgets_${yr}-${String(mo).padStart(2,'0')}`;
  const budgets = getCatBudgets(mo, yr);
  const val = parseFloat(amount);
  if(val > 0) budgets[cat] = val; else delete budgets[cat];
  localStorage.setItem(key, JSON.stringify(budgets));
}

function getTotalBudgetForMonth(m, y){
  const budgets = getCatBudgets(m, y);
  const total = Object.values(budgets).reduce((s, v) => s + parseFloat(v||0), 0);
  // Fallback: use legacy global budget if no cat budgets set
  if(total === 0){
    const legacyKey = `arely_budget_${(y||arelyViewYear)}-${String(m||arelyViewMonth).padStart(2,'0')}`;
    return parseFloat(localStorage.getItem(legacyKey) || arelyBudget) || 0;
  }
  return total;
}

// ── STATE ─────────────────────────────────────────────────
let arelyViewMonth = new Date().getMonth() + 1;
let arelyViewYear  = new Date().getFullYear();
let arelyFilterCat = null;
let arelyRepeat    = 'none';

// ── AUTO-CATEGORIZER ─────────────────────────────────────
function arelyCategorize(desc){
  const d = desc.toUpperCase();
  // ── Taxes ─────────────────────────────────────────────
  if(/\bIRS\b|USATAXPYMT|NC DEPT REVENUE|TAX PYMT|STATE.*TAX|DEPT.*REVENUE/.test(d)) return 'taxes';
  // ── Investments ───────────────────────────────────────
  if(/FINHABITS|ACORNS|BETTERMENT|WEALTHFRONT|ROBINHOOD|STASH|INVEST/.test(d)) return 'investments';
  // ── Mortgage / Savings ────────────────────────────────
  if(/LATINO COMMUNITY CREDIT UNION|LCCU|RECURRING TRANSFER.*XXXX2504/.test(d)) return 'mortgage_sav';
  // ── Remittances ───────────────────────────────────────
  if(/REMITLY|RMTLY\*|WESTERN UNION|MONEYGRAM|MONEY TRANSFER.*RMTLY/.test(d)) return 'remittance';
  // ── Credit Card Payments ──────────────────────────────
  if(/WF CREDIT CARD|AMERICAN EXPRESS ACH|AMZ_STORECRD_PMT|VISA SIGNATURE CARD|AUTO PAY.*CREDIT|CREDIT CARD.*PAY/.test(d)) return 'creditcard';
  // ── Amazon ────────────────────────────────────────────
  if(/AMAZON|AMZN/.test(d)) return 'amazon';
  // ── Bank Fees ─────────────────────────────────────────
  if(/MONTHLY SERVICE FEE|OVERDRAFT|NSF FEE|SERVICE FEE|ROCKET MONEY/.test(d)) return 'bankfee';
  // ── Transfers / Zelle ─────────────────────────────────
  if(/ZELLE TO|ZELLE FROM|VENMO|CASHAPP|CASH APP/.test(d)) return 'transfer';
  // ── Electricity ───────────────────────────────────────
  if(/DUKE ENERGY|DUKEENERGY|POWER|ELECTRIC|ENERGY BILL|SCE&G|DOMINION/.test(d)) return 'electricity';
  // ── Water ─────────────────────────────────────────────
  if(/WATER|CHARLOTTE WATER|AQUA|SEWER/.test(d)) return 'water';
  // ── Gas ───────────────────────────────────────────────
  if(/PIEDMONT NATURAL|PIEDMONT GAS|NATURAL GAS|ATMOS|\bGAS\b|SHELL|EXXON|CIRCLE K|SPEEDWAY|MARATHON|\bQT\b|QUIKTRIP|CHEVRON|\bBP\b|WAWA|RACETRAC|SHEETZ/.test(d)) return 'gas';
  // ── Internet / Streaming ──────────────────────────────
  if(/SPECTRUM|AT&T|ATT |COMCAST|XFINITY|VERIZON FIO|GOOGLE FIBER|TMOBILE HOME|STARLINK|HULU|NETFLIX|DISNEY\+|YOUTUBE|APPLE\.COM|SPOTIFY/.test(d)) return 'internet';
  // ── Phone ─────────────────────────────────────────────
  if(/T-MOBILE|TMOBILE|VERIZON WIRE|CRICKET|BOOST MOBILE|METRO BY|MINT MOBILE|VISIBLE/.test(d)) return 'phone';
  // ── Groceries ─────────────────────────────────────────
  if(/WALMART|ALDI|LIDL|FOOD LION|PUBLIX|KROGER|HARRIS TEETER|TRADER JOE|WHOLE FOODS|COSTCO|SAM'S CLUB|TARGET|DOLLAR TREE|DOLLAR GEN|FAMILY DOLLAR|GROCERY|PRICESMART/.test(d)) return 'groceries';
  // ── Rent ──────────────────────────────────────────────
  if(/\bRENT\b|LEASE|HOA |PROPERTY|ZILLOW|APARTMENT/.test(d)) return 'rent';
  // ── Pet (Sam) ─────────────────────────────────────────
  if(/\bPET\b|PETCO|PETSMART|\bVET\b|VETERINAR|BANFIELD|CHEWY|\bDOG\b|PUPPY|GROOM/.test(d)) return 'sam';
  // ── Transportation ────────────────────────────────────
  if(/\bUBER\b|LYFT|DMV|CAR WASH|JIFFY|FIRESTONE|AUTOZONE|O'REILLY|ADVANCE AUTO|PARKING|TOLL|EZ PASS/.test(d)) return 'transport';
  // ── Health ────────────────────────────────────────────
  if(/PHARMACY|CVS|WALGREEN|RITE AID|DOCTOR|HOSPITAL|URGENT|DENTAL|OPTOM|MEDIC|HEALTH|HIMS|PRESCRIPTION/.test(d)) return 'health';
  // ── Home Maintenance ──────────────────────────────────
  if(/LOWES|LOWE'S|HOME DEPOT|HARDWARE|PLUMB|ROOF|REPAIR|CLEANING|MAID|LAWN/.test(d)) return 'maintenance';
  // ── Dining ────────────────────────────────────────────
  if(/DOORDASH|GRUBHUB|UBEREATS|MCDONALD|CHICK-FIL|WENDY|BURGER|PIZZA|RESTAURANT|GRILL|DINER|CAFE|COFFEE|STARBUCK|DUNKIN|TACO|CHIPOTLE|OLIVE GARDEN|IHOP|WAFFLE|BUFFET|KEBAB/.test(d)) return 'dining';
  // ── Insurance ─────────────────────────────────────────
  if(/INSURANCE|GEICO|STATE FARM|ALLSTATE|PROGRESSIVE|LIBERTY MUTUAL|USAA/.test(d)) return 'insurance';
  // ── Clothing ──────────────────────────────────────────
  if(/SHEIN|ZARA|\bH&M\b|OLD NAVY|\bGAP\b|ROSS STORES|MARSHALL|TJ MAXX|NORDSTROM|MACYS|FASHION|CLOTH|APPAREL/.test(d)) return 'clothing';
  // ── Entertainment ─────────────────────────────────────
  if(/CINEMA|MOVIE|AMC |REGAL|STEAM GAMES|PLAYSTATION|XBOX|BOWLING|CONCERT|TICKETMASTER/.test(d)) return 'entertainment';
  // ── Skip (payment confirmation rows from CC statements) ─
  if(/^AUTOMATIC PAYMENT|THANK YOU FOR YOUR PAYMENT$/.test(d)) return 'SKIP';
  return 'other';
}

// ── INCOME SOURCE CATEGORIZER ─────────────────────────────
function arelyIncomeSource(desc){
  const d = desc.toUpperCase();
  if(/RIVERA'S INVESTMENTS|BUSINESS CHECKING|PAYCHECK/.test(d)) return 'payroll';
  if(/ZELLE FROM|WT FED|WIRE TRANSFER|ONLINE TRANSFER FROM/.test(d)) return 'transfer_in';
  if(/ATM CASH DEPOSIT|MOBILE DEPOSIT|CASH DEPOSIT/.test(d)) return 'deposit';
  if(/REFUND|STATEMENT CREDIT|CREDIT ADJ/.test(d)) return 'refund';
  return 'income_other';
}

// ── NAVIGATION ───────────────────────────────────────────
function arelyShow(name){
  document.querySelectorAll('#arelyShell .view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('#arelyBottomNav .nav-btn').forEach(b => b.classList.remove('active','a-active'));
  const viewEl = document.getElementById('av' + name);
  if(viewEl) viewEl.classList.add('active');
  const btn = document.getElementById('an' + name);
  if(btn){ btn.classList.add('active','a-active'); }
  if(name === 'Dashboard')  loadArelyDashboard();
  if(name === 'AddExpense') { buildArelyCatGrid('arelyCatGrid', v => arelySelectedCat = v); loadArelyRecentExp(); }
  if(name === 'Upload')     { /* ready */ }
  if(name === 'Budget')     loadArelyBudgetView();
  if(name === 'Calendar')   renderArelyCalendar();
  if(name === 'Checklist')  { buildArelyTodoCatGrid(); loadArelyTodos(); }
  if(name === 'Income')     loadArelyIncomeView();
}

// ── LOAD ALL DATA ────────────────────────────────────────
async function loadArelyData(){
  const COLS = 'id,date,description,category,cat_label,month,month_display,month_num,year,amount,type,person,direction,created_at,edited_at,edited_by';
  const {data} = await db.from('transactions')
    .select(COLS).eq('person','arely')
    .order('created_at',{ascending:false});
  arelyTx = data || [];

  // Compute global budget from per-cat budgets (or fallback to legacy)
  arelyBudget = getTotalBudgetForMonth();
  renderArelyBanner();
}

function getCurrentMonthKey(){
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
}

function getArelyMonthTx(m, y){
  return arelyTx.filter(t => {
    const mn = t.month_num || parseInt((t.date||'').split('/')[1]) || 0;
    const yr = t.year || (t.created_at ? new Date(t.created_at).getFullYear() : 0);
    return mn === (m || arelyViewMonth) && yr === (y || arelyViewYear) && t.direction === 'expense';
  });
}

function getArelyMonthIncomeTx(m, y){
  return arelyTx.filter(t => {
    const mn = t.month_num || parseInt((t.date||'').split('/')[1]) || 0;
    const yr = t.year || (t.created_at ? new Date(t.created_at).getFullYear() : 0);
    return mn === (m || arelyViewMonth) && yr === (y || arelyViewYear) && t.direction === 'income';
  });
}

function getArelyCurrentMonthTx(){ return getArelyMonthTx(); }

// ── MONTH PICKER ─────────────────────────────────────────
function renderArelyMonthPicker(){
  const now = new Date();
  const months = [];
  for(let i = 11; i >= 0; i--){
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ m: d.getMonth()+1, y: d.getFullYear(),
      label: MONTHS_EN[d.getMonth()+1]?.slice(0,3) + ' ' + d.getFullYear() });
  }
  const picker = document.getElementById('arelyMonthPicker');
  picker.innerHTML = months.map(mo => {
    const isActive = mo.m === arelyViewMonth && mo.y === arelyViewYear;
    return `<button class="arely-month-chip${isActive?' active':''}"
      onclick="arelySetViewMonth(${mo.m},${mo.y})">${mo.label}</button>`;
  }).join('');
  setTimeout(() => {
    const active = picker.querySelector('.active');
    if(active) active.scrollIntoView({inline:'center', behavior:'smooth'});
  }, 50);
}

function arelySetViewMonth(m, y){
  arelyViewMonth = m;
  arelyViewYear  = y;
  arelyFilterCat = null;
  arelyBudget = getTotalBudgetForMonth();
  renderArelyMonthPicker();
  renderArelyMonthSummary();
  renderArelyCatBreakdown(getArelyMonthTx());
  renderArelyDonut(getArelyMonthTx());
  renderArelyTxTable();
  renderArelyIncomeSummaryCard();
  hideCatTxPanel();
}

// ── MONTH SUMMARY BAR ────────────────────────────────────
function renderArelyMonthSummary(){
  const monthTx   = getArelyMonthTx();
  const incomeTx  = getArelyMonthIncomeTx();
  const spent     = sumAmt(monthTx);
  const income    = sumAmt(incomeTx);
  const bgt       = getTotalBudgetForMonth();
  const over      = spent > bgt && bgt > 0;
  const diff      = Math.abs(bgt - spent);
  const pct       = bgt > 0 ? Math.min(100, (spent/bgt)*100) : 0;
  const color     = pct > 90 ? 'var(--red)' : pct > 70 ? '#f59e0b' : 'var(--arely)';
  const isCurrentMonth = arelyViewMonth === (new Date().getMonth()+1) && arelyViewYear === new Date().getFullYear();
  const monthLabel = MONTHS_EN[arelyViewMonth] + ' ' + arelyViewYear;
  const netFlow   = income - spent;

  const bottomRight = over
    ? `<span style="color:var(--red);font-weight:600">${fmtUSD(diff)} over budget</span>`
    : `<span>${fmtUSD(diff)} remaining</span>`;

  document.getElementById('arelyMonthSummary').innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
      <div>
        <div style="font-size:.72rem;text-transform:uppercase;color:var(--muted);font-weight:700">${monthLabel}${isCurrentMonth?' · Current Month':''}</div>
        <div style="font-size:1.3rem;font-weight:800;color:${over?'var(--red)':'var(--arely-dark)'}">${fmtUSD(spent)} spent</div>
      </div>
      <div style="text-align:right">
        ${bgt > 0 ? `<div style="font-size:.72rem;color:var(--muted)">Budget</div>
        <div style="font-size:1rem;font-weight:700;color:${color}">${fmtUSD(bgt)}</div>` : `<div style="font-size:.78rem;color:var(--muted)">No budget set</div>`}
      </div>
    </div>
    ${bgt > 0 ? `
    <div class="arely-budget-bar-wrap" style="margin:0">
      <div class="arely-budget-bar${pct>90?' bar-danger':pct>70?' bar-warning':''}" style="width:${pct}%"></div>
    </div>
    <div style="display:flex;justify-content:space-between;font-size:.72rem;color:var(--muted);margin-top:4px">
      <span>${pct.toFixed(0)}% used</span>
      ${bottomRight}
    </div>` : ''}
    ${income > 0 ? `
    <div style="margin-top:10px;padding-top:10px;border-top:1px dashed #f0e8ed;display:flex;justify-content:space-between;align-items:center">
      <span style="font-size:.78rem;color:var(--muted)">💼 Income this month</span>
      <span style="font-weight:700;color:#43A047">${fmtUSD(income)}</span>
    </div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:4px">
      <span style="font-size:.78rem;color:var(--muted)">Net flow</span>
      <span style="font-weight:700;font-size:.88rem;color:${netFlow>=0?'#43A047':'var(--red)'}">${netFlow>=0?'+':''}${fmtUSD(netFlow)}</span>
    </div>` : ''}
  `;
}

// ── BANNER ───────────────────────────────────────────────
function renderArelyBanner(){
  const monthTx = getArelyCurrentMonthTx();
  const spent   = sumAmt(monthTx);
  const bgt     = getTotalBudgetForMonth(new Date().getMonth()+1, new Date().getFullYear());
  const over    = spent > bgt && bgt > 0;
  const diff    = Math.abs(bgt - spent);
  const pct     = bgt > 0 ? Math.min(100, (spent / bgt) * 100) : 0;

  document.getElementById('arelyBudgetTotal').textContent    = fmtUSD(bgt);
  document.getElementById('arelyBannerSpent').textContent    = fmtUSD(spent);

  const remEl = document.getElementById('arelyBannerRemaining');
  remEl.textContent = fmtUSD(diff);
  remEl.style.color = over ? 'var(--red)' : '';
  const remLabel = remEl.closest('.bal-chip')?.querySelector('.bc-label');
  if(remLabel){
    remLabel.textContent = over ? '⚠️ Over Budget' : '✅ Remaining';
    remLabel.style.color = over ? 'var(--red)' : '';
  }

  const bar = document.getElementById('arelyBudgetBar');
  bar.style.width = pct + '%';
  bar.className = 'arely-budget-bar' + (pct > 90 ? ' bar-danger' : pct > 70 ? ' bar-warning' : '');
  document.getElementById('arelyBudgetPct').textContent = pct.toFixed(0) + '%';
  document.getElementById('arelyHdrSub').textContent = `${MONTHS_EN[new Date().getMonth()+1]} · ${fmtUSD(spent)} spent`;
}

// ── INCOME SUMMARY CARD (in Dashboard) ───────────────────
function renderArelyIncomeSummaryCard(){
  const incomeTx = getArelyMonthIncomeTx();
  const card     = document.getElementById('arelyIncomeCard');
  if(!card) return;

  if(!incomeTx.length){
    card.innerHTML = '<p style="color:var(--muted);text-align:center;padding:16px;font-size:.82rem">No income recorded this month.</p>';
    return;
  }

  const totalIncome = sumAmt(incomeTx);
  // Group by source category
  const sources = {};
  incomeTx.forEach(t => { sources[t.category] = (sources[t.category]||0) + parseFloat(t.amount||0); });
  const sorted = Object.entries(sources).sort((a,b) => b[1]-a[1]);

  card.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:0 0 12px;border-bottom:1px solid #f0f0f0;margin-bottom:10px">
      <div>
        <div style="font-size:.72rem;text-transform:uppercase;color:var(--muted);font-weight:700">Total Income</div>
        <div style="font-size:1.3rem;font-weight:800;color:#43A047">${fmtUSD(totalIncome)}</div>
      </div>
      <div style="text-align:right;font-size:.78rem;color:var(--muted)">${incomeTx.length} transaction${incomeTx.length===1?'':'s'}</div>
    </div>
    ${sorted.map(([k, amt]) => {
      const src  = ARELY_INCOME_SOURCES[k] || ARELY_CAT[k] || {emoji:'💰', label:k, color:'#8E24AA'};
      const pct  = ((amt/totalIncome)*100).toFixed(0);
      return `<div style="display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid #f9f9f9">
        <div style="width:32px;height:32px;border-radius:9px;background:${src.color}18;display:flex;align-items:center;justify-content:center;font-size:1rem;flex-shrink:0">${src.emoji}</div>
        <div style="flex:1;min-width:0">
          <div style="font-size:.8rem;font-weight:600">${src.label}</div>
          <div style="height:4px;background:#f0f0f0;border-radius:4px;margin-top:4px"><div style="height:100%;width:${pct}%;background:${src.color};border-radius:4px"></div></div>
        </div>
        <div style="font-weight:700;color:#43A047;font-size:.85rem">${fmtUSD(amt)}</div>
      </div>`;
    }).join('')}
    <div style="margin-top:10px">
      <button class="arely-history-toggle" onclick="toggleArelyIncomeList()"
        style="color:#43A047;border-color:#c8e6c9" id="arelyIncomeListToggle">
        📋 Show all transactions ▾
      </button>
      <div id="arelyIncomeTxList" style="display:none;margin-top:8px;max-height:280px;overflow-y:auto">
        <table style="width:100%;font-size:.76rem;border-collapse:collapse">
          ${incomeTx.map(t => `
          <tr style="border-bottom:1px solid #f5faf5">
            <td style="padding:6px 8px;white-space:nowrap;color:var(--muted)">${t.date||'—'}</td>
            <td style="padding:6px 8px;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${t.description}">${t.description}</td>
            <td style="padding:6px 8px;font-weight:700;color:#43A047;white-space:nowrap">${fmtUSD(t.amount)}</td>
            <td style="padding:6px 4px"><button class="del-btn" onclick="deleteTx('${t.id}','arely')">🗑</button></td>
          </tr>`).join('')}
        </table>
      </div>
    </div>`;
}

function toggleArelyIncomeList(){
  const list = document.getElementById('arelyIncomeTxList');
  const btn  = document.getElementById('arelyIncomeListToggle');
  if(!list||!btn) return;
  const open = list.style.display !== 'none';
  list.style.display = open ? 'none' : 'block';
  btn.innerHTML = `📋 ${open ? 'Show' : 'Hide'} all transactions ${open ? '▾' : '▴'}`;
}

// ── INCOME DEDICATED VIEW ────────────────────────────────
async function loadArelyIncomeView(){
  show('aIncomeLoading'); hide('aIncomeContent');
  await loadArelyData();
  hide('aIncomeLoading'); show('aIncomeContent');

  // Build 6-month income summary
  const now = new Date();
  const rows = [];
  for(let i = 5; i >= 0; i--){
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const m = d.getMonth()+1, y = d.getFullYear();
    const txs = arelyTx.filter(t => {
      const mn = t.month_num || parseInt((t.date||'').split('/')[1]) || 0;
      const yr = t.year || new Date(t.created_at).getFullYear();
      return mn === m && yr === y;
    });
    const income  = txs.filter(t=>t.direction==='income').reduce((s,t)=>s+parseFloat(t.amount||0),0);
    const expense = txs.filter(t=>t.direction==='expense').reduce((s,t)=>s+parseFloat(t.amount||0),0);
    rows.push({label: MONTHS_EN[m].slice(0,3)+' '+y, income, expense, net: income-expense});
  }

  const maxVal = Math.max(...rows.map(r=>r.income),1);

  document.getElementById('aIncomeContent').innerHTML = `
    <div class="chart-card">
      <div class="chart-hdr"><h3>💼 Income vs Expenses — Last 6 Months</h3></div>
      <div style="overflow-x:auto">
        <table style="width:100%;border-collapse:collapse;font-size:.8rem;min-width:340px">
          <thead>
            <tr style="background:var(--arely-bg)">
              <th style="padding:8px 10px;text-align:left">Month</th>
              <th style="padding:8px 10px;text-align:right;color:#43A047">Income</th>
              <th style="padding:8px 10px;text-align:right;color:var(--arely)">Expenses</th>
              <th style="padding:8px 10px;text-align:right">Net</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map(r=>`
            <tr style="border-bottom:1px solid #f5f0f3">
              <td style="padding:9px 10px;font-weight:600">${r.label}</td>
              <td style="padding:9px 10px;text-align:right;font-weight:700;color:#43A047">${fmtUSD(r.income)}</td>
              <td style="padding:9px 10px;text-align:right;font-weight:700;color:var(--arely)">${fmtUSD(r.expense)}</td>
              <td style="padding:9px 10px;text-align:right;font-weight:700;color:${r.net>=0?'#43A047':'var(--red)'}">${r.net>=0?'+':''}${fmtUSD(r.net)}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
    <div class="chart-card">
      <div class="chart-hdr"><h3>📋 ${MONTHS_EN[arelyViewMonth]} ${arelyViewYear} Income Detail</h3></div>
      <div id="arelyIncomeDetailList"></div>
    </div>`;

  renderArelyIncomeDetailList();
}

function renderArelyIncomeDetailList(){
  const incomeTx = getArelyMonthIncomeTx();
  const el = document.getElementById('arelyIncomeDetailList');
  if(!el) return;
  if(!incomeTx.length){
    el.innerHTML = '<p style="color:var(--muted);text-align:center;padding:20px">No income recorded for this month.</p>';
    return;
  }
  el.innerHTML = `
    <div style="padding:4px 0 10px;display:flex;justify-content:space-between;align-items:center">
      <span style="font-weight:800;color:#43A047;font-size:1.1rem">${fmtUSD(sumAmt(incomeTx))}</span>
      <span style="font-size:.78rem;color:var(--muted)">${incomeTx.length} transactions</span>
    </div>
    <div class="tx-wrap" style="margin:0">
      <table style="width:100%;border-collapse:collapse;font-size:.78rem">
        <thead><tr style="background:#f1f8f1">
          <th style="padding:6px 10px;text-align:left">Date</th>
          <th style="padding:6px 10px;text-align:left">Description</th>
          <th style="padding:6px 10px;text-align:left">Source</th>
          <th style="padding:6px 10px;text-align:right">Amount</th>
          <th></th>
        </tr></thead>
        <tbody>
          ${incomeTx.map(t => {
            const src = ARELY_INCOME_SOURCES[t.category] || {emoji:'💰', label:t.cat_label||'Income', color:'#43A047'};
            return `<tr style="border-bottom:1px solid #f5faf5">
              <td style="padding:7px 10px;white-space:nowrap">${t.date||'—'}</td>
              <td style="padding:7px 10px;max-width:130px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${t.description}">${t.description}</td>
              <td style="padding:7px 10px"><span style="background:${src.color}18;color:${src.color};padding:3px 8px;border-radius:8px;font-weight:600;font-size:.72rem">${src.emoji} ${src.label}</span></td>
              <td style="padding:7px 10px;text-align:right;font-weight:700;color:#43A047">${fmtUSD(t.amount)}</td>
              <td style="padding:7px 5px"><button class="del-btn" onclick="deleteTx('${t.id}','arely')">🗑</button></td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>`;
}

// ── DASHBOARD ────────────────────────────────────────────
async function loadArelyDashboard(){
  show('aDashLoading'); hide('aDashContent'); hide('aDashEmpty');
  await loadArelyData();
  hide('aDashLoading');

  if(!arelyTx.filter(t=>t.direction==='expense').length && !arelyTx.filter(t=>t.direction==='income').length){
    show('aDashEmpty'); return;
  }
  show('aDashContent');

  arelyFilterCat = null;
  renderArelyMonthPicker();
  renderArelyMonthSummary();
  const monthTx = getArelyMonthTx();
  renderArelyCatBreakdown(monthTx);
  renderArelyDonut(monthTx);
  renderArelyTrend();
  renderArelyTxTable();
  renderArelyIncomeSummaryCard();
  hideCatTxPanel();
}

// ── CATEGORY BREAKDOWN ───────────────────────────────────
function renderArelyCatBreakdown(tx){
  const cats = {};
  tx.forEach(t => { cats[t.category] = (cats[t.category]||0) + parseFloat(t.amount||0); });
  const sorted = Object.entries(cats).sort((a,b) => b[1]-a[1]);
  const total  = sorted.reduce((s,[,v]) => s+v, 0) || 1;

  document.getElementById('arelyCatBreakdown').innerHTML = sorted.map(([k, amt]) => {
    const cat    = ARELY_CAT[k] || {emoji:'📦', label:k, color:'#90A4AE'};
    const pct    = ((amt/total)*100).toFixed(1);
    const isActive = arelyFilterCat === k;
    const txCount  = tx.filter(t => t.category === k).length;
    return `
    <div class="arely-cat-row${isActive?' arely-cat-row-active':''}" onclick="arelySelectCatFilter('${k}')" title="Tap to filter">
      <div class="arely-cat-icon" style="background:${cat.color}20;color:${cat.color}">${k === 'sam' ? samIcon(28) : cat.emoji}</div>
      <div class="arely-cat-info">
        <div class="arely-cat-name">${cat.label} <span class="arely-cat-count">${txCount} tx</span></div>
        <div class="arely-cat-bar-wrap">
          <div class="arely-cat-bar" style="width:${pct}%;background:${cat.color};${isActive?'opacity:1':'opacity:.85'}"></div>
        </div>
      </div>
      <div class="arely-cat-amt">${fmtUSD(amt)}<span class="arely-cat-pct">${pct}%</span>
        ${isActive ? '<span class="arely-cat-arrow">▶</span>' : ''}
      </div>
    </div>`;
  }).join('') || '<p style="color:#aaa;text-align:center;padding:16px">No expenses this month.</p>';

  const badge = document.getElementById('arelyCatFilterBadge');
  if(badge) badge.style.display = arelyFilterCat ? 'inline-flex' : 'none';
}

function arelySelectCatFilter(cat){
  arelyFilterCat = (arelyFilterCat === cat) ? null : cat;
  const monthTx = getArelyMonthTx();
  renderArelyCatBreakdown(monthTx);
  if(arelyFilterCat){
    const filtered = monthTx.filter(t => t.category === arelyFilterCat);
    const catInfo  = ARELY_CAT[arelyFilterCat] || {label: arelyFilterCat, color:'#ccc', emoji:'📦'};
    showCatTxPanel(filtered, catInfo);
  } else {
    hideCatTxPanel();
  }
}

function showCatTxPanel(filtered, catInfo){
  const panel = document.getElementById('arelyCatTxPanel');
  const title = document.getElementById('arelyCatTxTitle');
  const list  = document.getElementById('arelyCatTxList');
  if(!panel) return;
  title.innerHTML = `${catInfo.emoji} ${catInfo.label} <span style="font-size:.75rem;color:var(--muted);font-weight:400">${filtered.length} transaction${filtered.length===1?'':'s'}</span>`;
  const total = sumAmt(filtered);
  list.innerHTML = filtered.length === 0
    ? '<p style="color:var(--muted);text-align:center;padding:14px;font-size:.85rem">No transactions in this category.</p>'
    : `<div style="padding:8px 14px 4px;font-size:.78rem;font-weight:700;color:${catInfo.color}">Total: ${fmtUSD(total)}</div>
    <div class="tx-wrap" style="margin:0;max-height:320px;overflow-y:auto">
    <table>
      <thead><tr style="background:${catInfo.color}15">
        <th style="padding:6px 10px">Date</th>
        <th style="padding:6px 10px">Description</th>
        <th style="padding:6px 10px;text-align:right">Amount</th>
        <th></th>
      </tr></thead>
      <tbody>
        ${filtered.map(t => `
        <tr style="border-bottom:1px solid #f5f0f3;background:${catInfo.color}08">
          <td style="padding:7px 10px;font-size:.78rem;white-space:nowrap">${t.date||'—'}</td>
          <td style="padding:7px 10px;font-size:.8rem;max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${t.description}">${t.description}</td>
          <td style="padding:7px 10px;text-align:right;font-weight:700;color:${catInfo.color}">${fmtUSD(t.amount)}</td>
          <td style="padding:7px 5px;white-space:nowrap"><button style="background:none;border:none;cursor:pointer;font-size:.85rem" onclick="openArelyCatEdit('${t.id}','${t.category}')" title="Change category">✏️</button><button class="del-btn" onclick="deleteTx('${t.id}','arely')">🗑</button></td>
        </tr>`).join('')}
      </tbody>
    </table>
    </div>`;
  panel.style.display = 'block';
  setTimeout(() => panel.scrollIntoView({behavior:'smooth', block:'nearest'}), 80);
}

function hideCatTxPanel(){
  const panel = document.getElementById('arelyCatTxPanel');
  if(panel) panel.style.display = 'none';
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

// ── SPENDING TREND ───────────────────────────────────────
function renderArelyTrend(){
  const now = new Date();
  const months = [];
  for(let i=5; i>=0; i--){
    const d = new Date(now.getFullYear(), now.getMonth()-i, 1);
    months.push({ label: MONTHS_EN[d.getMonth()+1]?.slice(0,3)||'', m: d.getMonth()+1, y: d.getFullYear() });
  }
  const expense = months.map(mo => arelyTx.filter(t => {
    const mn = t.month_num || parseInt((t.date||'').split('/')[1]) || 0;
    const yr = t.year || new Date(t.created_at).getFullYear();
    return mn === mo.m && yr === mo.y && t.direction === 'expense';
  }).reduce((s,t) => s + parseFloat(t.amount||0), 0));

  const income = months.map(mo => arelyTx.filter(t => {
    const mn = t.month_num || parseInt((t.date||'').split('/')[1]) || 0;
    const yr = t.year || new Date(t.created_at).getFullYear();
    return mn === mo.m && yr === mo.y && t.direction === 'income';
  }).reduce((s,t) => s + parseFloat(t.amount||0), 0));

  if(arelyTrendChart) arelyTrendChart.destroy();
  arelyTrendChart = new Chart(document.getElementById('arelyTrendCanvas'), {
    type: 'line',
    data: {
      labels: months.map(m => m.label),
      datasets: [
        {
          label: 'Expenses',
          data: expense,
          borderColor: '#D06B8D',
          backgroundColor: 'rgba(208,107,141,0.12)',
          fill: true, tension: 0.35,
          pointBackgroundColor: '#D06B8D', pointRadius: 5, pointHoverRadius: 7,
        },
        {
          label: 'Income',
          data: income,
          borderColor: '#43A047',
          backgroundColor: 'rgba(67,160,71,0.08)',
          fill: true, tension: 0.35,
          pointBackgroundColor: '#43A047', pointRadius: 5, pointHoverRadius: 7,
        },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: {display: true, labels:{font:{size:10}}},
        tooltip: {callbacks:{label: c => `${c.dataset.label}: ${fmtUSD(c.raw)}`}},
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
  const tx = getArelyMonthTx();
  const body = document.getElementById('arelyTxBody');
  if(!tx.length){
    body.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:18px;color:#aaa">No transactions this month.</td></tr>';
    return;
  }
  body.innerHTML = tx.map(t => `
    <tr${t.edited_at?' class="was-edited"':''}>
      <td>${t.date||'—'}${t.edited_at?'<span class="edited-mark">✏️</span>':''}</td>
      <td style="max-width:130px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${t.description}">${t.description}</td>
      <td><span class="badge b-arely-cat" style="cursor:pointer" onclick="openArelyCatEdit('${t.id}','${t.category}')" title="Tap to change category">${catEmoji(t.category)} ${ARELY_CAT[t.category]?.label||t.category} ✏️</span></td>
      <td class="amount-neg">${fmtUSD(t.amount)}</td>
      <td><button class="del-btn" onclick="deleteTx('${t.id}','arely')">🗑</button></td>
    </tr>`).join('');
}

// ── EDIT CATEGORY ─────────────────────────────────────────
function openArelyCatEdit(txId, currentCat){
  document.getElementById('arelyCatEditOverlay')?.remove();
  const cats = Object.entries(ARELY_CAT);
  const overlay = document.createElement('div');
  overlay.id = 'arelyCatEditOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9000;display:flex;align-items:flex-end;justify-content:center';
  overlay.innerHTML = `
    <div style="background:#fff;border-radius:18px 18px 0 0;width:100%;max-width:420px;max-height:70vh;overflow-y:auto;padding:18px 14px 28px;box-shadow:0 -4px 20px rgba(0,0,0,.15)">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <span style="font-weight:700;font-size:1rem;color:var(--arely-dark)">Change Category</span>
        <button onclick="document.getElementById('arelyCatEditOverlay').remove()" style="background:none;border:none;font-size:1.3rem;cursor:pointer;padding:4px">✕</button>
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">
        ${cats.map(([k,v]) => `
          <button onclick="saveArelyCatEdit('${txId}','${k}')"
            style="display:flex;flex-direction:column;align-items:center;gap:4px;padding:12px 6px;border-radius:12px;border:2px solid ${k===currentCat?v.color:'#eee'};background:${k===currentCat?v.color+'15':'#fafafa'};cursor:pointer;font-size:.75rem;font-weight:${k===currentCat?'700':'500'};color:${k===currentCat?v.color:'#555'}">
            <span style="font-size:1.4rem">${v.emoji}</span>
            ${v.label}
          </button>`).join('')}
      </div>
    </div>`;
  overlay.addEventListener('click', e => { if(e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
}

async function saveArelyCatEdit(txId, newCat){
  const catInfo = ARELY_CAT[newCat];
  const now = new Date().toISOString();
  const { error } = await db.from('transactions').update({
    category:  newCat,
    cat_label: catInfo?.label || newCat,
    edited_at: now,
  }).eq('id', txId);
  document.getElementById('arelyCatEditOverlay')?.remove();
  if(error){ alert('Error updating category: ' + error.message); return; }
  await loadArelyData();
  loadArelyDashboard();
}

// ── SAVE EXPENSE ─────────────────────────────────────────
async function saveArelyExpense(){
  const date = document.getElementById('arelyExpDate').value;
  const desc = document.getElementById('arelyExpDesc').value.trim();
  const amt  = parseFloat(document.getElementById('arelyExpAmt').value);
  const al   = document.getElementById('arelyAddAlert');
  if(!date || !desc || !amt || amt<=0 || !arelySelectedCat){
    showAlert(al, 'Please fill in all fields.', 'error'); return;
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
      <td style="padding:6px 5px;cursor:pointer" onclick="openArelyCatEdit('${t.id}','${t.category}')" title="Tap to change category">${catEmoji(t.category)}</td>
      <td style="padding:6px 4px;max-width:110px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${t.description}</td>
      <td style="padding:6px 4px;color:#D06B8D;font-weight:700">${fmtUSD(t.amount)}</td>
      <td><button class="del-btn" onclick="deleteTx('${t.id}','arely')">🗑</button></td>
    </tr>`).join('')}
  </table>`;
}

// ── BUDGET VIEW (per-category) ────────────────────────────
function loadArelyBudgetView(){
  renderArelyBudgetCategories();
}

function renderArelyBudgetCategories(){
  const monthTx  = getArelyMonthTx();
  const spending = {};
  monthTx.forEach(t => { spending[t.category] = (spending[t.category]||0) + parseFloat(t.amount||0); });

  const catBudgets = getCatBudgets();
  const totalBudget  = getTotalBudgetForMonth();
  const totalSpent   = sumAmt(monthTx);
  const monthLabel   = MONTHS_EN[arelyViewMonth] + ' ' + arelyViewYear;
  const isCurrentM   = arelyViewMonth === (new Date().getMonth()+1) && arelyViewYear === new Date().getFullYear();

  // All categories that have spending OR budget set
  const activeCats = new Set([...Object.keys(spending), ...Object.keys(catBudgets)]);
  const allCatsSorted = [...activeCats].sort((a,b) => (spending[b]||0) - (spending[a]||0));

  const summaryEl = document.getElementById('arelyBudgetSummaryCard');
  if(summaryEl){
    const pct = totalBudget > 0 ? Math.min(100,(totalSpent/totalBudget)*100).toFixed(0) : 0;
    const over = totalSpent > totalBudget && totalBudget > 0;
    summaryEl.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <div>
          <div style="font-size:.72rem;text-transform:uppercase;color:var(--muted);font-weight:700">${monthLabel}${isCurrentM?' · Current':''}</div>
          <div style="font-size:1.25rem;font-weight:800;color:${over?'var(--red)':'var(--arely-dark)'}">${fmtUSD(totalSpent)} spent</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:.72rem;color:var(--muted)">Total Budget</div>
          <div style="font-size:1rem;font-weight:700;color:var(--arely)">${fmtUSD(totalBudget)}</div>
        </div>
      </div>
      ${totalBudget > 0 ? `
      <div class="arely-budget-bar-wrap" style="margin:0">
        <div class="arely-budget-bar${over?' bar-danger':pct>70?' bar-warning':''}" style="width:${pct}%"></div>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:.72rem;color:var(--muted);margin-top:5px">
        <span>${pct}% used</span>
        <span>${over?'⚠️ '+fmtUSD(totalSpent-totalBudget)+' over':'✅ '+fmtUSD(totalBudget-totalSpent)+' remaining'}</span>
      </div>` : `<p style="font-size:.78rem;color:var(--muted);margin:0">Set budgets per category below to track your spending.</p>`}`;
  }

  const listEl = document.getElementById('arelyBudgetCatList');
  if(!listEl) return;

  // All categories (for setting budgets even with no spending yet)
  const allCats = Object.entries(ARELY_CAT);

  listEl.innerHTML = allCats.map(([k, cat]) => {
    const spent  = spending[k] || 0;
    const budget = catBudgets[k] || 0;
    const pct    = budget > 0 ? Math.min(100,(spent/budget)*100) : 0;
    const color  = pct > 90 ? 'var(--red)' : pct > 70 ? '#f59e0b' : cat.color;
    const icon   = k === 'sam' ? samIcon(26) : cat.emoji;
    return `
    <div class="arely-cat-budget-row" id="catbudget_${k}">
      <div class="arely-cat-icon" style="background:${cat.color}18;color:${cat.color};flex-shrink:0">${icon}</div>
      <div style="flex:1;min-width:0">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span style="font-size:.82rem;font-weight:600">${cat.label}</span>
          ${spent > 0 ? `<span style="font-size:.78rem;font-weight:700;color:${pct>90?'var(--red)':cat.color}">${fmtUSD(spent)}</span>` : ''}
        </div>
        ${budget > 0 ? `
        <div class="arely-cat-bar-wrap" style="margin:3px 0">
          <div class="arely-cat-bar" style="width:${pct}%;background:${color}"></div>
        </div>
        <div style="font-size:.68rem;color:var(--muted)">${pct.toFixed(0)}% of ${fmtUSD(budget)}</div>` : ''}
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;flex-shrink:0">
        <div style="display:flex;align-items:center;gap:6px">
          <span style="font-size:.7rem;color:var(--muted)">$</span>
          <input type="number" min="0" step="10" placeholder="Budget"
            value="${budget > 0 ? budget : ''}"
            style="width:80px;padding:6px 8px;border:1.5px solid var(--arely-lighter);border-radius:8px;font-size:.82rem;text-align:right;font-weight:600;color:var(--arely-dark)"
            onchange="setCatBudget('${k}', this.value); renderArelyBudgetCategories();"
            onfocus="this.style.borderColor='var(--arely)'" onblur="this.style.borderColor='var(--arely-lighter)'">
        </div>
        ${budget > 0 ? `<span style="font-size:.66rem;color:var(--muted)">budget</span>` : ''}
      </div>
    </div>`;
  }).join('');
}

// ── CALENDAR ─────────────────────────────────────────────
function renderArelyCalendar(){
  loadArelyData().then(() => {
    const now   = new Date();
    const year  = now.getFullYear();
    const month = now.getMonth();
    const today = now.getDate();
    const daysInMonth = new Date(year, month+1, 0).getDate();
    const firstDay   = new Date(year, month, 1).getDay();
    const monthTx = getArelyCurrentMonthTx();
    const spent   = sumAmt(monthTx);
    const bgt     = getTotalBudgetForMonth();
    const pct     = bgt > 0 ? (spent / bgt) * 100 : 0;
    const daysLeft = daysInMonth - today;
    const budgetAlert = pct >= 90 && daysLeft > 5;

    const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    let html = `<div class="arely-cal-title">${MONTHS_EN[month+1]} ${year}</div>`;
    html += '<div class="arely-cal-grid">';
    dayNames.forEach(d => { html += `<div class="arely-cal-hdr">${d}</div>`; });
    for(let i=0; i<firstDay; i++) html += '<div class="arely-cal-day empty"></div>';
    for(let d=1; d<=daysInMonth; d++){
      let cls = 'arely-cal-day';
      if(d === today) cls += ' cal-today-day';
      else if(d < today) cls += ' cal-past-day';
      else if(budgetAlert) cls += ' cal-alert-day';
      html += `<div class="${cls}">${d}</div>`;
    }
    html += '</div>';
    document.getElementById('arelyCalendar').innerHTML = html;

    const statusColor = pct >= 90 ? '#e53935' : pct >= 70 ? '#f57c00' : '#43a047';
    const statusText  = pct >= 90
      ? (daysLeft > 5 ? `⚠️ Budget is ${pct.toFixed(0)}% used with ${daysLeft} days remaining!` : `Budget is ${pct.toFixed(0)}% used — ${daysLeft} days left`)
      : `Budget is ${pct.toFixed(0)}% used — ${daysLeft} days remaining`;

    document.getElementById('arelyCalBudgetStatus').innerHTML = `
      <div class="arely-cal-status" style="border-left:4px solid ${statusColor}">
        <div class="arely-cal-status-pct" style="color:${statusColor}">${pct.toFixed(0)}%</div>
        <div class="arely-cal-status-text">${statusText}</div>
        <div class="arely-cal-status-detail">
          ${fmtUSD(spent)} of ${fmtUSD(bgt)} · ${fmtUSD(Math.max(0, bgt - spent))} remaining
        </div>
      </div>`;
  });
}

// ── CSV / PDF UPLOAD ──────────────────────────────────────
let arelyPendingCsv = [];

function arelyDragOver(e){ e.preventDefault(); document.getElementById('arelyUploadArea').classList.add('drag'); }
function arelyDragLeave(){ document.getElementById('arelyUploadArea').classList.remove('drag'); }
function arelyDrop(e){ e.preventDefault(); arelyDragLeave(); const f = e.dataTransfer.files[0]; if(f) arelyProcessFile(f); }
function arelyFileSelect(e){ const f = e.target.files[0]; if(f) arelyProcessFile(f); }

function arelyProcessFile(f){
  const ext = f.name.split('.').pop().toLowerCase();
  if(ext === 'pdf'){
    arelyParsePDF(f);
  } else {
    const reader = new FileReader();
    reader.onload = e => { arelyPendingCsv = arelyParseCSV(e.target.result); arelyShowPreview(arelyPendingCsv, f.name); };
    reader.readAsText(f, 'utf-8');
  }
}

// ── CSV PARSER (Wells Fargo + generic) ───────────────────
function arelyParseCSV(content){
  const lines = content.split(/\r?\n/);
  const txns = [];
  for(let i = 0; i < lines.length; i++){
    const line = lines[i].trim();
    if(!line) continue;
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

    // Detect date format (MM/DD/YYYY or MM/DD/YY)
    const dateParts = cols[0].split('/');
    if(dateParts.length < 3) continue;
    const mm   = parseInt(dateParts[0]);
    const dd   = parseInt(dateParts[1]);
    let yyyy   = parseInt(dateParts[2]);
    if(yyyy < 100) yyyy += 2000;
    if(!mm || !dd || !yyyy || mm < 1 || mm > 12) continue;

    const amount = parseFloat(cols[1]);
    if(isNaN(amount) || amount === 0) continue;

    const desc = (cols[cols.length - 1] || cols[4] || cols[3] || cols[2] || '').replace(/\s{2,}/g,' ').trim();
    if(!desc) continue;

    const isExpense = amount < 0;
    const absAmt    = Math.abs(amount);
    const cat       = isExpense ? arelyCategorize(desc) : arelyIncomeSource(desc);

    if(cat === 'SKIP') continue;

    const fmtDate = `${String(mm).padStart(2,'0')}/${String(dd).padStart(2,'0')}`;

    if(isExpense){
      txns.push({
        date: fmtDate, description: desc,
        category: cat, cat_label: ARELY_CAT[cat]?.label || cat,
        month: MONTHS_EN[mm].toLowerCase(), month_display: MONTHS_EN[mm], month_num: mm, year: yyyy,
        amount: absAmt, type: 'bank', person: 'arely', direction: 'expense',
      });
    } else {
      txns.push({
        date: fmtDate, description: desc,
        category: cat, cat_label: ARELY_INCOME_SOURCES[cat]?.label || 'Income',
        month: MONTHS_EN[mm].toLowerCase(), month_display: MONTHS_EN[mm], month_num: mm, year: yyyy,
        amount: absAmt, type: 'bank', person: 'arely', direction: 'income',
      });
    }
  }
  return txns;
}

// ── PDF PARSER (Amazon Synchrony / Store Card) ────────────
async function arelyParsePDF(file){
  const al = document.getElementById('arelyUploadAlert');
  showAlert(al, '⏳ Reading PDF… this may take a few seconds.', 'success');

  try {
    if(!window.pdfjsLib){
      showAlert(al, '❌ PDF library not loaded. Please refresh and try again.', 'error');
      return;
    }
    window.pdfjsLib.GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await window.pdfjsLib.getDocument({data: arrayBuffer}).promise;

    // Extract all text with position info
    let textItems = [];
    for(let p = 1; p <= pdf.numPages; p++){
      const page    = await pdf.getPage(p);
      const content = await page.getTextContent();
      content.items.forEach(item => {
        if(item.str && item.str.trim()) textItems.push({
          str: item.str.trim(),
          x: Math.round(item.transform[4]),
          y: Math.round(item.transform[5]),
          page: p,
        });
      });
    }

    // Detect statement year from "from MM/DD/YYYY to MM/DD/YYYY"
    const fullText  = textItems.map(i=>i.str).join(' ');
    const yearMatch = fullText.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})\s+to\s+\d{1,2}\/\d{1,2}\/(\d{4})/);
    const stmtYear  = yearMatch ? parseInt(yearMatch[4]) : new Date().getFullYear();

    const txns = parseSynchronyStatement(textItems, stmtYear, file.name);
    hideAlert(al);
    if(!txns.length){
      showAlert(al, '⚠️ No transactions found. Make sure this is an Amazon Store Card PDF.', 'error');
      return;
    }
    arelyPendingCsv = txns;
    arelyShowPreview(txns, file.name);
  } catch(err){
    showAlert(al, '❌ Error reading PDF: ' + err.message, 'error');
  }
}

function parseSynchronyStatement(textItems, stmtYear, filename){
  // FIX: sort pages ASCENDING so we process page 1→N in reading order.
  // Within each page sort y DESCENDING (PDF y=0 is bottom, so high y = top of page).
  textItems.sort((a,b) => a.page !== b.page ? a.page - b.page : b.y - a.y);

  // Group adjacent items into rows (same page, y within ±3px).
  // Because items are already sorted, we only need to check the last row.
  const rows = [];
  textItems.forEach(item => {
    const last = rows[rows.length - 1];
    if(last && last.page === item.page && Math.abs(last.y - item.y) <= 3){
      last.items.push(item);
    } else {
      rows.push({y: item.y, page: item.page, items: [item]});
    }
  });
  // rows is now top-to-bottom, page 1 first — no re-sort needed.

  const dateRe = /^(\d{1,2})\/(\d{2})$/;
  const refRe  = /^[A-Z0-9]{10,}$/;
  let inTransactions = false;
  const txns = [];

  for(const row of rows){
    const sorted = row.items.sort((a,b) => a.x - b.x);
    const tokens = sorted.map(i => i.str.trim()).filter(Boolean);
    if(!tokens.length) continue;
    const joined = tokens.join(' ');

    // Start capturing after "Transaction Detail" or "Purchases and Other Debits"
    if(/Transaction Detail|Purchases.*Debits/.test(joined)){ inTransactions = true; continue; }
    // Stop only at the per-period totals line (not the YTD section)
    if(/Total Fees Charged This Period|Total Interest Charged This Period/.test(joined)) break;
    if(!inTransactions) continue;

    // Transaction rows start with MM/DD
    const dateMatch = tokens[0].match(dateRe);
    if(!dateMatch) continue;
    const mm = parseInt(dateMatch[1]);
    const dd = dateMatch[2];
    if(mm < 1 || mm > 12) continue;

    // Last token must be a dollar amount, optionally negative
    const lastToken = tokens[tokens.length - 1];
    const amtMatch  = lastToken.match(/^(-)?\$?([\d,]+\.\d{2})$/);
    if(!amtMatch) continue;
    const amount = parseFloat(amtMatch[2].replace(/,/g,''));
    if(isNaN(amount) || amount === 0) continue;

    // Description = middle tokens minus the reference code
    const midTokens  = tokens.slice(1, tokens.length - 1);
    const descTokens = midTokens.filter(t => !refRe.test(t));
    const desc = descTokens.join(' ').replace(/\s{2,}/g,' ').trim();
    if(!desc) continue;

    const isNeg = !!amtMatch[1];

    // Skip autopay confirmation lines
    if(/AUTOMATIC PAYMENT|THANK YOU FOR YOUR PAYMENT/i.test(desc)) continue;

    const direction = isNeg ? 'income' : 'expense';
    const cat = direction === 'expense' ? arelyCategorize(desc) : arelyIncomeSource(desc);
    if(cat === 'SKIP') continue;

    const fmtDate   = `${String(mm).padStart(2,'0')}/${dd}`;
    const catLabel  = direction === 'expense'
      ? (ARELY_CAT[cat]?.label || cat)
      : (ARELY_INCOME_SOURCES[cat]?.label || 'Income');

    txns.push({
      date: fmtDate, description: desc,
      category: cat, cat_label: catLabel,
      month: MONTHS_EN[mm].toLowerCase(), month_display: MONTHS_EN[mm],
      month_num: mm, year: stmtYear,
      amount, type: 'credit_card', person: 'arely', direction,
    });
  }
  return txns;
}

// ── PREVIEW & IMPORT ──────────────────────────────────────
function arelyTxFingerprint(t){
  return `${t.date}|${parseFloat(t.amount).toFixed(2)}|${(t.description||'').toUpperCase().replace(/\s+/g,' ').trim()}`;
}

function arelyShowPreview(txns, filename){
  const al = document.getElementById('arelyUploadAlert');
  if(!txns.length){ showAlert(al, 'No transactions found in this file.', 'error'); return; }
  hideAlert(al);

  const existingFP = new Set(arelyTx.map(t => arelyTxFingerprint(t)));
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
      <tbody>${txns.slice(0,100).map(t => {
        const catInfo = t.direction==='income'
          ? (ARELY_INCOME_SOURCES[t.category]||{emoji:'💰',label:t.cat_label||'Income'})
          : (ARELY_CAT[t.category]||{emoji:'📦',label:t.category});
        return `
        <tr style="border-bottom:1px solid #f5f0f3;${t._isDup ? 'opacity:.45;background:#fff3f3;' : ''}">
          <td style="padding:3px 7px">${t.date}</td>
          <td style="padding:3px 7px;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${escHtml(t.description)}">${escHtml(t.description)}</td>
          <td style="padding:3px 7px"><span class="badge b-arely-cat" style="${t.direction==='income'?'background:#e8f5e9;color:#2e7d32':''}">${catInfo.emoji} ${catInfo.label}</span></td>
          <td style="padding:3px 7px;text-align:right;color:${t.direction==='income'?'#43A047':'var(--red)'};font-weight:600">${fmtUSD(t.amount)}</td>
          <td style="padding:3px 7px;text-align:center;font-size:.7rem">${t._isDup ? '⚠️ Dup' : '✅ New'}</td>
        </tr>`;}).join('')}
        ${txns.length > 100 ? `<tr><td colspan="5" style="text-align:center;padding:8px;color:var(--muted)">… and ${txns.length-100} more</td></tr>` : ''}
      </tbody>
    </table>`;

  const dupWarn    = document.getElementById('arelyDupWarning');
  const importBtn  = document.getElementById('arelyImportBtn');
  const replaceBtn = document.getElementById('arelyReplaceBtn');

  if(dupes.length > 0 && newOnes.length > 0){
    showAlert(dupWarn, `⚠️ ${dupes.length} duplicate${dupes.length===1?'':'s'} found. Only ${newOnes.length} new ones will be imported.`, 'error');
    importBtn.style.display  = 'block';
    importBtn.textContent    = `✅ Import ${newOnes.length} New Transactions`;
    replaceBtn.style.display = 'block';
    replaceBtn.textContent   = `🔄 Import ALL (${txns.length})`;
  } else if(dupes.length > 0 && newOnes.length === 0){
    showAlert(dupWarn, `⚠️ All ${dupes.length} transactions already exist. Nothing new to import.`, 'error');
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
  const toImport = arelyPendingCsv.filter(t => !t._isDup);
  if(!toImport.length){ showAlert(al, 'No new transactions to import.', 'error'); return; }
  btn.disabled = true; btn.textContent = 'Importing…';
  const clean = toImport.map(t => { const c = {...t}; delete c._isDup; return c; });
  const {error} = await db.from('transactions').insert(clean);
  btn.disabled = false;
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
  const clean = arelyPendingCsv.map(t => { const c = {...t}; delete c._isDup; return c; });
  const {error} = await db.from('transactions').insert(clean);
  btn.disabled = false;
  if(error){ showAlert(al, 'Error: ' + error.message, 'error'); return; }
  showAlert(al, `✅ ${clean.length} transactions imported!`, 'success');
  arelyCancelUpload();
  await loadArelyData();
}

function arelyCancelUpload(){
  arelyPendingCsv = [];
  document.getElementById('arelyPreviewSection').style.display = 'none';
  const inp = document.getElementById('arelyCsvInput');
  if(inp) inp.value = '';
  document.getElementById('arelyImportBtn').style.display = 'block';
  document.getElementById('arelyReplaceBtn').style.display = 'none';
}

// ── CHECKLIST / TODOS ────────────────────────────────────
function toggleArelyTodoForm(){
  const w = document.getElementById('arelyTodoFormWrap');
  const isOpen = w.style.display !== 'none';
  w.style.display = isOpen ? 'none' : 'block';
  if(!isOpen){
    arelyRepeat = 'none';
    document.querySelectorAll('#arelyRepeatOpts .arely-repeat-btn').forEach(b => {
      b.classList.toggle('sel-arely', b.dataset.val === 'none');
    });
  }
}

function arelySetRepeat(btn, val){
  arelyRepeat = val;
  document.querySelectorAll('#arelyRepeatOpts .arely-repeat-btn').forEach(b => b.classList.remove('sel-arely'));
  btn.classList.add('sel-arely');
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
    category:  arelySelectedTodoCat || 'other',
    completed: false, repeating: arelyRepeat || 'none',
  }]);
  if(error){ showAlert(al, 'Error: ' + error.message, 'error'); return; }
  showAlert(al, '✅ Task saved!', 'success');
  document.getElementById('arelyTodoTitle').value = '';
  document.getElementById('arelyTodoDate').value  = '';
  arelySelectedTodoCat = ''; arelyRepeat = 'none';
  document.querySelectorAll('#arelyTodoCatGrid .opt-btn').forEach(b => b.classList.remove('sel','sel-arely'));
  document.querySelectorAll('#arelyRepeatOpts .arely-repeat-btn').forEach(b => {
    b.classList.toggle('sel-arely', b.dataset.val === 'none');
  });
  loadArelyTodos();
}

async function loadArelyTodos(){
  const {data} = await db.from('todos')
    .select('id,title,due_date,completed,completed_at,category,created_at,repeating')
    .eq('person','arely')
    .order('completed',{ascending:true})
    .order('due_date',{ascending:true,nullsFirst:false})
    .order('created_at',{ascending:false});

  const todos   = data || [];
  const pending = todos.filter(t => !t.completed);
  const done    = todos.filter(t => t.completed);
  const total   = todos.length;
  const pct     = total > 0 ? Math.round((done.length / total) * 100) : 0;

  document.getElementById('arelyTodoProgress').innerHTML = total > 0 ? `
    <div class="arely-todo-prog-text">
      <span>✅ ${done.length} completed</span>
      <span>⏳ ${pending.length} pending</span>
    </div>
    <div class="arely-todo-prog-bar-wrap"><div class="arely-todo-prog-bar" style="width:${pct}%"></div></div>
    <div class="arely-todo-prog-pct">${pct}% complete</div>` : '';

  document.getElementById('arelyTodoList').innerHTML =
    pending.length
      ? '<div class="arely-todo-section-lbl">⏳ To Do</div>' + pending.map(t => renderArelyTodoItem(t, false)).join('')
      : '<div class="empty" style="padding:20px"><div class="empty-icon">📋</div><p>No pending tasks. You\'re all caught up!</p></div>';

  const doneCountEl = document.getElementById('arelyDoneCount');
  if(doneCountEl) doneCountEl.textContent = done.length ? `(${done.length})` : '';

  const doneDiv = document.getElementById('arelyDoneHistory');
  if(doneDiv && doneDiv.style.display !== 'none') renderArelyDoneHistory(done);
}

function renderArelyTodoItem(t, isHistory){
  const catInfo  = ARELY_TODO_CATS.find(c => c.k === t.category) || {icon:'💡', label:'Other'};
  const repeat   = t.repeating && t.repeating !== 'none' ? t.repeating : null;
  const repeatBadge = repeat
    ? `<span class="arely-repeat-badge">🔁 ${repeat.charAt(0).toUpperCase()+repeat.slice(1)}</span>` : '';
  let dueBadge = '';
  if(!isHistory && t.due_date){
    const daysLeft = Math.ceil((new Date(t.due_date) - new Date()) / 86400000);
    if(daysLeft <= 3 && daysLeft >= 0)
      dueBadge = `<span class="arely-due-soon">⚡ ${daysLeft === 0 ? 'Today!' : daysLeft === 1 ? 'Tomorrow' : `${daysLeft} days`}</span>`;
    else if(daysLeft < 0) dueBadge = `<span class="arely-overdue">⚠️ Overdue</span>`;
    else dueBadge = `<span class="arely-todo-due">📅 ${t.due_date}</span>`;
  }
  const completedWhen = isHistory && t.completed_at
    ? `<span style="font-size:.66rem;color:#aaa">Done ${new Date(t.completed_at).toLocaleDateString('en-US',{month:'short',day:'numeric'})}</span>` : '';
  const checkBtn = isHistory
    ? `<span class="arely-todo-check" style="cursor:default;font-size:1.2rem;padding:2px 6px">☑️</span>`
    : `<button class="arely-todo-check" onclick="markArelyTodoDone('${t.id}','${t.repeating||'none'}','${t.due_date||''}')">⬜</button>`;
  return `
  <div class="arely-todo-item" id="atodo${t.id}">
    ${checkBtn}
    <div class="arely-todo-body">
      <span class="arely-todo-cat-icon">${catInfo.icon}</span>
      <span class="arely-todo-title-text${isHistory?' strike':''}">${escHtml(t.title)}</span>
      ${dueBadge}${repeatBadge}${completedWhen}
    </div>
    ${isHistory ? `<button class="arely-undo-btn" onclick="undoArelyTodo('${t.id}')" title="Restore">↩️</button>` : ''}
  </div>`;
}

function renderArelyDoneHistory(done){
  const div = document.getElementById('arelyDoneHistory');
  if(!div) return;
  div.innerHTML = done.length
    ? done.map(t => renderArelyTodoItem(t, true)).join('')
    : '<p style="color:var(--muted);text-align:center;padding:14px;font-size:.82rem">No completed tasks yet.</p>';
}

function toggleArelyDoneHistory(){
  const div  = document.getElementById('arelyDoneHistory');
  const btn  = document.getElementById('arelyDoneToggle');
  if(!div || !btn) return;
  const open = div.style.display !== 'none';
  div.style.display = open ? 'none' : 'block';
  btn.innerHTML = `📂 Completed History <span id="arelyDoneCount">(${document.getElementById('arelyDoneCount')?.textContent||''})</span> ${open ? '▾' : '▴'}`;
  if(!open){
    db.from('todos').select('id,title,due_date,completed,completed_at,category,created_at,repeating')
      .eq('person','arely').eq('completed',true)
      .order('completed_at',{ascending:false})
      .then(({data}) => renderArelyDoneHistory(data||[]));
  }
}

const VALID_REPEATS = ['weekly','monthly','yearly'];

async function markArelyTodoDone(id, repeating, dueDate){
  const isRepeat = VALID_REPEATS.includes(repeating);
  const hasDate  = dueDate && /^\d{4}-\d{2}-\d{2}$/.test(dueDate);
  const now      = new Date().toISOString();
  const el = document.getElementById('atodo' + id);
  if(el){ el.style.transition = 'opacity .25s'; el.style.opacity = '0.2'; }
  const { error } = await db.from('todos').update({ completed: true, completed_at: now }).eq('id', id);
  if(error) await db.from('todos').update({ completed: true }).eq('id', id);
  if(isRepeat && hasDate){
    const nextDate = calcNextDue(dueDate, repeating);
    if(nextDate){
      const { data: orig } = await db.from('todos').select('*').eq('id', id).single();
      if(orig){
        const { id: _id, completed, completed_at: _ca, created_at, ...copy } = orig;
        copy.due_date = nextDate; copy.completed = false; copy.completed_at = null;
        await db.from('todos').insert(copy);
      }
    }
  }
  setTimeout(() => loadArelyTodos(), 300);
}

function calcNextDue(dueDateStr, repeating){
  const d = new Date(dueDateStr + 'T12:00:00');
  if(isNaN(d)) return null;
  if(repeating === 'weekly')  d.setDate(d.getDate() + 7);
  if(repeating === 'monthly') d.setMonth(d.getMonth() + 1);
  if(repeating === 'yearly')  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0,10);
}

async function undoArelyTodo(id){
  await db.from('todos').update({ completed: false, completed_at: null }).eq('id', id);
  loadArelyTodos();
  const div = document.getElementById('arelyDoneHistory');
  if(div && div.style.display !== 'none'){
    db.from('todos').select('id,title,due_date,completed,completed_at,category,created_at,repeating')
      .eq('person','arely').eq('completed',true)
      .order('completed_at',{ascending:false})
      .then(({data}) => renderArelyDoneHistory(data||[]));
  }
}

// ── CSV DOWNLOAD ─────────────────────────────────────────
function downloadCSVArely(filename){
  const tx = arelyTx;
  if(!confirm(`Download expense history as CSV?\n\n${tx.length} transactions will be exported.`)) return;
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

function escHtml(s){
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

// ── INIT ─────────────────────────────────────────────────
loadCustomCategories();
