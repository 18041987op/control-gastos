// ══════════════════════════════════════════════════════════
//  TRASH / DELETION HISTORY  — control-gastos
//  Transacciones borradas se archivan aquí.
//  Solo se pueden borrar permanentemente con la clave maestra.
// ══════════════════════════════════════════════════════════

// ── OPEN / CLOSE ─────────────────────────────────────────
function openTrash(){
  const m = document.getElementById('trashModal');
  m.style.display = 'flex';
  // Reset to lock screen
  document.getElementById('trashLock').style.display  = 'block';
  document.getElementById('trashBody').style.display  = 'none';
  document.getElementById('trashPinInput').value = '';
  hideAlert(document.getElementById('trashPinAlert'));
  setTimeout(() => document.getElementById('trashPinInput').focus(), 100);
}

function closeTrash(){
  document.getElementById('trashModal').style.display = 'none';
}

// ── PIN VERIFICATION ─────────────────────────────────────
async function verifyTrashPin(){
  const pin = document.getElementById('trashPinInput').value.trim();
  if(!pin) return;
  const h = await sha256hex(pin + PIN_SALT);
  if(h !== ADMIN_PIN_HASH){
    showAlert(document.getElementById('trashPinAlert'), '❌ Incorrect master PIN', 'error');
    document.getElementById('trashPinInput').value = '';
    return;
  }
  document.getElementById('trashLock').style.display = 'none';
  document.getElementById('trashBody').style.display = 'block';
  loadTrashList();
}

// Allow Enter key on PIN input
document.addEventListener('DOMContentLoaded', () => {
  const inp = document.getElementById('trashPinInput');
  if(inp) inp.addEventListener('keydown', e => { if(e.key === 'Enter') verifyTrashPin(); });
});

// ── LOAD LIST ────────────────────────────────────────────
async function loadTrashList(){
  const container = document.getElementById('trashList');
  container.innerHTML = '<p style="text-align:center;color:var(--muted);padding:20px">Loading…</p>';

  const { data, error } = await db.from('deleted_transactions')
    .select('*')
    .order('deleted_at', { ascending: false });

  if(error){
    container.innerHTML = `<p style="color:var(--red);padding:12px">Error: ${error.message}</p>`;
    return;
  }

  if(!data || !data.length){
    container.innerHTML = '<p style="text-align:center;color:var(--muted);padding:30px;font-size:.9rem">🗑️ No deleted transactions yet.</p>';
    return;
  }

  // Group by person for display
  const personLabel = { admin:'Admin', sharelyn:'Sharelyn', teresa:'Teresa', arely:'Arely' };
  const personColor = { admin:'#667eea', sharelyn:'#00b09b', teresa:'#f7971e', arely:'#D06B8D' };
  const fmt = n => '$' + parseFloat(n||0).toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2});

  container.innerHTML = data.map(t => {
    const when   = new Date(t.deleted_at).toLocaleDateString('en-US', {month:'short', day:'numeric', year:'numeric', hour:'2-digit', minute:'2-digit'});
    const by     = t.deleted_by || '?';
    const color  = personColor[t.person] || '#999';
    const label  = personLabel[t.person] || t.person;
    const amount = t.direction === 'income'
      ? `<span style="color:var(--green);font-weight:700">+${fmt(t.amount)}</span>`
      : `<span style="color:var(--red);font-weight:700">-${fmt(t.amount)}</span>`;

    return `
    <div class="trash-item" id="trashItem${t.id}">
      <div class="trash-item-meta">
        <span class="trash-person-badge" style="background:${color}20;color:${color}">${label}</span>
        <span class="trash-date-badge">${t.month_display||''} ${t.year||''}</span>
        <span class="trash-deleted-when">🗑️ ${when} · by ${by}</span>
      </div>
      <div class="trash-item-main">
        <div class="trash-item-desc">
          <strong>${escHtmlT(t.description || '')}</strong>
          <span style="font-size:.74rem;color:var(--muted)">${t.date || ''} · ${t.cat_label || t.category || ''}</span>
        </div>
        <div class="trash-item-amt">${amount}</div>
      </div>
      <div class="trash-item-actions">
        <button class="trash-btn trash-restore" onclick="restoreFromTrash(${t.id})">♻️ Restore</button>
        <button class="trash-btn trash-perm"    onclick="permDeleteFromTrash(${t.id})">☠️ Delete Forever</button>
      </div>
    </div>`;
  }).join('');
}

// ── RESTORE ──────────────────────────────────────────────
async function restoreFromTrash(deletedId){
  if(!confirm('Restore this transaction to the active list?')) return;

  const { data: dt, error } = await db.from('deleted_transactions')
    .select('*').eq('id', deletedId).single();

  if(error || !dt){
    alert('Could not find this record.');
    return;
  }

  // Strip out trash-table-specific fields
  const { id, original_id, deleted_at, deleted_by, ...txData } = dt;

  const { error: insErr } = await db.from('transactions').insert(txData);
  if(insErr){
    alert('Error restoring: ' + insErr.message);
    return;
  }

  await db.from('deleted_transactions').delete().eq('id', deletedId);
  document.getElementById('trashItem' + deletedId)?.remove();

  // Refresh active data for the restored person
  refreshPersonData(dt.person);

  // Show brief success toast
  showTrashToast('♻️ Transaction restored!');
}

// ── PERMANENT DELETE ─────────────────────────────────────
async function permDeleteFromTrash(deletedId){
  // Require master PIN again for permanent deletion
  const pin = prompt('⚠️ Permanent deletion cannot be undone.\n\nEnter master PIN to confirm:');
  if(pin === null) return; // cancelled
  const h = await sha256hex(pin + PIN_SALT);
  if(h !== ADMIN_PIN_HASH){
    alert('❌ Incorrect master PIN. Deletion cancelled.');
    return;
  }

  if(!confirm('This record will be permanently deleted and cannot be recovered. Continue?')) return;

  await db.from('deleted_transactions').delete().eq('id', deletedId);
  document.getElementById('trashItem' + deletedId)?.remove();

  // If list is now empty, show empty state
  const list = document.getElementById('trashList');
  if(list && !list.querySelector('.trash-item')){
    list.innerHTML = '<p style="text-align:center;color:var(--muted);padding:30px;font-size:.9rem">🗑️ No deleted transactions yet.</p>';
  }
  showTrashToast('☠️ Permanently deleted.');
}

// ── HELPERS ──────────────────────────────────────────────
function refreshPersonData(person){
  if(person === 'arely'){
    loadArelyData().then(() => loadArelyDashboard());
  } else if(person === 'sharelyn'){
    loadDashboard();
  } else {
    loadTeresaData();
  }
}

function showTrashToast(msg){
  let t = document.getElementById('trashToast');
  if(!t){
    t = document.createElement('div');
    t.id = 'trashToast';
    t.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#333;color:#fff;padding:10px 20px;border-radius:20px;font-size:.85rem;z-index:9999;opacity:0;transition:opacity .3s';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = '1';
  setTimeout(() => { t.style.opacity = '0'; }, 2500);
}

function escHtmlT(s){
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}
