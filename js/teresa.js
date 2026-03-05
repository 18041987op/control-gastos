// ── HELPERS DE MODO ───────────────────────────────────────
function getTeresaPerson(){
  return currentTeresaMode === 'personal' ? 'teresa_personal' : 'teresa';
}

function getTeresaCat(){
  return currentTeresaMode === 'personal' ? TERESA_PERSONAL_CAT : TERESA_CAT;
}

function getTeresaTx(){
  return currentTeresaMode === 'personal' ? teresaPersonalTx : teresaTx;
}

function getTeresaAccentClass(){
  return currentTeresaMode === 'personal' ? 'rosa' : 'teal';
}

// ── CAMBIAR MODO (Obra ↔ Personal) ────────────────────────
function switchTeresaMode(mode){
  currentTeresaMode = mode;
  const isPersonal  = mode === 'personal';

  // Tabs del header
  document.getElementById('tabTeresaObra').classList.toggle('active', !isPersonal);
  document.getElementById('tabTeresaPersonal').classList.toggle('active', isPersonal);

  // Color del header
  document.getElementById('teresaHdr').className = isPersonal
    ? 'hdr hdr-teresa-personal'
    : 'hdr hdr-teresa';

  // Título del header
  document.getElementById('teresaHdrTitle').textContent = isPersonal ? '🌸 Personal' : '🏠 Obra';

  // Banner
  document.getElementById('teresaBanner').className = isPersonal
    ? 'balance-banner bal-teresa-personal'
    : 'balance-banner bal-teresa';

  // Botón escáner y pestaña Presupuestos (solo en modo Obra)
  document.getElementById('teresaScanBtn').style.display    = isPersonal ? 'none' : '';
  document.getElementById('tnPresupuestos').style.display   = isPersonal ? 'none' : '';

  // Formularios: cambiar clase y color del título
  const accent = isPersonal ? 'var(--rosa)' : 'var(--pink)';
  const formClass = isPersonal ? 'form-card rosa-form' : 'form-card teal-form';

  document.getElementById('ingresoFormCard').className = formClass;
  document.getElementById('ingresoFormTitle').style.color = accent;
  document.getElementById('ingresoDesc').placeholder = isPersonal
    ? 'Ej: Salario, transferencia recibida…'
    : 'Ej: Anticipo semanal, quincena…';

  document.getElementById('gastoFormCard').className = formClass;
  document.getElementById('gastoFormTitle').style.color = accent;
  document.getElementById('gastoDesc').placeholder = isPersonal
    ? 'Ej: Supermercado, farmacia…'
    : 'Ej: Cemento, bloques…';
  document.getElementById('gastoScanBtn').style.display = isPersonal ? 'none' : '';

  // Botones de guardar
  const btnClass = isPersonal ? 'btn btn-tp' : 'btn btn-t';
  document.getElementById('ingresoSaveBtn').className = btnClass;
  document.getElementById('gastoSaveBtn').className   = btnClass;

  // Pills del historial
  const pillClass = isPersonal ? 'pill rosa' : 'pill teal';
  ['tHistPillAll','tHistPillIncome','tHistPillExpense'].forEach(id => {
    const el = document.getElementById(id);
    if(el) el.className = pillClass + (el.classList.contains('active') ? ' active' : '');
  });

  // Toggle buttons del historial
  const toggleClass = isPersonal ? 'tx-toggle-btn rosa-toggle' : 'tx-toggle-btn teal-toggle';
  ['tHistToggleBtn','tHistCsvBtn'].forEach(id => {
    const el = document.getElementById(id);
    if(el) el.className = toggleClass;
  });

  // Thead del historial
  document.getElementById('tHistThead').className = isPersonal ? 'rosa' : 'teal';

  // Formulario de tareas
  document.getElementById('todoFormCardT').className = formClass;
  document.getElementById('todoTitleT').style.color  = accent;
  document.getElementById('todoTitleT').textContent  = isPersonal
    ? '✅ Mis Tareas — Personal'
    : '✅ Mis Tareas — Obra';

  // Color activo del nav
  document.querySelectorAll('#teresaBottomNav .nav-btn').forEach(b => {
    b.classList.remove('t-active','tp-active');
  });
  const activeNav = document.querySelector('#teresaBottomNav .nav-btn.active');
  if(activeNav) activeNav.classList.add(isPersonal ? 'tp-active' : 't-active');

  // Reconstruir grillas con las categorías del modo
  const selClass = isPersonal ? 'sel-rosa' : 'sel-teal';
  buildMethodGrid('ingresoMethodGrid', INCOME_METHODS,  selClass, (k) => selectedIngresoMethod = k);
  buildMethodGrid('gastoMethodGrid',   EXPENSE_METHODS, selClass, (k) => selectedGastoMethod   = k);
  buildCatGrid('gastoCatGrid','opt-btn', selClass, Object.entries(getTeresaCat()), (k) => selectedGastoCat = k);

  // Resetear selecciones
  selectedIngresoMethod = '';
  selectedGastoCat      = '';
  selectedGastoMethod   = '';
  clearReceipt();

  // Recargar datos del modo activo
  loadTeresaData();
  teresaShow('Dashboard');
}

// ── NAVEGACIÓN TERESA ─────────────────────────────────────
function teresaShow(name){
  document.querySelectorAll('#teresaShell .view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('#teresaShell .nav-btn').forEach(b => b.classList.remove('active','t-active','tp-active'));
  document.getElementById('tv' + name).classList.add('active');
  const btn = document.getElementById('tn' + name);
  if(btn){
    btn.classList.add('active');
    btn.classList.add(currentTeresaMode === 'personal' ? 'tp-active' : 't-active');
  }
  if(name === 'Dashboard')    loadTeresaDashboard();
  if(name === 'Todo')         { buildTodoCatGrid(); loadTodos(); }
  if(name === 'Presupuestos') { showPresuForm(false); loadPresupuestos(); }
}

// ── DASHBOARD TERESA ──────────────────────────────────────
async function loadTeresaDashboard(){
  show('tDashLoading'); hide('tDashContent');

  const person  = getTeresaPerson();
  const cat     = getTeresaCat();
  const accent  = getTeresaAccentClass();
  const COLS = 'id,date,description,category,amount,direction,month_display,has_receipt,created_at';
  const [txRes, todoRes] = await Promise.all([
    db.from('transactions').select(COLS).eq('person', person).order('created_at',{ascending:false}).limit(60),
    db.from('todos').select('id,completed').eq('person', person),
  ]);

  const tx       = txRes.data  || [];
  const todos    = todoRes.data || [];
  const expenses = tx.filter(t => t.direction === 'expense');
  const pending  = todos.filter(t => !t.completed).length;

  // Totales
  const totalIncome = sumAmt(tx.filter(t => t.direction === 'income'));
  const totalSpent  = sumAmt(expenses);
  const balance     = totalIncome - totalSpent;

  const hlClass = currentTeresaMode === 'personal' ? 'hl-rosa' : 'hl-teal';

  // Cards
  document.getElementById('tDashCards').innerHTML = `
    <div class="stat-card ${hlClass} span2" style="cursor:pointer" onclick="teresaShow('Todo')">
      <div class="lbl">✅ Tareas Pendientes</div>
      <div class="val">${pending}</div>
      <div class="sub">Toca para ver las tareas →</div>
    </div>
    <div class="stat-card hl-green">
      <div class="lbl">📥 Balance</div>
      <div class="val">${fmt(balance)}</div>
    </div>
    <div class="stat-card">
      <div class="lbl">💸 Gastado</div>
      <div class="val amount-neg">${fmt(totalSpent)}</div>
    </div>`;

  // Top gastos por monto
  const topExp = [...expenses].sort((a,b) => b.amount - a.amount).slice(0, 6);
  const maxAmt = topExp[0]?.amount || 1;
  document.getElementById('tDashTopExpenses').innerHTML = topExp.length
    ? topExp.map(t => `
      <div class="top-item">
        <div class="top-lbl" title="${t.description}">${cat[t.category]?.emoji||'📦'} ${t.description}</div>
        <div class="top-track"><div class="top-fill ${accent}" style="width:${(t.amount/maxAmt*100).toFixed(1)}%"></div></div>
        <div class="top-amt ${accent}">${fmt(t.amount)}</div>
      </div>`).join('')
    : '<p style="color:var(--muted);font-size:.82rem;text-align:center;padding:12px">Sin gastos aún.</p>';

  // Últimos 6 movimientos
  const recent = tx.slice(0, 6);
  document.getElementById('tDashRecent').innerHTML = recent.length
    ? `<table style="width:100%;font-size:.78rem;border-collapse:collapse">
        ${recent.map(t => `
        <tr style="border-bottom:1px solid #f0f0f0">
          <td style="padding:6px 5px">${cat[t.category]?.emoji || (t.direction==='income'?'📥':'📦')}</td>
          <td style="padding:6px 4px;max-width:110px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${t.description}</td>
          <td style="padding:6px 4px"><span class="badge m-${t.month_display?.toLowerCase()||'otros'}">${t.month_display||''}</span></td>
          <td style="padding:6px 4px;font-weight:700;${t.direction==='income'?'color:var(--green)':'color:var(--red)'}">${fmt(t.amount)}</td>
        </tr>`).join('')}
      </table>`
    : '<p style="color:var(--muted);font-size:.82rem;text-align:center;padding:12px">Sin movimientos aún.</p>';

  hide('tDashLoading'); show('tDashContent');
}

// ── FOTO DE RECIBO ────────────────────────────────────────
function handleReceiptSelect(e){
  const file = e.target.files[0];
  if(!file) return;
  compressImage(file, 150, dataUrl => {
    currentReceiptData = dataUrl;
    document.getElementById('receiptPreviewImg').src          = dataUrl;
    document.getElementById('receiptPreviewImg').style.display = 'block';
    document.getElementById('receiptPlaceholderTxt').textContent = 'Foto seleccionada ✓';
    document.getElementById('receiptClearBtn').style.display  = 'block';
    document.getElementById('receiptDrop').style.borderColor  = 'var(--teal)';
  });
}

function clearReceipt(){
  currentReceiptData = null;
  document.getElementById('receiptInput').value                = '';
  document.getElementById('receiptPreviewImg').style.display   = 'none';
  document.getElementById('receiptPreviewImg').src             = '';
  document.getElementById('receiptPlaceholderTxt').textContent = 'Toca para agregar foto del recibo';
  document.getElementById('receiptClearBtn').style.display     = 'none';
  document.getElementById('receiptDrop').style.borderColor     = '';
}

function compressImage(file, maxKB, callback){
  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let w = img.width, h = img.height;
      const maxDim = 1000;
      if(w > maxDim || h > maxDim){
        const r = Math.min(maxDim/w, maxDim/h);
        w = Math.round(w*r); h = Math.round(h*r);
      }
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      let q = 0.7, dataUrl = canvas.toDataURL('image/jpeg', q);
      while(dataUrl.length > maxKB*1024*1.37 && q > 0.2){
        q = Math.max(0.2, q-0.15);
        dataUrl = canvas.toDataURL('image/jpeg', q);
      }
      callback(dataUrl);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

async function openReceipt(id){
  const modal = document.getElementById('receiptModal');
  const img   = document.getElementById('receiptModalImg');
  img.src = ''; modal.style.display = 'flex';
  const {data} = await db.from('transactions').select('receipt_image').eq('id', id).single();
  if(data?.receipt_image){ img.src = data.receipt_image; }
  else { modal.style.display = 'none'; alert('No se encontró la imagen.'); }
}

// ── GUARDAR INGRESO ───────────────────────────────────────
async function saveIngreso(){
  const date = document.getElementById('ingresoDate').value;
  const desc = document.getElementById('ingresoDesc').value.trim();
  const amt  = parseFloat(document.getElementById('ingresoAmt').value);
  const al   = document.getElementById('ingresoAlert');
  if(!date || !desc || !amt || amt<=0 || !selectedIngresoMethod){
    showAlert(al, 'Completa todos los campos.', 'error');
    return;
  }
  const dp = date.split('-');
  const mn = parseInt(dp[1]);
  const {error} = await db.from('transactions').insert([{
    date: `${dp[2]}/${dp[1]}`, description: desc,
    category: 'otros', cat_label: 'Ingreso',
    month: MONTHS_ES[mn].toLowerCase(), month_display: MONTHS_ES[mn], month_num: mn,
    amount: amt, type: 'cash', person: getTeresaPerson(),
    direction: 'income', payment_method: selectedIngresoMethod,
  }]);
  if(error){ showAlert(al, 'Error: ' + error.message, 'error'); return; }
  showAlert(al, '✅ Ingreso guardado.', 'success');
  document.getElementById('ingresoDesc').value = '';
  document.getElementById('ingresoAmt').value  = '';
  selectedIngresoMethod = '';
  document.querySelectorAll('#ingresoMethodGrid .opt-btn').forEach(b => b.classList.remove('sel','sel-teal','sel-rosa'));
  loadTeresaData();
}

// ── GUARDAR GASTO ─────────────────────────────────────────
async function saveGasto(){
  const date = document.getElementById('gastoDate').value;
  const desc = document.getElementById('gastoDesc').value.trim();
  const amt  = parseFloat(document.getElementById('gastoAmt').value);
  const al   = document.getElementById('gastoAlert');
  if(!date || !desc || !amt || amt<=0 || !selectedGastoCat || !selectedGastoMethod){
    showAlert(al, 'Completa todos los campos incluyendo categoría y método de pago.', 'error');
    return;
  }
  const cat = getTeresaCat();
  const dp  = date.split('-');
  const mn  = parseInt(dp[1]);
  const row = {
    date: `${dp[2]}/${dp[1]}`, description: desc,
    category: selectedGastoCat, cat_label: cat[selectedGastoCat]?.label||selectedGastoCat,
    month: MONTHS_ES[mn].toLowerCase(), month_display: MONTHS_ES[mn], month_num: mn,
    amount: amt, type: 'cash', person: getTeresaPerson(),
    direction: 'expense', payment_method: selectedGastoMethod,
  };
  if(currentReceiptData){
    row.receipt_image = currentReceiptData;
    row.has_receipt   = true;
  }
  const {error} = await db.from('transactions').insert([row]);
  if(error){ showAlert(al, 'Error: ' + error.message, 'error'); return; }
  showAlert(al, '✅ Gasto guardado.', 'success');
  document.getElementById('gastoDesc').value = '';
  document.getElementById('gastoAmt').value  = '';
  selectedGastoCat = ''; selectedGastoMethod = '';
  document.querySelectorAll('#gastoCatGrid .opt-btn,#gastoMethodGrid .opt-btn').forEach(b => b.classList.remove('sel','sel-teal','sel-rosa'));
  clearReceipt();
  loadTeresaData();
}

// ── CARGAR DATOS DE TERESA ────────────────────────────────
async function loadTeresaData(){
  const person = getTeresaPerson();
  const COLS = 'id,date,description,category,cat_label,month,month_display,amount,direction,payment_method,has_receipt,created_at,edited_at,edited_by';
  const {data} = await db.from('transactions')
    .select(COLS).eq('person', person)
    .order('created_at',{ascending:false});

  if(currentTeresaMode === 'personal'){
    teresaPersonalTx = data || [];
  } else {
    teresaTx = data || [];
  }
  renderTeresaBanner();
  renderTHistorial();
}

function renderTeresaBanner(){
  const txData = getTeresaTx();
  const income = sumAmt(txData.filter(t => t.direction === 'income'));
  const spent  = sumAmt(txData.filter(t => t.direction === 'expense'));
  const bal    = income - spent;
  document.getElementById('teresaBalance').textContent  = fmt(bal);
  document.getElementById('teresaReceived').textContent = fmt(income);
  document.getElementById('teresaSpent').textContent    = fmt(spent);
  document.getElementById('teresaHdrSub').textContent   = `Balance: ${fmt(bal)}`;
}

function setTHistFilter(f){
  tHistFilter = f;
  const pillClass = currentTeresaMode === 'personal' ? 'pill rosa' : 'pill teal';
  ['tHistPillAll','tHistPillIncome','tHistPillExpense'].forEach((id, i) => {
    const el = document.getElementById(id);
    if(el) el.className = pillClass + (['all','income','expense'][i] === f ? ' active' : '');
  });
  renderTHistorial();
}

function renderTHistorial(){
  const txData = getTeresaTx();
  const tx     = tHistFilter === 'all' ? txData : txData.filter(t => t.direction === tHistFilter);
  const person = getTeresaPerson();
  const cat    = getTeresaCat();
  if(!tx.length){
    document.getElementById('tHistBody').innerHTML = '<tr><td colspan="7" style="text-align:center;padding:16px;color:#aaa">Sin movimientos</td></tr>';
    return;
  }
  document.getElementById('tHistBody').innerHTML = tx.map(t => `
    <tr${t.edited_at?' class="was-edited"':''}>
      <td>${t.date}${t.edited_at?`<span class="edited-mark" title="Editado">✏️</span>`:''}</td>
      <td style="max-width:110px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${t.description}</td>
      <td><span class="badge ${t.direction==='income'?'b-income':'b-expense'}">${t.direction==='income'?'📥 Ingreso':'💸 Gasto'}</span></td>
      <td>${t.payment_method?`<span class="badge b-method">${METHOD_LABEL[t.payment_method]||t.payment_method}</span>`:'—'}</td>
      <td class="${t.direction==='income'?'amount-pos':'amount-neg'}">${fmt(t.amount)}</td>
      <td>${t.has_receipt?`<span style="cursor:pointer;font-size:1.2rem" onclick="openReceipt('${t.id}')" title="Ver recibo">📸</span>`:'—'}</td>
      <td style="white-space:nowrap">
        <button class="del-btn" title="Editar" style="color:#b2dfdb" onclick="openEditModal('${t.id}','${person}')">✏️</button>
        <button class="del-btn" onclick="deleteTx('${t.id}','${person}')">🗑</button>
      </td>
    </tr>`).join('');
}
