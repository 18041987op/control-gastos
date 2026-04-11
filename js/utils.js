// ── FORMATO Y FECHA ───────────────────────────────────────
function fmt(n){
  return 'L ' + parseFloat(n||0).toLocaleString('es-HN',{minimumFractionDigits:2, maximumFractionDigits:2});
}

function setTodayDate(id){
  const el = document.getElementById(id);
  if(el) el.value = new Date().toISOString().split('T')[0];
}

// ── GRILLAS DE OPCIONES ───────────────────────────────────
function buildCatGrid(containerId, btnClass, selClass, entries, onSelect){
  document.getElementById(containerId).innerHTML = entries.map(([k,v]) =>
    `<button class="${btnClass}" onclick="this.parentElement.querySelectorAll('.${btnClass}').forEach(b=>b.classList.remove('sel','sel-admin','sel-teal','sel-rosa'));this.classList.add('${selClass}');(${onSelect.toString()})('${k}')">
    <span class="opt-icon">${v.emoji}</span>${v.label.replace(/^[^\s]+\s/,'')}</button>`
  ).join('');
}

function buildMethodGrid(containerId, methods, selClass, onSelect){
  document.getElementById(containerId).innerHTML = methods.map(m =>
    `<button class="opt-btn" onclick="this.parentElement.querySelectorAll('.opt-btn').forEach(b=>b.classList.remove('sel','sel-admin','sel-teal','sel-rosa'));this.classList.add('${selClass}');(${onSelect.toString()})('${m.k}')">
    <span class="opt-icon">${m.icon}</span>${m.label}</button>`
  ).join('');
}

// ── TOGGLE LISTA DE TRANSACCIONES ────────────────────────
function toggleTxList(wrapperId, btnId){
  const wrap = document.getElementById(wrapperId);
  const btn  = document.getElementById(btnId);
  const open = wrap.style.display !== 'none';
  wrap.style.display = open ? 'none' : 'block';
  btn.textContent    = open ? 'Ver lista ▼' : 'Ocultar ▲';
}

// ── CÁLCULOS ──────────────────────────────────────────────
function sumAmt(arr){
  return arr.reduce((s,t) => s + parseFloat(t.amount||0), 0);
}

function groupSum(arr, key){
  const r = {};
  arr.forEach(t => { r[t[key]] = (r[t[key]]||0) + parseFloat(t.amount||0); });
  return r;
}

function topEntry(obj){
  const e = Object.entries(obj).sort((a,b) => b[1]-a[1]);
  return e[0] || null;
}

function uniqSorted(arr, key){
  return [...new Set(arr.map(t => t[key]))].sort((a,b) => (MONTH_ORDER[a]||99)-(MONTH_ORDER[b]||99));
}

// ── DOM HELPERS ───────────────────────────────────────────
function show(id){ document.getElementById(id).style.display = 'block'; }
function hide(id){ document.getElementById(id).style.display = 'none'; }

function showAlert(el, msg, type){
  el.textContent = msg;
  el.className   = `alert alert-${type} show`;
}
function hideAlert(el){ el.className = 'alert'; }

// ── ELIMINAR TRANSACCIÓN (compartido) ─────────────────────
// Archiva en deleted_transactions antes de borrar definitivamente.
async function deleteTx(id, person){
  if(!confirm('¿Eliminar esta transacción?\nQuedarás guardada en el historial de borrados.')) return;

  // 1 ── Fetch the row to archive it
  const { data: tx } = await db.from('transactions').select('*').eq('id', id).single();

  if(tx){
    // 2 ── Insert into deleted_transactions archive
    const archive = {
      original_id:   tx.id,
      date:          tx.date,
      description:   tx.description,
      category:      tx.category,
      cat_label:     tx.cat_label,
      month:         tx.month,
      month_display: tx.month_display,
      month_num:     tx.month_num,
      year:          tx.year,
      amount:        tx.amount,
      type:          tx.type,
      person:        tx.person,
      direction:     tx.direction,
      created_at:    tx.created_at,
      deleted_by:    currentUser || person || 'unknown',
    };
    await db.from('deleted_transactions').insert(archive);
  }

  // 3 ── Delete from active transactions
  await db.from('transactions').delete().eq('id', id);

  // 4 ── Refresh the correct user view
  if(person === 'sharelyn'){
    loadDashboard();
    loadRecentCash();
  } else if(person === 'arely'){
    loadArelyData();
    loadArelyDashboard();
  } else {
    loadTeresaData();
    if(currentUser === 'admin') loadTeresaAdminView();
  }
}

