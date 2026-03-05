// ── ESTADO PRESUPUESTOS ───────────────────────────────────
let allPresupuestos = [];
let currentItems    = [];   // items del formulario actual
let compareIds      = [];   // hasta 2 ids para comparar
let editingPresuId  = null; // id si estamos editando

const PRESU_STATUS = {
  pending:  {label:'🟡 Pendiente', cls:'b-pending'},
  approved: {label:'✅ Aprobado',  cls:'b-approved'},
  rejected: {label:'❌ Descartado', cls:'b-rejected'},
};

// ── HELPERS ───────────────────────────────────────────────
function escHtml(str){
  return String(str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function calcPresuTotal(){
  return currentItems.reduce((sum, it) => sum + (parseFloat(it.qty)||0) * (parseFloat(it.unit_price)||0), 0);
}

// ── FORM: MOSTRAR / OCULTAR ───────────────────────────────
function showPresuForm(show, presupuesto){
  document.getElementById('presuFormWrap').style.display = show ? 'block' : 'none';
  document.getElementById('presuListWrap').style.display = show ? 'none'  : 'block';
  if(show){
    editingPresuId = presupuesto ? presupuesto.id : null;
    const title = document.getElementById('presuFormTitle');
    title.textContent = editingPresuId ? '✏️ Editar Presupuesto' : '📋 Nuevo Presupuesto';

    document.getElementById('presuStore').value = presupuesto?.store_name || '';
    document.getElementById('presuDate').value  = presupuesto?.date       || '';
    document.getElementById('presuNotes').value = presupuesto?.notes      || '';
    document.getElementById('presuAlert').className = 'alert';
    document.getElementById('presuAlert').innerHTML  = '';

    currentItems = presupuesto
      ? (Array.isArray(presupuesto.items) ? presupuesto.items : []).map(it => ({
          description: it.description || '',
          qty:         it.qty         || 0,
          unit_price:  it.unit_price  || 0,
        }))
      : [];

    if(!presupuesto) setTodayDate('presuDate');
    renderItemsForm();
  }
}

// ── FORM: ITEMS ───────────────────────────────────────────
function addPresuItem(){
  currentItems.push({description:'', qty:1, unit_price:0});
  renderItemsForm();
  // focus último input de descripción
  setTimeout(() => {
    const rows = document.querySelectorAll('.presu-item-row');
    const last = rows[rows.length - 1];
    if(last) last.querySelector('.item-desc')?.focus();
  }, 30);
}

function removePresuItem(i){
  currentItems.splice(i, 1);
  renderItemsForm();
}

function updatePresuItem(i, field, value){
  currentItems[i][field] = (field === 'description') ? value : (parseFloat(value) || 0);
  // solo recalcular total, no re-render completo (para no perder el foco)
  const lineEl = document.getElementById(`item-line-${i}`);
  if(lineEl && field !== 'description'){
    const line = (currentItems[i].qty || 0) * (currentItems[i].unit_price || 0);
    lineEl.textContent = fmt(line);
  }
  document.getElementById('presuTotal').textContent = fmt(calcPresuTotal());
}

function renderItemsForm(){
  const wrap = document.getElementById('presuItemsWrap');
  if(!currentItems.length){
    wrap.innerHTML = '<p style="color:var(--muted);font-size:.8rem;text-align:center;padding:14px 0">Aún no hay artículos. Toca <strong>+ Agregar</strong>.</p>';
    document.getElementById('presuTotal').textContent = fmt(0);
    return;
  }
  wrap.innerHTML = `
    <table class="presu-items-table">
      <thead>
        <tr>
          <th>Artículo</th>
          <th style="text-align:center;width:52px">Cant.</th>
          <th style="text-align:right;width:90px">P. Unit.</th>
          <th style="text-align:right;width:78px">Total</th>
          <th style="width:26px"></th>
        </tr>
      </thead>
      <tbody>
        ${currentItems.map((it, i) => `
        <tr class="presu-item-row">
          <td>
            <input class="presu-item-input item-desc" type="text"
              value="${escHtml(it.description)}"
              placeholder="Ej: Cemento 42.5kg"
              onchange="updatePresuItem(${i},'description',this.value)">
          </td>
          <td>
            <input class="presu-item-input num" type="number" min="0.01" step="any"
              value="${it.qty}"
              oninput="updatePresuItem(${i},'qty',this.value)">
          </td>
          <td>
            <input class="presu-item-input num" type="number" min="0" step="any"
              value="${it.unit_price}"
              oninput="updatePresuItem(${i},'unit_price',this.value)">
          </td>
          <td style="text-align:right;font-weight:700;color:var(--pink-dark)" id="item-line-${i}">
            ${fmt((it.qty||0)*(it.unit_price||0))}
          </td>
          <td style="text-align:center">
            <button onclick="removePresuItem(${i})" style="background:none;border:none;cursor:pointer;color:#e74c3c;font-size:1rem;padding:2px">🗑</button>
          </td>
        </tr>`).join('')}
      </tbody>
    </table>`;
  document.getElementById('presuTotal').textContent = fmt(calcPresuTotal());
}

// ── GUARDAR ───────────────────────────────────────────────
async function savePresupuesto(){
  const store = document.getElementById('presuStore').value.trim();
  const date  = document.getElementById('presuDate').value;
  const notes = document.getElementById('presuNotes').value.trim();
  const al    = document.getElementById('presuAlert');

  if(!store || !date){
    showAlert(al, 'Ingresa el nombre de la ferretería y la fecha.', 'error');
    return;
  }
  if(!currentItems.length){
    showAlert(al, 'Agrega al menos un artículo al presupuesto.', 'error');
    return;
  }
  if(currentItems.some(it => !String(it.description).trim())){
    showAlert(al, 'Todos los artículos deben tener descripción.', 'error');
    return;
  }

  const total = calcPresuTotal();
  const items = currentItems.map(it => ({
    description: String(it.description).trim(),
    qty:         parseFloat(it.qty)        || 0,
    unit_price:  parseFloat(it.unit_price) || 0,
    total:       parseFloat(((it.qty||0)*(it.unit_price||0)).toFixed(2)),
  }));

  const row = { person:'teresa', store_name:store, date, notes:notes||null, items, total, status:'pending' };

  const btn = document.getElementById('presuSaveBtn');
  btn.disabled = true; btn.textContent = 'Guardando…';

  let error;
  if(editingPresuId){
    ({error} = await db.from('presupuestos').update(row).eq('id', editingPresuId));
  } else {
    ({error} = await db.from('presupuestos').insert([row]));
  }

  btn.disabled = false; btn.textContent = '💾 Guardar Presupuesto';

  if(error){
    if(error.code === '42P01'){
      showAlert(al, `Primero crea la tabla en Supabase:<br>
        <code style="font-size:.7rem;display:block;margin-top:6px;padding:8px;background:#f8f8f8;border-radius:6px;line-height:1.7">
        CREATE TABLE presupuestos (<br>&nbsp;&nbsp;id UUID DEFAULT gen_random_uuid() PRIMARY KEY,<br>
        &nbsp;&nbsp;person TEXT, store_name TEXT, date DATE,<br>
        &nbsp;&nbsp;notes TEXT, items JSONB DEFAULT '[]',<br>
        &nbsp;&nbsp;total NUMERIC DEFAULT 0,<br>
        &nbsp;&nbsp;status TEXT DEFAULT 'pending',<br>
        &nbsp;&nbsp;created_at TIMESTAMPTZ DEFAULT NOW()<br>);</code>`, 'error');
    } else {
      showAlert(al, 'Error: ' + error.message, 'error');
    }
    return;
  }

  showAlert(al, `✅ Presupuesto ${editingPresuId ? 'actualizado' : 'guardado'}.`, 'success');
  setTimeout(() => { showPresuForm(false); loadPresupuestos(); }, 700);
}

// ── CARGAR LISTA ──────────────────────────────────────────
async function loadPresupuestos(){
  const container = document.getElementById('presuList');
  container.innerHTML = '<p style="text-align:center;color:var(--muted);padding:20px;font-size:.82rem">Cargando…</p>';

  const {data, error} = await db.from('presupuestos')
    .select('*').eq('person','teresa')
    .order('created_at', {ascending:false});

  if(error){
    if(error.code === '42P01'){
      container.innerHTML = `
        <div style="padding:20px;text-align:center">
          <div style="font-size:2rem;margin-bottom:8px">🛠️</div>
          <p style="font-size:.82rem;color:var(--muted);margin-bottom:10px">Crea la tabla <strong>presupuestos</strong> en Supabase para empezar:</p>
          <code style="background:#f5f5f5;padding:10px 12px;border-radius:8px;font-size:.7rem;display:block;text-align:left;line-height:1.8;word-break:break-word">
            CREATE TABLE presupuestos (<br>
            &nbsp;&nbsp;id UUID DEFAULT gen_random_uuid() PRIMARY KEY,<br>
            &nbsp;&nbsp;person TEXT, store_name TEXT, date DATE,<br>
            &nbsp;&nbsp;notes TEXT, items JSONB DEFAULT '[]',<br>
            &nbsp;&nbsp;total NUMERIC DEFAULT 0,<br>
            &nbsp;&nbsp;status TEXT DEFAULT 'pending',<br>
            &nbsp;&nbsp;created_at TIMESTAMPTZ DEFAULT NOW()<br>
            );
          </code>
        </div>`;
    } else {
      container.innerHTML = `<p style="color:var(--red);text-align:center;padding:16px">Error: ${error.message}</p>`;
    }
    return;
  }

  allPresupuestos = data || [];
  renderPresupuestosList();
}

// ── RENDERIZAR LISTA ──────────────────────────────────────
function renderPresupuestosList(){
  const container = document.getElementById('presuList');

  if(!allPresupuestos.length){
    container.innerHTML = `
      <div style="text-align:center;padding:36px 16px;color:var(--muted)">
        <div style="font-size:2.8rem;margin-bottom:10px">📋</div>
        <p style="font-size:.87rem">Sin presupuestos guardados.</p>
        <p style="font-size:.78rem;margin-top:4px">Toca <strong>+ Nuevo Presupuesto</strong> para agregar uno.</p>
      </div>`;
    return;
  }

  container.innerHTML = allPresupuestos.map(p => {
    const st      = PRESU_STATUS[p.status] || PRESU_STATUS.pending;
    const items   = Array.isArray(p.items) ? p.items : [];
    const dateStr = p.date
      ? new Date(p.date + 'T12:00:00').toLocaleDateString('es-HN',{day:'2-digit',month:'2-digit',year:'numeric'})
      : '';
    const cmpActive = compareIds.includes(p.id);

    return `
    <div class="presu-card${cmpActive ? ' presu-comparing' : ''}" id="pc-${p.id}">
      <div class="presu-card-top">
        <div style="min-width:0">
          <div class="presu-store">🏪 ${escHtml(p.store_name)}</div>
          <div class="presu-meta">${dateStr} · ${items.length} artículo${items.length!==1?'s':''} · <strong>${fmt(p.total)}</strong></div>
          ${p.notes ? `<div class="presu-note">📝 ${escHtml(p.notes)}</div>` : ''}
        </div>
        <span class="badge presu-badge ${st.cls}">${st.label}</span>
      </div>

      <!-- Detalle expandible -->
      <div id="pdetail-${p.id}" style="display:none;margin-top:10px">
        <table class="presu-items-table">
          <thead><tr>
            <th>Artículo</th>
            <th style="text-align:center;width:45px">Cant.</th>
            <th style="text-align:right;width:85px">P. Unit.</th>
            <th style="text-align:right;width:80px">Total</th>
          </tr></thead>
          <tbody>
            ${items.map(it => `
            <tr>
              <td>${escHtml(it.description)}</td>
              <td style="text-align:center">${it.qty}</td>
              <td style="text-align:right">${fmt(it.unit_price)}</td>
              <td style="text-align:right;font-weight:700;color:var(--pink-dark)">${fmt(it.total ?? it.qty*it.unit_price)}</td>
            </tr>`).join('')}
            <tr style="border-top:2px solid #ffd0a0;background:#fffbf5">
              <td colspan="3" style="padding:6px 8px;font-weight:700;text-align:right">Total:</td>
              <td style="padding:6px 8px;font-weight:800;color:var(--pink);text-align:right">${fmt(p.total)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Acciones -->
      <div class="presu-actions">
        <button class="presu-btn" onclick="togglePresuDetail('${p.id}')">👁 Ver</button>
        <button class="presu-btn" onclick="showPresuForm(true, allPresupuestos.find(x=>x.id==='${p.id}'))">✏️ Editar</button>
        <select class="presu-status-sel" onchange="updatePresuStatus('${p.id}',this.value)">
          <option value="pending"  ${p.status==='pending' ?'selected':''}>🟡 Pendiente</option>
          <option value="approved" ${p.status==='approved'?'selected':''}>✅ Aprobado</option>
          <option value="rejected" ${p.status==='rejected'?'selected':''}>❌ Descartado</option>
        </select>
        <button class="presu-btn presu-btn-green" onclick="convertPresuToGasto('${p.id}')" title="Crear gasto con este monto">💸 Usar</button>
        <button class="presu-btn presu-btn-cmp${cmpActive?' active':''}" onclick="toggleCompare('${p.id}')">⚖️ Comp.</button>
        <button class="presu-btn presu-btn-del" onclick="deletePresupuesto('${p.id}')">🗑</button>
      </div>
    </div>`;
  }).join('');
}

function togglePresuDetail(id){
  const el = document.getElementById('pdetail-' + id);
  if(el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
}

// ── ACTUALIZAR ESTADO ─────────────────────────────────────
async function updatePresuStatus(id, status){
  await db.from('presupuestos').update({status}).eq('id', id);
  const p = allPresupuestos.find(x => x.id === id);
  if(p) p.status = status;
  renderPresupuestosList();
}

// ── ELIMINAR ──────────────────────────────────────────────
async function deletePresupuesto(id){
  if(!confirm('¿Eliminar este presupuesto?')) return;
  await db.from('presupuestos').delete().eq('id', id);
  allPresupuestos = allPresupuestos.filter(p => p.id !== id);
  compareIds      = compareIds.filter(x => x !== id);
  renderPresupuestosList();
  if(compareIds.length < 2) document.getElementById('presuCompareWrap').style.display = 'none';
}

// ── CONVERTIR A GASTO ─────────────────────────────────────
async function convertPresuToGasto(id){
  const p = allPresupuestos.find(x => x.id === id);
  if(!p) return;
  if(!confirm(`¿Crear un gasto de ${fmt(p.total)} para "${p.store_name}"?\n\nSe registrará como gasto en la sección de movimientos.`)) return;

  const dateStr = p.date || new Date().toISOString().split('T')[0];
  const dp      = dateStr.split('-');
  const mn      = parseInt(dp[1]);

  const {error} = await db.from('transactions').insert([{
    date:          `${dp[2]}/${dp[1]}`,
    description:   p.store_name,
    category:      'materiales',
    cat_label:     TERESA_CAT['materiales']?.label || TERESA_CAT['otros']?.label || 'Materiales',
    month:         MONTHS_ES[mn].toLowerCase(),
    month_display: MONTHS_ES[mn],
    month_num:     mn,
    amount:        p.total,
    type:          'cash',
    person:        'teresa',
    direction:     'expense',
    payment_method:'efectivo',
  }]);

  if(error){ alert('Error al crear gasto: ' + error.message); return; }

  // Marcar como aprobado
  await db.from('presupuestos').update({status:'approved'}).eq('id', id);
  const presu = allPresupuestos.find(x => x.id === id);
  if(presu) presu.status = 'approved';

  alert(`✅ Gasto de ${fmt(p.total)} registrado para "${p.store_name}".`);
  renderPresupuestosList();
  loadTeresaData();
}

// ── COMPARAR PRESUPUESTOS ─────────────────────────────────
function toggleCompare(id){
  if(compareIds.includes(id)){
    compareIds = compareIds.filter(x => x !== id);
  } else {
    if(compareIds.length >= 2) compareIds.shift();
    compareIds.push(id);
  }
  renderPresupuestosList();

  const wrap = document.getElementById('presuCompareWrap');
  if(compareIds.length === 2){
    renderComparison();
    wrap.style.display = 'block';
    wrap.scrollIntoView({behavior:'smooth', block:'nearest'});
  } else {
    wrap.style.display = 'none';
  }
}

function renderComparison(){
  const [a, b] = compareIds.map(id => allPresupuestos.find(p => p.id === id));
  if(!a || !b) return;

  const aItems = Array.isArray(a.items) ? a.items : [];
  const bItems = Array.isArray(b.items) ? b.items : [];

  // Unión de todas las descripciones (normalizado a minúsculas para matching)
  const allDescs = [...new Set([
    ...aItems.map(i => i.description),
    ...bItems.map(i => i.description),
  ])];

  const rows = allDescs.map(desc => {
    const ai = aItems.find(i => i.description.toLowerCase() === desc.toLowerCase());
    const bi = bItems.find(i => i.description.toLowerCase() === desc.toLowerCase());
    const ap = ai?.unit_price ?? null;
    const bp = bi?.unit_price ?? null;
    const aCheaper = ap !== null && bp !== null && ap < bp;
    const bCheaper = ap !== null && bp !== null && bp < ap;
    return `
      <tr style="border-bottom:1px solid #f0f0f0">
        <td style="padding:5px 8px;font-size:.77rem">${escHtml(desc)}</td>
        <td style="padding:5px 8px;text-align:right;font-size:.77rem;
            font-weight:${aCheaper?'700':'400'};
            color:${aCheaper?'var(--green)':ap===null?'#ccc':'inherit'}">
          ${ap !== null ? fmt(ap) : '—'}${aCheaper ? ' ✓' : ''}
        </td>
        <td style="padding:5px 8px;text-align:right;font-size:.77rem;
            font-weight:${bCheaper?'700':'400'};
            color:${bCheaper?'var(--green)':bp===null?'#ccc':'inherit'}">
          ${bp !== null ? fmt(bp) : '—'}${bCheaper ? ' ✓' : ''}
        </td>
      </tr>`;
  }).join('');

  const aBetter = a.total <= b.total;
  document.getElementById('presuCompareWrap').innerHTML = `
    <div class="chart-card" style="margin:12px 0">
      <div class="chart-hdr">
        <h3 style="font-size:.88rem">⚖️ Comparación de Precios</h3>
        <button class="tx-toggle-btn teal-toggle"
          onclick="compareIds=[];renderPresupuestosList();document.getElementById('presuCompareWrap').style.display='none'">
          ✕ Cerrar
        </button>
      </div>
      <table style="width:100%;border-collapse:collapse">
        <thead>
          <tr style="background:#fff3e0">
            <th style="padding:7px 8px;font-size:.76rem;text-align:left">Artículo</th>
            <th style="padding:7px 8px;font-size:.76rem;text-align:right;max-width:90px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">🏪 ${escHtml(a.store_name)}</th>
            <th style="padding:7px 8px;font-size:.76rem;text-align:right;max-width:90px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">🏪 ${escHtml(b.store_name)}</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
        <tfoot>
          <tr style="border-top:2px solid #ffd0a0;background:#fffbf5">
            <td style="padding:7px 8px;font-weight:700;font-size:.8rem">Total</td>
            <td style="padding:7px 8px;text-align:right;font-weight:800;font-size:.85rem;color:${aBetter?'var(--green)':'inherit'}">
              ${fmt(a.total)}${aBetter?' ✓':''}
            </td>
            <td style="padding:7px 8px;text-align:right;font-weight:800;font-size:.85rem;color:${!aBetter?'var(--green)':'inherit'}">
              ${fmt(b.total)}${!aBetter?' ✓':''}
            </td>
          </tr>
        </tfoot>
      </table>
      <p style="font-size:.72rem;color:var(--muted);text-align:center;margin-top:8px">
        ✓ = precio más barato para ese artículo
      </p>
    </div>`;
}
