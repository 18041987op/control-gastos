// ── ESTADO DEL MODAL DE EDICIÓN ───────────────────────────
let editingTx  = null;
let editCatKey = '';
let ePinBuf    = '';
let ePinOk     = false;
let editPerson = '';

// ── ABRIR MODAL ───────────────────────────────────────────
function openEditModal(txId, person){
  const src = person === 'sharelyn' ? allTx :
              person === 'teresa_personal' ? teresaPersonalTx : teresaTx;
  const tx  = src.find(t => String(t.id) === String(txId));
  if(!tx) return;

  editingTx  = {...tx};
  editPerson = person;
  editCatKey = tx.category || '';
  ePinBuf    = '';
  ePinOk     = false;

  // Convertir "DD/MM" → "YYYY-MM-DD"
  let dVal = '';
  if(tx.date && tx.date.includes('/')){
    const [dd,mm] = tx.date.split('/');
    const yr      = new Date().getFullYear();
    dVal = `${yr}-${mm.padStart(2,'0')}-${dd.padStart(2,'0')}`;
  } else { dVal = tx.date||''; }

  document.getElementById('editDate').value  = dVal;
  document.getElementById('editDesc').value  = tx.description||'';
  document.getElementById('editAmt').value   = parseFloat(tx.amount||0).toFixed(2);
  document.getElementById('editNote').value  = '';

  // Grilla de categorías
  const cats   = person === 'teresa_personal' ? Object.entries(TERESA_PERSONAL_CAT) :
                 person === 'teresa' ? Object.entries(TERESA_CAT) : Object.entries(CAT);
  const selCls = person === 'teresa_personal' ? 'sel-rosa' :
                 person === 'teresa' ? 'sel-teal' :
                 currentUser === 'admin' ? 'sel-admin' : 'sel';
  buildCatGrid('editCatGrid','opt-btn', selCls, cats, (k) => editCatKey = k);
  setTimeout(() => {
    const btns = document.querySelectorAll('#editCatGrid .opt-btn');
    cats.forEach(([k],i) => { if(k === editCatKey && btns[i]) btns[i].click(); });
  }, 30);

  // Resetear PIN
  updateEPinDots();
  const msg = document.getElementById('ePinMsg');
  msg.textContent = ''; msg.className = 'ep-err';
  document.getElementById('editPinPad')?.querySelectorAll('.mini-btn').forEach(b => {
    b.style.opacity = ''; b.style.pointerEvents = '';
  });
  const btn = document.getElementById('editSaveBtn');
  btn.disabled       = true;
  btn.style.background = '#ccc';
  btn.style.cursor   = 'not-allowed';
  btn.textContent    = 'Guardar Cambios';

  document.getElementById('editModal').style.display = 'flex';
}

function closeEditModal(){
  document.getElementById('editModal').style.display = 'none';
  editingTx = null; editCatKey = ''; ePinBuf = ''; ePinOk = false; editPerson = '';
}

// ── PIN DEL MODAL ─────────────────────────────────────────
function ePinPress(d){
  if(ePinOk || ePinBuf.length >= 4) return;
  ePinBuf += d;
  updateEPinDots();
  if(ePinBuf.length === 4) setTimeout(verifyEditPin, 120);
}

function ePinClear(){
  if(ePinOk) return;
  ePinBuf = ePinBuf.slice(0,-1);
  updateEPinDots();
}

function updateEPinDots(){
  const cls = currentUser === 'teresa'
    ? (currentTeresaMode === 'personal' ? 'ep-rosa' : 'ep-teal')
    : currentUser === 'sharelyn' ? 'ep-purple' : 'ep-admin';
  document.querySelectorAll('.edit-pdot').forEach((d,i) => {
    d.classList.remove('ep-admin','ep-purple','ep-teal');
    if(i < ePinBuf.length) d.classList.add(cls);
  });
}

function verifyEditPin(){
  const correct = currentUser === 'admin' ? ADMIN_PIN : currentUser === 'sharelyn' ? SHARELYN_PIN : TERESA_PIN;
  const msg     = document.getElementById('ePinMsg');
  if(ePinBuf === correct){
    ePinOk = true;
    msg.textContent = '✅ PIN verificado — puedes guardar';
    msg.className   = 'ep-ok';
    document.querySelectorAll('.mini-btn').forEach(b => {
      b.style.opacity = '.35'; b.style.pointerEvents = 'none';
    });
    const btn = document.getElementById('editSaveBtn');
    btn.disabled         = false;
    btn.style.background = '';
    btn.style.cursor     = '';
    btn.className        = `btn ${currentUser==='teresa'?(currentTeresaMode==='personal'?'btn-tp':'btn-t'):currentUser==='sharelyn'?'btn-p':'btn-a'}`;
  } else {
    msg.textContent = 'PIN incorrecto, intenta de nuevo.';
    msg.className   = 'ep-err';
    ePinBuf = '';
    updateEPinDots();
  }
}

// ── GUARDAR EDICIÓN ───────────────────────────────────────
async function saveEdit(){
  if(!editingTx || !ePinOk) return;
  const newDate = document.getElementById('editDate').value;
  const newDesc = document.getElementById('editDesc').value.trim();
  const newAmt  = parseFloat(document.getElementById('editAmt').value);
  const note    = document.getElementById('editNote').value.trim();
  if(!newDate || !newDesc || !newAmt || newAmt <= 0){
    alert('Completa fecha, descripción y monto.');
    return;
  }
  const dp      = newDate.split('-');
  const fmtDate = `${dp[2]}/${dp[1]}`;
  const mn      = parseInt(dp[1]);

  const btn = document.getElementById('editSaveBtn');
  btn.textContent = 'Guardando…';
  btn.disabled    = true;

  // Registro de auditoría
  await db.from('transaction_edits').insert([{
    transaction_id:   editingTx.id,
    old_date:         editingTx.date,         old_description: editingTx.description,
    old_amount:       editingTx.amount,       old_category:    editingTx.category,
    new_date:         fmtDate,                new_description: newDesc,
    new_amount:       newAmt,                 new_category:    editCatKey||editingTx.category,
    edited_by:        currentUser,            note:            note||null,
  }]);

  // Actualizar transacción
  const upd = {
    date:          fmtDate,          description: newDesc,
    amount:        newAmt,           category:    editCatKey||editingTx.category,
    month:         MONTHS_ES[mn].toLowerCase(),
    month_display: MONTHS_ES[mn],   month_num:   mn,
    edited_at:     new Date().toISOString(),
    edited_by:     currentUser,
  };
  if(editCatKey && ALL_CATS[editCatKey]) upd.cat_label = ALL_CATS[editCatKey].label;

  const {error} = await db.from('transactions').update(upd).eq('id', editingTx.id);
  if(error){
    alert('Error al guardar: ' + error.message);
    btn.textContent = 'Guardar Cambios';
    btn.disabled    = false;
    return;
  }

  closeEditModal();
  if(editPerson === 'sharelyn'){
    await loadDashboard();
    await loadRecentCash();
  } else {
    await loadTeresaData();
    if(currentUser === 'admin') await loadTeresaAdminView();
  }
}
