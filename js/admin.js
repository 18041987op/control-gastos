// ── VISTA ADMIN: TERESA ───────────────────────────────────
async function loadTeresaAdminView(){
  show('taLoading'); hide('taContent'); hide('taEmpty');
  const COLS = 'id,date,description,category,cat_label,month,month_display,amount,direction,payment_method,has_receipt,created_at,edited_at,edited_by';
  const {data} = await db.from('transactions')
    .select(COLS).eq('person','teresa')
    .order('created_at',{ascending:false});
  hide('taLoading');
  if(!data?.length){ show('taEmpty'); return; }
  teresaTx = data;
  renderTeresaAdminCards();
  renderTaTopPlaces();
  renderTaTable();
  show('taContent');
}

function renderTeresaAdminCards(){
  const income = sumAmt(teresaTx.filter(t => t.direction === 'income'));
  const spent  = sumAmt(teresaTx.filter(t => t.direction === 'expense'));
  const bal    = income - spent;
  document.getElementById('taBal').textContent    = fmt(bal);
  document.getElementById('taBalSub').textContent = `Recibió ${fmt(income)} · Gastó ${fmt(spent)}`;
  document.getElementById('taIncome').textContent = fmt(income);
  document.getElementById('taSpent').textContent  = fmt(spent);
}

function renderTaTopPlaces(){
  const expenses = teresaTx.filter(t => t.direction === 'expense');
  const places   = groupSum(expenses, 'description');
  const sorted   = Object.entries(places).sort((a,b) => b[1]-a[1]).slice(0,8);
  const max      = sorted[0]?.[1] || 1;
  document.getElementById('taTopPlaces').innerHTML = sorted.length
    ? sorted.map(([n,a]) => `
        <div class="top-item">
          <div class="top-lbl" title="${n}">${n}</div>
          <div class="top-track"><div class="top-fill teal" style="width:${(a/max*100).toFixed(1)}%"></div></div>
          <div class="top-amt teal">${fmt(a)}</div>
        </div>`).join('')
    : '<p style="color:var(--muted);font-size:.82rem;text-align:center;padding:10px">Sin gastos aún.</p>';
}

function setTaFilter(f){
  taFilter = f;
  document.querySelectorAll('#taDirFilter .pill').forEach((p,i) =>
    p.classList.toggle('active', ['all','income','expense'][i] === f)
  );
  renderTaTable();
}

function renderTaTable(){
  const tx = taFilter === 'all' ? teresaTx : teresaTx.filter(t => t.direction === taFilter);
  if(!tx.length){
    document.getElementById('taTxBody').innerHTML = '<tr><td colspan="8" style="text-align:center;padding:14px;color:#aaa">Sin movimientos</td></tr>';
    return;
  }
  document.getElementById('taTxBody').innerHTML = tx.map(t => `
    <tr${t.edited_at?' class="was-edited"':''}>
      <td>${t.date}${t.edited_at?`<span class="edited-mark" title="Editado por ${t.edited_by||'?'}">✏️</span>`:''}</td>
      <td style="max-width:100px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${t.description}</td>
      <td><span class="badge ${t.direction==='income'?'b-income':'b-expense'}">${t.direction==='income'?'📥':'💸'}</span></td>
      <td>${t.payment_method?`<span class="badge b-method">${METHOD_LABEL[t.payment_method]||t.payment_method}</span>`:'—'}</td>
      <td><span class="badge b-cat">${t.category?TERESA_CAT[t.category]?.emoji||'📦':'—'}</span></td>
      <td class="${t.direction==='income'?'amount-pos':'amount-neg'}">${fmt(t.amount)}</td>
      <td>${t.has_receipt?`<span style="cursor:pointer;font-size:1.2rem" onclick="openReceipt('${t.id}')" title="Ver recibo">📸</span>`:'—'}</td>
      <td style="white-space:nowrap">
        <button class="del-btn" title="Editar" style="color:#b2dfdb" onclick="openEditModal('${t.id}','teresa')">✏️</button>
        <button class="del-btn" onclick="deleteTx('${t.id}','teresa')">🗑</button>
      </td>
    </tr>`).join('');
}
