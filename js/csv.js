// ── DRAG & DROP ───────────────────────────────────────────
function handleDragOver(e){
  e.preventDefault();
  document.getElementById('uploadArea').classList.add('drag');
}
function handleDragLeave(){
  document.getElementById('uploadArea').classList.remove('drag');
}
function handleDrop(e){
  e.preventDefault();
  handleDragLeave();
  const f = e.dataTransfer.files[0];
  if(f) processFile(f);
}
function handleFileSelect(e){
  const f = e.target.files[0];
  if(f) processFile(f);
}

// ── CATEGORIZACIÓN AUTOMÁTICA ─────────────────────────────
function categorize(desc){
  const d = desc.toUpperCase();
  if(/UNICAFE|ESPRESSO|VERSAILLES COFFEE/.test(d))                          return 'cafeteria';
  if(/PAPA JOHN|TAMALITO|REPOSTERIA|DOLMO|DELICATO|POPEYE|DENNY|PEDIDOSYA|PIZZA|BURGER/.test(d)) return 'restaurante';
  if(/UNIVERSIDAD|UNIV |UNICAH|INNOVACI CIENT|UTILES DE HONDURAS/.test(d)) return 'universidad';
  if(/CALZADORA|LA MODERNA|DISTEFANO|NUEVO MUNDO|DIUNSA|ZARA/.test(d))     return 'ropa';
  if(/TIGO|CLARO|HONDUTEL/.test(d))                                         return 'telefono';
  if(/APPLEACOM|APPLE|SPOTIFY|NETFLIX|AMAZON/.test(d))                      return 'suscripcion';
  if(/ESTELINA|SUPERMERCADO|MAXI|PRICESMART|WALMART/.test(d))               return 'supermercado';
  if(/MUNDIAL|SEGURO/.test(d))                                               return 'seguros';
  if(/ATM|RETIRO/.test(d))                                                   return 'efectivo';
  if(/TRANSFERENCIA|DEPOSITO|INTERES|CREDITOS VARIOS/.test(d))               return 'SKIP';
  return 'otros';
}

function categorizeIncome(desc){
  const d = desc.toUpperCase();
  if(/INTERES|FIDEICOMISO/.test(d)) return 'SKIP';
  return 'ingreso';
}

// ── PARSER CSV ────────────────────────────────────────────
function splitCSVLine(line){
  const cols = [];
  let cur = '', inQ = false;
  for(let i = 0; i < line.length; i++){
    const c = line[i];
    if(c === '"'){ inQ = !inQ; }
    else if(c === ',' && !inQ){ cols.push(cur.trim()); cur = ''; }
    else { cur += c; }
  }
  cols.push(cur.trim());
  return cols;
}

function processFile(f){
  const reader = new FileReader();
  reader.onload = e => { pendingTx = parseCSV(e.target.result); showPreview(pendingTx, f.name); };
  reader.readAsText(f, 'windows-1252');
}

function parseCSV(content){
  const lines = content.split(/\r?\n/);
  let mName = '', mNum = 0, mYear = new Date().getFullYear(), hdrIdx = -1, debIdx = 4, credIdx = -1;

  for(let i = 0; i < lines.length; i++){
    if(lines[i].includes('Desde:')){
      const p  = lines[i].split(',');
      if(p.length >= 2){
        const dp = (p[1]||'').trim().split(/[\/\-]/);
        if(dp.length >= 2){
          const mn = parseInt(dp[1]);
          if(mn >= 1 && mn <= 12){ mNum = mn; mName = MONTHS_ES[mn]; }
        }
        // Extraer año — soporta DD/MM/YYYY o YYYY-MM-DD
        if(dp.length >= 3){
          const maybeYear = parseInt(dp[2]);
          if(maybeYear >= 2020 && maybeYear <= 2099) mYear = maybeYear;
          // también intenta el primer campo si es YYYY-MM-DD
          const maybeY0 = parseInt(dp[0]);
          if(maybeY0 >= 2020 && maybeY0 <= 2099) mYear = maybeY0;
        }
      }
      break;
    }
  }

  for(let i = 0; i < lines.length; i++){
    if(/^Fecha,/i.test(lines[i])){
      hdrIdx = i;
      const c = lines[i].split(',');
      for(let j = 0; j < c.length; j++){
        if(/[Dd].?bito/.test(c[j]))   debIdx  = j;
        if(/[Cc]r.?dito/.test(c[j]))  credIdx = j;
      }
      break;
    }
  }

  if(hdrIdx < 0) return [];
  const txns = [];

  for(let i = hdrIdx+1; i < lines.length; i++){
    const line = lines[i].trim();
    if(!line || !/^\d/.test(line)) continue;
    const cols    = splitCSVLine(line);
    if(cols.length < 3) continue;
    const dateVal = cols[0], descVal = cols[1]||'';
    const dp2     = dateVal.split(/[\/\-]/);
    const fmtDate = dp2.length >= 2 ? `${dp2[0]}/${dp2[1]}` : dateVal;

    // Débito (gasto)
    let debit = 0;
    if(debIdx < cols.length){ const raw = cols[debIdx].replace(/,/g,''); debit = parseFloat(raw)||0; }
    if(debit > 0){
      const cat = categorize(descVal);
      if(cat !== 'SKIP'){
        let clean = descVal
          .replace(/Compras Tarjeta de Debito - /gi,'')
          .replace(/Compras Tarjeta de Debito-/gi,'')
          .replace(/Retiro de Efectivo - /gi,'ATM ')
          .replace(/\s{2,}/g,' ')
          .replace(/\s+(HN|US|SE)\s*$/i,'')
          .trim();
        clean = clean.split('  ')[0].trim();
        txns.push({
          date:fmtDate, description:clean, category:cat,
          cat_label:CAT[cat]?.label||cat,
          month:mName.toLowerCase(), month_display:mName, month_num:mNum,
          year:mYear, amount:debit, type:'bank', person:'sharelyn', direction:'expense',
        });
      }
    }

    // Crédito (ingreso)
    let credit = 0;
    if(credIdx >= 0 && credIdx < cols.length){ const raw = cols[credIdx].replace(/,/g,''); credit = parseFloat(raw)||0; }
    if(credit > 1){
      const catInc = categorizeIncome(descVal);
      if(catInc !== 'SKIP'){
        let cleanDesc = descVal.replace(/\s{2,}/g,' ').trim();
        if(/Transferencia entre Cuentas/i.test(cleanDesc)){
          const parts = cleanDesc.split('-');
          cleanDesc = 'Transferencia de ' + (parts[1]||'').trim().split(' ')[0];
        }
        txns.push({
          date:fmtDate, description:cleanDesc, category:'ingreso',
          cat_label:'💰 Ingreso',
          month:mName.toLowerCase(), month_display:mName, month_num:mNum,
          year:mYear, amount:credit, type:'bank', person:'sharelyn', direction:'income',
        });
      }
    }
  }
  return txns;
}

// ── PREVISUALIZACIÓN E IMPORTACIÓN ────────────────────────
function showPreview(txns, filename){
  const al = document.getElementById('uploadAlert');
  if(!txns.length){ showAlert(al,'No se encontraron transacciones en este archivo.','error'); return; }
  hideAlert(al);
  const expenses = txns.filter(t => t.direction !== 'income');
  const incomes  = txns.filter(t => t.direction === 'income');
  document.getElementById('previewTitle').textContent = `Vista previa: ${expenses.length} gastos + ${incomes.length} ingresos de "${filename}"`;
  document.getElementById('previewBox').innerHTML = `
    <table style="width:100%;font-size:.76rem;border-collapse:collapse">
      <thead><tr style="background:#eef2f8">
        <th style="padding:4px 7px;text-align:left">Fecha</th>
        <th style="padding:4px 7px;text-align:left">Descripción</th>
        <th style="padding:4px 7px;text-align:left">Tipo</th>
        <th style="padding:4px 7px;text-align:right">Monto</th>
      </tr></thead>
      <tbody>${txns.map(t => `
        <tr style="border-bottom:1px solid #eee">
          <td style="padding:3px 7px">${t.date}</td>
          <td style="padding:3px 7px;max-width:110px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${t.description}</td>
          <td style="padding:3px 7px"><span class="badge ${t.direction==='income'?'b-income':'b-bank'}">${t.direction==='income'?'💰':'💳'}</span></td>
          <td style="padding:3px 7px;text-align:right;color:${t.direction==='income'?'var(--green)':'var(--red)'};font-weight:600">${fmt(t.amount)}</td>
        </tr>`).join('')}
      </tbody>
    </table>`;

  const dupWarn   = document.getElementById('dupWarning');
  const importBtn = document.getElementById('importBtn');
  const replaceBtn= document.getElementById('replaceBtn');
  const mName     = txns[0].month;
  const mYear     = txns[0].year;
  const existing  = allTx.filter(t => t.month === mName && t.type === 'bank' && (t.year === mYear || (!t.year && !mYear)));
  if(existing.length > 0){
    showAlert(dupWarn, `⚠️ Ya hay ${existing.length} transacciones del banco de ${txns[0].month_display} ${mYear}. Usa "Borrar e Importar" para reemplazarlas.`, 'error');
    importBtn.style.display  = 'none';
    replaceBtn.style.display = 'block';
  } else {
    hideAlert(dupWarn);
    importBtn.style.display  = 'block';
    replaceBtn.style.display = 'none';
  }
  document.getElementById('previewSection').style.display = 'block';
}

async function importTransactions(){
  const btn = document.getElementById('importBtn');
  const al  = document.getElementById('uploadAlert');
  if(!pendingTx.length) return;
  btn.disabled    = true;
  btn.textContent = 'Importando…';
  const {error} = await db.from('transactions').insert(pendingTx);
  btn.disabled    = false;
  btn.textContent = '✅ Importar Transacciones';
  if(error){ showAlert(al,'Error: '+error.message,'error'); return; }
  showAlert(al, `✅ ${pendingTx.length} transacciones importadas.`, 'success');
  cancelUpload();
  await loadDashboard();
}

async function replaceTransactions(){
  const btn = document.getElementById('replaceBtn');
  const al  = document.getElementById('uploadAlert');
  if(!pendingTx.length) return;
  btn.disabled    = true;
  btn.textContent = 'Borrando…';
  let delQ = db.from('transactions').delete().eq('month',pendingTx[0].month).eq('type','bank').eq('person','sharelyn');
  if(pendingTx[0].year) delQ = delQ.eq('year', pendingTx[0].year);
  await delQ;
  const {data} = await db.from('transactions')
    .select('id,date,description,category,cat_label,month,month_display,month_num,amount,type,person,direction,has_receipt')
    .eq('person','sharelyn');
  allTx = data || [];
  btn.textContent = 'Importando…';
  await importTransactions();
  btn.disabled    = false;
  btn.textContent = '🔄 Borrar mes anterior e Importar';
}

function cancelUpload(){
  pendingTx = [];
  document.getElementById('previewSection').style.display = 'none';
  document.getElementById('csvFileInput').value           = '';
  document.getElementById('importBtn').style.display      = 'block';
  document.getElementById('replaceBtn').style.display     = 'none';
}

// ── DESCARGA CSV ──────────────────────────────────────────
function downloadCSV(rows, filename){
  const n = rows.length;
  if(!window.confirm(`¿Deseas descargar el historial como CSV?\n\nSe exportarán ${n} ${n===1?'movimiento':'movimientos'}.`)) return;
  const hdrs = ['Fecha','Descripción','Categoría','Mes','Tipo','Dirección','Monto (L)','Editado Por','Editado En'];
  const esc  = v => `"${String(v==null?'':v).replace(/"/g,'""')}"`;
  const lines = [hdrs.map(esc).join(',')];
  [...rows].forEach(t => {
    const cat      = ALL_CATS[t.category]?.label||t.category||'';
    const editedAt = t.edited_at ? new Date(t.edited_at).toLocaleDateString('es-HN') : '';
    lines.push([
      t.date, t.description, cat,
      t.month_display||t.month||'',
      t.type||'bank', t.direction||'expense',
      parseFloat(t.amount||0).toFixed(2),
      t.edited_by||'', editedAt,
    ].map(esc).join(','));
  });
  const blob = new Blob(['\uFEFF'+lines.join('\n')], {type:'text/csv;charset=utf-8'});
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function downloadCSVTeresa(filename){
  downloadCSV(teresaTx, filename);
}
