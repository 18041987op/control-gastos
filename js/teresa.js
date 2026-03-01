// ── NAVEGACIÓN TERESA ─────────────────────────────────────
function teresaShow(name){
  document.querySelectorAll('#teresaShell .view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('#teresaShell .nav-btn').forEach(b => b.classList.remove('active','t-active'));
  document.getElementById('tv' + name).classList.add('active');
  const btn = document.getElementById('tn' + name);
  if(btn) btn.classList.add('t-active');
  if(name === 'Todo') { buildTodoCatGrid(); loadTodos(); }
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
    amount: amt, type: 'cash', person: 'teresa',
    direction: 'income', payment_method: selectedIngresoMethod,
  }]);
  if(error){ showAlert(al, 'Error: ' + error.message, 'error'); return; }
  showAlert(al, '✅ Ingreso guardado.', 'success');
  document.getElementById('ingresoDesc').value = '';
  document.getElementById('ingresoAmt').value  = '';
  selectedIngresoMethod = '';
  document.querySelectorAll('#ingresoMethodGrid .opt-btn').forEach(b => b.classList.remove('sel','sel-teal'));
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
  const dp = date.split('-');
  const mn = parseInt(dp[1]);
  const row = {
    date: `${dp[2]}/${dp[1]}`, description: desc,
    category: selectedGastoCat, cat_label: TERESA_CAT[selectedGastoCat]?.label||selectedGastoCat,
    month: MONTHS_ES[mn].toLowerCase(), month_display: MONTHS_ES[mn], month_num: mn,
    amount: amt, type: 'cash', person: 'teresa',
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
  document.querySelectorAll('#gastoCatGrid .opt-btn,#gastoMethodGrid .opt-btn').forEach(b => b.classList.remove('sel','sel-teal'));
  clearReceipt();
  loadTeresaData();
}

// ── CARGAR DATOS DE TERESA ────────────────────────────────
async function loadTeresaData(){
  const COLS = 'id,date,description,category,cat_label,month,month_display,amount,direction,payment_method,has_receipt,created_at,edited_at,edited_by';
  const {data} = await db.from('transactions')
    .select(COLS).eq('person','teresa')
    .order('created_at',{ascending:false});
  teresaTx = data || [];
  renderTeresaBanner();
  renderTHistorial();
}

function renderTeresaBanner(){
  const income = sumAmt(teresaTx.filter(t => t.direction === 'income'));
  const spent  = sumAmt(teresaTx.filter(t => t.direction === 'expense'));
  const bal    = income - spent;
  document.getElementById('teresaBalance').textContent  = fmt(bal);
  document.getElementById('teresaReceived').textContent = fmt(income);
  document.getElementById('teresaSpent').textContent    = fmt(spent);
  document.getElementById('teresaHdrSub').textContent   = `Balance: ${fmt(bal)}`;
}

function setTHistFilter(f){
  tHistFilter = f;
  document.querySelectorAll('#tHistFilter .pill').forEach((p,i) =>
    p.classList.toggle('active', ['all','income','expense'][i] === f)
  );
  renderTHistorial();
}

function renderTHistorial(){
  const tx = tHistFilter === 'all' ? teresaTx : teresaTx.filter(t => t.direction === tHistFilter);
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
        <button class="del-btn" title="Editar" style="color:#b2dfdb" onclick="openEditModal('${t.id}','teresa')">✏️</button>
        <button class="del-btn" onclick="deleteTx('${t.id}','teresa')">🗑</button>
      </td>
    </tr>`).join('');
}
