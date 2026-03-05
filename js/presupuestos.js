// ── ESTADO PRESUPUESTOS ───────────────────────────────────
let allPresupuestos = [];
let currentItems    = [];   // items del formulario actual
let compareIds      = [];   // hasta 2 ids para comparar
let editingPresuId  = null; // id si estamos editando
let selectedWorkCat = '';   // categoría de trabajo seleccionada

const PRESU_STATUS = {
  pending:  {label:'🟡 Pendiente', cls:'b-pending'},
  approved: {label:'✅ Aprobado',  cls:'b-approved'},
  rejected: {label:'❌ Descartado', cls:'b-rejected'},
};

// ── CATEGORÍAS DE OBRA Y ARTÍCULOS COMUNES (Honduras) ─────
const PRESU_WORK_CATS = [
  { k:'electricidad', icon:'⚡', label:'Electricidad', items:[
    'Cable calibre #10 (m)','Cable calibre #12 (m)','Cable calibre #14 (m)','Cable calibre #8 (m)',
    'Ducto PVC 1/2" (m)','Ducto PVC 3/4" (m)','Ducto PVC 1" (m)',
    'Tomacorriente doble','Switch simple','Switch doble','Switch triple',
    'Roseta para bombillo','Panel de control 8 espacios','Panel de control 12 espacios',
    'Breaker 15A','Breaker 20A','Breaker 30A','Breaker 2×20A',
    'Caja octagonal','Caja rectangular (apagador)',
  ]},
  { k:'plomeria', icon:'🔧', label:'Plomería', items:[
    'Tubo PVC 1/2" (6m)','Tubo PVC 3/4" (6m)','Tubo PVC 1" (6m)','Tubo PVC 2" (6m)','Tubo PVC 4" (6m)',
    'Codo PVC 1/2" 90°','Codo PVC 3/4" 90°','Tee PVC 1/2"',
    'Llave de chorro','Llave de paso 1/2"','Inodoro','Lavamanos',
    'Ducha sencilla','Pila de lavar','Llave de fregadero',
    'Sifón plástico','Pegamento PVC (tubo)','Teflón','Trampa PVC 2"','Reductor PVC 3/4"×1/2"',
  ]},
  { k:'estructura', icon:'🏗️', label:'Hierro y Estructura', items:[
    'Hierro #3 (3/8") varilla','Hierro #4 (1/2") varilla','Hierro #5 (5/8") varilla','Hierro #6 (3/4") varilla',
    'Alambre de amarre (lb)','Malla electrosoldada 6×6','Perfil metálico 2×4','Perfil metálico 4×4',
    'Ángulo metálico 1 1/2"','Ángulo metálico 2"','Solera metálica','Soldadura (lb)',
    'Platina 1/4"×2"','Tubo cuadrado 2×2','Tubo rectangular 2×4','Clavo 3" (lb)',
    'Perno de anclaje','Cemento (saco 50kg)','Piedrín (m³)','Arena (m³)',
  ]},
  { k:'mamposteria', icon:'🧱', label:'Block y Mampostería', items:[
    'Block 15×20×40 (und)','Block 10×20×40 (und)','Block 20×20×40 (und)','Block ½ 15×20×20',
    'Cemento (saco 50kg)','Arena (m³)','Piedrín (m³)','Cal hidratada (saco)',
    'Ladrillo de barro (und)','Mortero premezclado (saco)','Concreto premezclado (m³)',
    'Formaleta (tabla)','Cuartón de madera','Alambre de amarre (lb)',
    'Clavo 3" (lb)','Hierro #3 (3/8")','Madera para andamio','Block pómez 15×20×40',
    'Varilla lisa 1/4"','Regla de madera',
  ]},
  { k:'repello', icon:'🪣', label:'Repello y Afinado', items:[
    'Cemento (saco 50kg)','Arena fina (m³)','Cal hidratada (saco)','Masilla blanca (cubo)',
    'Bondex (saco)','Repello premezclado (saco)','Porcelana blanca (saco)',
    'Malla gallinero (m)','Malla de fibra (m²)','Impermeabilizante (galón)',
    'Esquinero de aluminio (m)','Emplaste (cubo)','Pasta corrida (galón)',
    'Sika Látex (galón)','Sika (galón)','Poliflex (rollo)',
    'Anticorrosivo (galón)','Porcelana gris (saco)','Bondex extra (saco)','Masilla acrílica (cubo)',
  ]},
  { k:'ceramica', icon:'🏠', label:'Cerámica y Pisos', items:[
    'Cerámica 30×30 (m²)','Cerámica 40×40 (m²)','Porcelanato 60×60 (m²)','Porcelanato 30×60 (m²)',
    'Piso terrazo (m²)','Bondex blanco (saco)','Porcelana blanca (saco)','Porcelana gris (saco)',
    'Crucetas plásticas (paq)','Esquinero aluminio (m)','Tape cerámica 10cm (m)',
    'Tape cerámica 15cm (m)','Ladrillo tayuyo 23×11','Piso vinílico (m²)',
    'Porcelana negra (saco)','Separadores 2mm (paq)','Adhesivo para piso (galón)',
    'Zócalo cerámico (m)','Cerámica para pared 20×30 (m²)','Piso laminado (m²)',
  ]},
  { k:'cielofalso', icon:'⬜', label:'Cielo Falso', items:[
    'Tabla yeso 4×8 (plancha)','Tabla yeso húmeda 4×8','Plycem 4×8 (plancha)',
    'Perfil canal 3 5/8"','Perfil riel 3 5/8"','Perfil canal para cielo','Angular de remate',
    'Tornillo 1" (caja 500)','Tornillo 1 5/8" (caja 500)','Pasta para juntas (cubo)',
    'Cinta de papel (rollo)','Cinta malla fibra (rollo)','Alambre colgante (m)',
    'Varilla roscada 3/8"×1m','Golosa 1 1/4" (caja)','Tubo cuadrado 7/8"',
    'Plycem texturizado 4×8','Espuma expansiva (lata)','Masilla para cielo (cubo)','Lija #120 (pliego)',
  ]},
  { k:'pintura', icon:'🖌️', label:'Pintura', items:[
    'Pintura interior (galón)','Pintura exterior (galón)','Pintura de techo (galón)',
    'Pintura anticorrosiva (galón)','Sellador acrílico (galón)','Base de agua (galón)',
    'Rodillo de felpa 9"','Brocha 3"','Brocha 4"','Cinta de enmascarar',
    'Lija #100 (pliego)','Lija #150 (pliego)','Lija #80 (pliego)','Thinner (galón)',
    'Esmalte sintético (galón)','Barniz (galón)','Imprimador (galón)',
    'Masilla plástica (cubo)','Pintura de aceite (galón)','Disolvente (galón)',
  ]},
  { k:'carpinteria', icon:'🚪', label:'Carpintería y Puertas', items:[
    'Puerta madera sólida 80×210','Puerta madera económica 80×210','Puerta metálica 80×210',
    'Marco de puerta (cedro)','Ventana aluminio corrediza 1×1.20','Ventana aluminio fija 0.60×1.20',
    'Cerradura de palanca','Cerradura de pomo','Bisagra 3 1/2" (par)','Pasador de aluminio',
    'Silicón transparente (tubo)','Vidrio claro 3mm (m²)','Vidrio claro 4mm (m²)',
    'Triplex 4×8 (plancha)','Madera cedro 1×4 (m)','Madera pino 1×6 (m)',
    'Tornillo para madera (caja)','Mosquitero (m²)','Haladera de aluminio','Moldura de madera (m)',
  ]},
  { k:'techo', icon:'🏠', label:'Techo y Cubierta', items:[
    'Lámina zinc calibre 26 (m)','Lámina zinc calibre 28 (m)','Lámina teja de barro (m²)',
    'Lámina translúcida (m)','Cuartón de madera 2×4 (m)','Cuartón de madera 2×6 (m)',
    'Viga de madera (m)','Clavo de zinc (lb)','Tornillo para lámina (caja)',
    'Cumbrera de zinc (m)','Flashing de zinc (m)','Impermeabilizante de techo (galón)',
    'Canal de aguas lluvias (m)','Bajante PVC 4" (m)','Correa metálica (m)',
    'Manto asfáltico (m²)','Espuma de poliuretano (m²)','Teja de concreto (m²)',
    'Gancho para lámina (und)','Ángulo para remate de techo',
  ]},
  { k:'general', icon:'🔨', label:'Varios / General', items:[
    'Cemento (saco 50kg)','Arena (m³)','Piedrín (m³)','Clavo 3" (lb)','Clavo 2" (lb)',
    'Alambre de amarre (lb)','Plástico de construcción','Carretilla (und)','Pala (und)',
    'Pico (und)','Regla de aluminio (m)','Nivel de burbuja','Cinta métrica 5m',
    'Plomada','Cubeta plástica 5 gal','Guantes de trabajo (par)',
    'Casco de construcción','Lentes de seguridad','Mascarilla desechable (paq)','Agua potable (garrafón)',
  ]},
];

// ── HELPERS ───────────────────────────────────────────────
function escHtml(str){
  return String(str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function calcPresuTotal(){
  return currentItems.reduce((sum, it) => sum + (parseFloat(it.qty)||0) * (parseFloat(it.unit_price)||0), 0);
}

function calcMaterialsTotal(){
  return currentItems.filter(it => it.type !== 'labor')
    .reduce((sum, it) => sum + (parseFloat(it.qty)||0) * (parseFloat(it.unit_price)||0), 0);
}

function calcLaborTotal(){
  return currentItems.filter(it => it.type === 'labor')
    .reduce((sum, it) => sum + (parseFloat(it.qty)||0) * (parseFloat(it.unit_price)||0), 0);
}

// ── SELECTOR DE CATEGORÍA DE TRABAJO ─────────────────────
function renderWorkCatSelector(){
  const wrap = document.getElementById('workCatSelectorWrap');
  if(!wrap) return;
  wrap.innerHTML = `
    <div class="work-cat-scroll">
      ${PRESU_WORK_CATS.map(c => `
        <button class="work-cat-btn${selectedWorkCat===c.k?' active':''}"
          onclick="selectWorkCat('${c.k}',this)">
          ${c.icon} ${c.label}
        </button>`).join('')}
    </div>`;
}

function selectWorkCat(k, btn){
  selectedWorkCat = k;
  document.querySelectorAll('.work-cat-btn').forEach(b => b.classList.remove('active'));
  if(btn) btn.classList.add('active');
  // Actualizar placeholder de inputs de descripción
  document.querySelectorAll('.item-desc:not(.labor-desc)').forEach(inp => {
    inp.placeholder = 'Busca o escribe un artículo…';
  });
}

// ── SUGERENCIAS DE ARTÍCULOS ──────────────────────────────
const _suggTimers = {};

function openItemSugg(i){
  clearTimeout(_suggTimers[i]);
  filterItemSugg(i, document.getElementById(`item-desc-${i}`)?.value || '');
}

function filterItemSugg(i, query){
  const el = document.getElementById(`sugg-${i}`);
  if(!el) return;
  const cat = PRESU_WORK_CATS.find(c => c.k === selectedWorkCat);
  if(!cat){ el.style.display = 'none'; return; }
  const q = (query||'').toLowerCase().trim();
  const hits = q ? cat.items.filter(it => it.toLowerCase().includes(q)) : cat.items;
  if(!hits.length){ el.style.display = 'none'; return; }
  el.innerHTML = hits.map(item =>
    `<button class="item-sugg-opt" type="button"
       onpointerdown="event.preventDefault()"
       onclick="pickItemSugg(${i},'${item.replace(/'/g,'&#39;').replace(/"/g,'&quot;')}')">
       ${escHtml(item)}
     </button>`
  ).join('');
  el.style.display = 'block';
}

function pickItemSugg(i, text){
  currentItems[i].description = text;
  const input = document.getElementById(`item-desc-${i}`);
  if(input) input.value = text;
  const el = document.getElementById(`sugg-${i}`);
  if(el) el.style.display = 'none';
  // Mover foco a cantidad
  const qty = document.getElementById(`item-qty-${i}`);
  if(qty){ qty.focus(); qty.select(); }
}

function scheduleCloseItemSugg(i){
  _suggTimers[i] = setTimeout(() => {
    const el = document.getElementById(`sugg-${i}`);
    if(el) el.style.display = 'none';
  }, 200);
}

// ── FORM: MOSTRAR / OCULTAR ───────────────────────────────
function showPresuForm(show, presupuesto){
  document.getElementById('presuFormWrap').style.display = show ? 'block' : 'none';
  document.getElementById('presuListWrap').style.display = show ? 'none'  : 'block';
  if(!show) return;

  if(!presupuesto){
    // Nuevo presupuesto → pantalla de elección
    document.getElementById('presuFormCard').style.display = 'none';
    renderPresuChoiceScreen();
  } else {
    // Editar o clonar → ir directo al formulario
    document.getElementById('presuChoiceWrap').innerHTML = '';
    _openPresuFormCard(presupuesto);
  }
}

function _openPresuFormCard(presupuesto){
  document.getElementById('presuChoiceWrap').innerHTML = '';
  document.getElementById('presuFormCard').style.display = 'block';

  editingPresuId  = presupuesto.id   || null;
  selectedWorkCat = presupuesto.work_category || '';

  document.getElementById('presuFormTitle').textContent =
    editingPresuId ? '✏️ Editar Presupuesto' : '📋 Nuevo Presupuesto';
  document.getElementById('presuStore').value = presupuesto.store_name || '';
  document.getElementById('presuDate').value  = presupuesto.date       || '';
  document.getElementById('presuNotes').value = presupuesto.notes      || '';
  document.getElementById('presuAlert').className = 'alert';
  document.getElementById('presuAlert').innerHTML  = '';

  currentItems = (Array.isArray(presupuesto.items) ? presupuesto.items : []).map(it => ({
    description: it.description || '',
    qty:         it.qty  !== undefined ? it.qty  : '',
    unit_price:  it.unit_price !== undefined ? it.unit_price : '',
    type:        it.type || 'material',
  }));

  if(!presupuesto.date) setTodayDate('presuDate');
  renderWorkCatSelector();
  renderItemsForm();
}

// ── PANTALLA DE ELECCIÓN (nuevo presupuesto) ──────────────
function renderPresuChoiceScreen(){
  document.getElementById('presuChoiceWrap').innerHTML = `
    <div class="presu-choice-screen">
      <div class="presu-choice-hdr">
        <h3>📋 Nuevo Presupuesto</h3>
        <button class="tx-toggle-btn teal-toggle" onclick="showPresuForm(false)">✕ Cancelar</button>
      </div>
      <p class="presu-choice-sub">¿Cómo quieres empezar?</p>
      <div class="presu-choice-btns">
        <button class="presu-choice-btn" onclick="startEmptyPresu()">
          <span class="pcb-icon">📄</span>
          <span class="pcb-title">Vacío</span>
          <span class="pcb-desc">Empieza desde cero</span>
        </button>
        <button class="presu-choice-btn" onclick="openComparePicker()">
          <span class="pcb-icon">⚖️</span>
          <span class="pcb-title">Comparar precios</span>
          <span class="pcb-desc">Copia artículos de un presupuesto existente</span>
        </button>
      </div>
    </div>`;
}

function startEmptyPresu(){
  _openPresuFormCard({
    id: null, store_name:'', date:'', notes:'', items:[], work_category:'',
  });
}

function openComparePicker(){
  if(!allPresupuestos.length){
    document.getElementById('presuChoiceWrap').innerHTML += `
      <p style="color:var(--muted);font-size:.82rem;text-align:center;margin-top:16px">
        No hay presupuestos guardados para comparar.
      </p>`;
    return;
  }
  document.getElementById('presuChoiceWrap').innerHTML = `
    <div class="presu-choice-screen">
      <div class="presu-choice-hdr">
        <button class="tx-toggle-btn teal-toggle" onclick="renderPresuChoiceScreen()">← Volver</button>
        <h3>⚖️ ¿Cuál es el presupuesto base?</h3>
        <button class="tx-toggle-btn teal-toggle" onclick="showPresuForm(false)">✕</button>
      </div>
      <p class="presu-choice-sub">Los artículos se copiarán. Solo tendrás que ingresar los nuevos precios.</p>
      <div id="presuPickerList">
        ${allPresupuestos.map(p => {
          const wc      = PRESU_WORK_CATS.find(c => c.k === p.work_category);
          const dateStr = p.date ? new Date(p.date+'T12:00:00').toLocaleDateString('es-HN',{day:'2-digit',month:'2-digit',year:'numeric'}) : '';
          const items   = Array.isArray(p.items) ? p.items : [];
          const labCnt  = items.filter(it => it.type === 'labor').length;
          return `
          <div class="presu-pick-card" onclick="pickCompareBase('${p.id}')">
            <div class="presu-store" style="font-size:.88rem">🏪 ${escHtml(p.store_name)}</div>
            ${wc ? `<div class="presu-work-cat-tag">${wc.icon} ${wc.label}</div>` : ''}
            <div class="presu-meta">${dateStr} · ${items.length} artículo${items.length!==1?'s':''}${labCnt?` · 🛠 ${labCnt} M.O.`:''} · <strong>${fmt(p.total)}</strong></div>
          </div>`;
        }).join('')}
      </div>
    </div>`;
}

function pickCompareBase(id){
  const p = allPresupuestos.find(x => x.id === id);
  if(!p) return;
  // Copiar items pero limpiar precios (el usuario pondrá los nuevos)
  const copiedItems = (Array.isArray(p.items) ? p.items : []).map(it => ({
    description: it.description || '',
    qty:         it.qty || '',
    unit_price:  '',        // precio vacío → usuario lo llena
    type:        it.type || 'material',
  }));
  _openPresuFormCard({
    id:            null,
    store_name:    '',      // vacío con placeholder de aviso
    date:          '',
    notes:         p.notes || '',
    items:         copiedItems,
    work_category: p.work_category || '',
    _isCompare:    true,
  });
  document.getElementById('presuFormTitle').textContent = '⚖️ Comparar — ingresa el proveedor';
  // Placeholder llamativo en el campo de proveedor
  document.getElementById('presuStore').placeholder = '⚠️ Nombre del nuevo proveedor…';
  setTimeout(() => {
    const store = document.getElementById('presuStore');
    if(store){ store.focus(); }
  }, 50);
}

// ── FORM: ITEMS ───────────────────────────────────────────
function addPresuItem(){
  const i = currentItems.length;
  currentItems.push({description:'', qty:'', unit_price:'', type:'material'});
  renderItemsForm();
  setTimeout(() => {
    const input = document.getElementById(`item-desc-${i}`);
    if(input){ input.focus(); openItemSugg(i); }
  }, 30);
}

function addLaborItem(){
  const i = currentItems.length;
  currentItems.push({description:'Mano de obra', qty:'', unit_price:'', type:'labor'});
  renderItemsForm();
  setTimeout(() => {
    const qty = document.getElementById(`item-qty-${i}`);
    if(qty) qty.focus();
  }, 30);
}

function removePresuItem(i){
  currentItems.splice(i, 1);
  renderItemsForm();
}

function updatePresuItem(i, field, value){
  currentItems[i][field] = (field === 'description') ? value : (parseFloat(value) || 0);
  const lineEl = document.getElementById(`item-line-${i}`);
  if(lineEl && field !== 'description'){
    const line = (currentItems[i].qty || 0) * (currentItems[i].unit_price || 0);
    lineEl.textContent = fmt(line);
  }
  document.getElementById('presuTotal').textContent = fmt(calcPresuTotal());
  const matEl = document.getElementById('presuMaterialsTotal');
  const labEl = document.getElementById('presuLaborTotal');
  if(matEl) matEl.textContent = fmt(calcMaterialsTotal());
  if(labEl) labEl.textContent = fmt(calcLaborTotal());
}

function renderItemsForm(){
  const wrap = document.getElementById('presuItemsWrap');
  if(!currentItems.length){
    wrap.innerHTML = '<p style="color:var(--muted);font-size:.8rem;text-align:center;padding:14px 0">Aún no hay artículos. Toca <strong>+ Material</strong> o <strong>🛠 Mano de Obra</strong>.</p>';
    document.getElementById('presuTotal').textContent = fmt(0);
    return;
  }

  // Siempre mostrar: materiales primero, mano de obra al final
  const displayOrder = [
    ...currentItems.map((it, origIdx) => ({...it, origIdx})).filter(it => it.type !== 'labor'),
    ...currentItems.map((it, origIdx) => ({...it, origIdx})).filter(it => it.type === 'labor'),
  ];

  const hasLabor = displayOrder.some(it => it.type === 'labor');
  const descHint = selectedWorkCat ? 'Busca o escribe un artículo…' : 'Descripción del artículo';

  wrap.innerHTML = displayOrder.map(it => {
    const i         = it.origIdx;
    const isLabor   = it.type === 'labor';
    const lineTotal = (parseFloat(it.qty)||0) * (parseFloat(it.unit_price)||0);
    return `
    <div class="presu-item-block${isLabor?' labor-block':''}">
      ${isLabor ? '<div class="labor-badge">🛠 Mano de Obra</div>' : ''}
      <div class="presu-desc-wrap">
        <input id="item-desc-${i}"
          class="presu-item-input item-desc${isLabor?' labor-desc':''}"
          type="text"
          value="${escHtml(it.description)}"
          placeholder="${isLabor ? 'Ej: Instalación eléctrica completa' : descHint}"
          oninput="filterItemSugg(${i},this.value);updatePresuItem(${i},'description',this.value)"
          onfocus="openItemSugg(${i})"
          onblur="scheduleCloseItemSugg(${i})">
        <div class="item-sugg-panel" id="sugg-${i}" style="display:none"></div>
      </div>
      <div class="presu-nums-row">
        <label class="num-group">
          <span class="num-lbl">Cant.</span>
          <input id="item-qty-${i}" class="presu-item-input num" type="number" min="0.01" step="any"
            value="${it.qty || ''}" placeholder="1"
            oninput="updatePresuItem(${i},'qty',this.value)">
        </label>
        <label class="num-group">
          <span class="num-lbl">Precio unit. (L)</span>
          <input id="item-price-${i}" class="presu-item-input num" type="number" min="0" step="any"
            value="${it.unit_price || ''}" placeholder="0.00"
            oninput="updatePresuItem(${i},'unit_price',this.value)">
        </label>
        <div class="num-group">
          <span class="num-lbl">Total</span>
          <span class="num-total${isLabor?' teal':''}" id="item-line-${i}">${fmt(lineTotal)}</span>
        </div>
        <button class="item-del-btn" type="button" onclick="removePresuItem(${i})" title="Eliminar">🗑</button>
      </div>
    </div>`;
  }).join('') + (hasLabor ? `
    <div class="presu-subtotals">
      <div class="presu-sub-row"><span>🧱 Materiales</span><span id="presuMaterialsTotal">${fmt(calcMaterialsTotal())}</span></div>
      <div class="presu-sub-row labor"><span>🛠 Mano de Obra</span><span id="presuLaborTotal">${fmt(calcLaborTotal())}</span></div>
    </div>` : '<span id="presuMaterialsTotal" style="display:none"></span><span id="presuLaborTotal" style="display:none"></span>');

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
    type:        it.type || 'material',
  }));

  const row = {
    person:        'teresa',
    store_name:    store,
    date,
    notes:         notes || null,
    items,
    total,
    status:        'pending',
    work_category: selectedWorkCat || null,
  };

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
        &nbsp;&nbsp;work_category TEXT,<br>
        &nbsp;&nbsp;created_at TIMESTAMPTZ DEFAULT NOW()<br>);</code>`, 'error');
    } else if(error.message?.includes('work_category')){
      showAlert(al, `Ejecuta en Supabase SQL Editor:<br>
        <code style="font-size:.75rem;display:block;margin-top:6px;padding:8px;background:#f8f8f8;border-radius:6px">
        ALTER TABLE presupuestos ADD COLUMN work_category TEXT;</code>`, 'error');
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
            &nbsp;&nbsp;work_category TEXT,<br>
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

// ── CLONAR / COMPARAR ─────────────────────────────────────
function clonePresupuesto(id){
  pickCompareBase(id); // reutiliza el mismo flujo de comparación
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
    const workCat = PRESU_WORK_CATS.find(c => c.k === p.work_category);
    const dateStr = p.date
      ? new Date(p.date + 'T12:00:00').toLocaleDateString('es-HN',{day:'2-digit',month:'2-digit',year:'numeric'})
      : '';
    const cmpActive = compareIds.includes(p.id);
    const laborItems = items.filter(it => it.type === 'labor');
    const matItems   = items.filter(it => it.type !== 'labor');

    return `
    <div class="presu-card${cmpActive ? ' presu-comparing' : ''}" id="pc-${p.id}">
      <div class="presu-card-top">
        <div style="min-width:0">
          <div class="presu-store">🏪 ${escHtml(p.store_name)}</div>
          ${workCat ? `<div class="presu-work-cat-tag">${workCat.icon} ${workCat.label}</div>` : ''}
          <div class="presu-meta">${dateStr} · ${items.length} artículo${items.length!==1?'s':''}</div>
          ${laborItems.length ? `
          <div class="presu-breakdown">
            <span class="pb-mat">🧱 ${fmt(matItems.reduce((s,it)=>s+(it.total??(it.qty||0)*(it.unit_price||0)),0))}</span>
            <span class="pb-sep">+</span>
            <span class="pb-labor">🛠 ${fmt(laborItems.reduce((s,it)=>s+(it.total??(it.qty||0)*(it.unit_price||0)),0))}</span>
            <span class="pb-sep">=</span>
            <span class="pb-total">${fmt(p.total)}</span>
          </div>` : `<div class="presu-meta-total">${fmt(p.total)}</div>`}
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
            ${matItems.map(it => `
            <tr>
              <td>${escHtml(it.description)}</td>
              <td style="text-align:center">${it.qty}</td>
              <td style="text-align:right">${fmt(it.unit_price)}</td>
              <td style="text-align:right;font-weight:700;color:var(--pink-dark)">${fmt(it.total ?? it.qty*it.unit_price)}</td>
            </tr>`).join('')}
            ${laborItems.length ? `
            <tr style="background:#f0faf8">
              <td colspan="4" style="padding:5px 8px;font-size:.72rem;font-weight:700;color:var(--teal);text-transform:uppercase;letter-spacing:.04em">🛠 Mano de Obra</td>
            </tr>
            ${laborItems.map(it => `
            <tr style="background:#f0faf8">
              <td>${escHtml(it.description)}</td>
              <td style="text-align:center">${it.qty}</td>
              <td style="text-align:right">${fmt(it.unit_price)}</td>
              <td style="text-align:right;font-weight:700;color:var(--teal)">${fmt(it.total ?? it.qty*it.unit_price)}</td>
            </tr>`).join('')}` : ''}
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
        <button class="presu-btn presu-btn-clone" onclick="clonePresupuesto('${p.id}')" title="Duplicar para comparar">📋 Copiar</button>
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

  // Separar materiales y mano de obra
  const aMat   = aItems.filter(it => it.type !== 'labor');
  const bMat   = bItems.filter(it => it.type !== 'labor');
  const aLabor = aItems.filter(it => it.type === 'labor');
  const bLabor = bItems.filter(it => it.type === 'labor');

  const aMatTotal   = aMat.reduce((s,it) => s + (it.total ?? it.qty*it.unit_price), 0);
  const bMatTotal   = bMat.reduce((s,it) => s + (it.total ?? it.qty*it.unit_price), 0);
  const aLaborTotal = aLabor.reduce((s,it) => s + (it.total ?? it.qty*it.unit_price), 0);
  const bLaborTotal = bLabor.reduce((s,it) => s + (it.total ?? it.qty*it.unit_price), 0);

  // Unión de todas las descripciones de materiales
  const allDescs = [...new Set([
    ...aMat.map(i => i.description),
    ...bMat.map(i => i.description),
  ])];

  const matRows = allDescs.map(desc => {
    const ai = aMat.find(i => i.description.toLowerCase() === desc.toLowerCase());
    const bi = bMat.find(i => i.description.toLowerCase() === desc.toLowerCase());
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

  // Filas de mano de obra
  const allLaborDescs = [...new Set([...aLabor.map(i => i.description),...bLabor.map(i => i.description)])];
  const laborRows = allLaborDescs.length ? `
    <tr style="background:#f0faf8">
      <td colspan="3" style="padding:5px 8px;font-size:.72rem;font-weight:700;color:var(--teal);text-transform:uppercase;letter-spacing:.04em">🛠 Mano de Obra</td>
    </tr>
    ${allLaborDescs.map(desc => {
      const ai = aLabor.find(i => i.description.toLowerCase() === desc.toLowerCase());
      const bi = bLabor.find(i => i.description.toLowerCase() === desc.toLowerCase());
      const ap = ai?.unit_price ?? null;
      const bp = bi?.unit_price ?? null;
      const aCheaper = ap !== null && bp !== null && ap < bp;
      const bCheaper = ap !== null && bp !== null && bp < ap;
      return `
        <tr style="border-bottom:1px solid #f0f0f0;background:#f7fdfb">
          <td style="padding:5px 8px;font-size:.77rem">${escHtml(desc)}</td>
          <td style="padding:5px 8px;text-align:right;font-size:.77rem;font-weight:${aCheaper?'700':'400'};color:${aCheaper?'var(--green)':ap===null?'#ccc':'inherit'}">
            ${ap !== null ? fmt(ap) : '—'}${aCheaper ? ' ✓' : ''}
          </td>
          <td style="padding:5px 8px;text-align:right;font-size:.77rem;font-weight:${bCheaper?'700':'400'};color:${bCheaper?'var(--green)':bp===null?'#ccc':'inherit'}">
            ${bp !== null ? fmt(bp) : '—'}${bCheaper ? ' ✓' : ''}
          </td>
        </tr>`;
    }).join('')}` : '';

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
        <tbody>
          ${matRows}
          ${laborRows}
        </tbody>
        <tfoot>
          ${(aMatTotal || bMatTotal) ? `
          <tr style="background:#fffbf5">
            <td style="padding:5px 8px;font-size:.76rem;color:var(--muted)">🧱 Subtotal materiales</td>
            <td style="padding:5px 8px;text-align:right;font-size:.76rem;color:var(--muted)">${fmt(aMatTotal)}</td>
            <td style="padding:5px 8px;text-align:right;font-size:.76rem;color:var(--muted)">${fmt(bMatTotal)}</td>
          </tr>` : ''}
          ${(aLaborTotal || bLaborTotal) ? `
          <tr style="background:#f0faf8">
            <td style="padding:5px 8px;font-size:.76rem;color:var(--teal)">🛠 Subtotal mano de obra</td>
            <td style="padding:5px 8px;text-align:right;font-size:.76rem;color:var(--teal)">${fmt(aLaborTotal)}</td>
            <td style="padding:5px 8px;text-align:right;font-size:.76rem;color:var(--teal)">${fmt(bLaborTotal)}</td>
          </tr>` : ''}
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
