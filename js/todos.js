// ── ESTADO TODO ───────────────────────────────────────────
let selectedTodoCat = '';
let allTodos        = [];
let todosShowDone   = false;

// ── HELPERS ───────────────────────────────────────────────
function getTodoCats(){
  if(currentUser === 'teresa' && currentTeresaMode === 'personal') return TERESA_PERSONAL_TODO_CATS;
  if(currentUser === 'teresa') return TERESA_TODO_CATS;
  return SHARELYN_TODO_CATS;
}

function getTodoContainerId(suffix){
  return currentUser === 'teresa' ? `todo${suffix}T` : `todo${suffix}S`;
}

function getTodoSelClass(){
  if(currentUser === 'teresa' && currentTeresaMode === 'personal') return 'sel-rosa';
  if(currentUser === 'teresa')   return 'sel-teal';
  if(currentUser === 'sharelyn') return 'sel';
  return 'sel-admin';
}

// ── CONSTRUIR GRILLA DE CATEGORÍAS ───────────────────────
function buildTodoCatGrid(){
  const containerId = getTodoContainerId('CatGrid');
  const cats        = getTodoCats();
  const selCls      = getTodoSelClass();
  selectedTodoCat   = '';
  document.getElementById(containerId).innerHTML = cats.map(c =>
    `<button class="opt-btn" onclick="selectTodoCat('${c.k}',this,'${selCls}')">
      <span class="opt-icon">${c.icon}</span>${c.label}
    </button>`
  ).join('');
}

function selectTodoCat(k, btn, selCls){
  selectedTodoCat = k;
  btn.parentElement.querySelectorAll('.opt-btn')
    .forEach(b => b.classList.remove('sel','sel-admin','sel-teal','sel-rosa'));
  btn.classList.add(selCls);
}

// ── CARGAR TODOS ──────────────────────────────────────────
async function loadTodos(){
  const person = currentUser === 'admin' ? 'sharelyn' :
                 currentUser === 'teresa' ? (currentTeresaMode === 'personal' ? 'teresa_personal' : 'teresa') :
                 currentUser;
  const {data, error} = await db.from('todos')
    .select('*').eq('person', person)
    .order('completed', {ascending: true})
    .order('due_date',  {ascending: true, nullsFirst: false})
    .order('created_at',{ascending: false});

  const listId    = getTodoContainerId('List');
  const container = document.getElementById(listId);

  if(error){
    if(error.code === '42P01'){
      container.innerHTML = `
        <div class="empty">
          <div class="empty-icon">🛠️</div>
          <p style="font-size:.82rem">Crea la tabla <strong>todos</strong> en Supabase.<br><br>
          <code style="background:#f0f0f0;padding:4px 8px;border-radius:6px;font-size:.75rem;display:block;margin-top:8px">
            CREATE TABLE todos (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, person TEXT, title TEXT, category TEXT, due_date DATE, completed BOOLEAN DEFAULT FALSE, created_at TIMESTAMPTZ DEFAULT NOW());</code></p>
        </div>`;
    }
    return;
  }

  allTodos = data || [];
  renderTodos();
}

// ── GUARDAR TODO ──────────────────────────────────────────
async function saveTodo(){
  const inputId = getTodoContainerId('Title');
  const dateId  = getTodoContainerId('Date');
  const alertId = getTodoContainerId('Alert');
  const title   = document.getElementById(inputId).value.trim();
  const dueDate = document.getElementById(dateId).value || null;
  const al      = document.getElementById(alertId);

  if(!title || !selectedTodoCat){
    showAlert(al, 'Escribe una tarea y selecciona una categoría.', 'error');
    return;
  }

  const person  = currentUser === 'admin' ? 'sharelyn' :
                  currentUser === 'teresa' ? (currentTeresaMode === 'personal' ? 'teresa_personal' : 'teresa') :
                  currentUser;
  const {error} = await db.from('todos').insert([{
    person, title, category: selectedTodoCat, due_date: dueDate, completed: false,
  }]);
  if(error){ showAlert(al, 'Error: ' + error.message, 'error'); return; }

  document.getElementById(inputId).value = '';
  document.getElementById(dateId).value  = '';
  selectedTodoCat = '';
  buildTodoCatGrid();
  hideAlert(al);
  await loadTodos();
}

// ── COMPLETAR / DESMARCAR ─────────────────────────────────
async function toggleTodo(id, completed){
  await db.from('todos').update({completed: !completed}).eq('id', id);
  await loadTodos();
}

// ── ELIMINAR TODO ─────────────────────────────────────────
async function deleteTodoItem(id){
  if(!confirm('¿Eliminar esta tarea?')) return;
  await db.from('todos').delete().eq('id', id);
  await loadTodos();
}

// ── TOGGLE COMPLETADAS ────────────────────────────────────
function toggleShowDone(){
  todosShowDone = !todosShowDone;
  renderTodos();
}

// ── BADGE DE FECHA ────────────────────────────────────────
function dateBadgeHtml(dueDate){
  if(!dueDate) return '';
  const today    = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  if(dueDate < today)    return `<span class="todo-date overdue">🔴 Vencida</span>`;
  if(dueDate === today)  return `<span class="todo-date today">🟡 Hoy</span>`;
  if(dueDate === tomorrow) return `<span class="todo-date tomorrow">📅 Mañana</span>`;
  const [,m,d] = dueDate.split('-');
  return `<span class="todo-date future">📅 ${d}/${m}</span>`;
}

// ── RENDERIZAR LISTA ──────────────────────────────────────
function renderTodos(){
  const listId    = getTodoContainerId('List');
  const container = document.getElementById(listId);
  const cats      = getTodoCats();
  const isRosa    = currentUser === 'teresa' && currentTeresaMode === 'personal';
  const isTeal    = currentUser === 'teresa' && !isRosa;
  const isAdmin   = currentUser === 'admin';

  const pending = allTodos.filter(t => !t.completed);
  const done    = allTodos.filter(t =>  t.completed);

  if(!pending.length && !done.length){
    container.innerHTML = `
      <div class="todo-empty">
        <div class="todo-empty-icon">✅</div>
        <p>¡Sin tareas pendientes!</p>
      </div>`;
    return;
  }

  let html = '';

  if(pending.length){
    html += `<div class="todo-section-title">Pendientes (${pending.length})</div>`;
    html += pending.map(t => todoItemHtml(t, cats, isTeal, isAdmin, isRosa)).join('');
  }

  if(done.length){
    const accentCls = isRosa ? 'rosa' : isTeal ? 'teal' : isAdmin ? 'admin' : 'purple';
    html += `
      <button class="todo-done-toggle ${accentCls}" onclick="toggleShowDone()">
        ${todosShowDone
          ? `Ocultar completadas ▲`
          : `Ver completadas (${done.length}) ▼`}
      </button>`;
    if(todosShowDone){
      html += `<div class="todo-section-title" style="margin-top:0">Completadas (${done.length})</div>`;
      html += done.map(t => todoItemHtml(t, cats, isTeal, isAdmin, isRosa)).join('');
    }
  }

  container.innerHTML = html;
}

function todoItemHtml(t, cats, isTeal, isAdmin, isRosa){
  const cat      = cats.find(c => c.k === t.category) || {icon:'📌', label: t.category};
  const checkCls = t.completed
    ? (isRosa ? 'checked-rosa' : isTeal ? 'checked-teal' : isAdmin ? 'checked-admin' : 'checked')
    : '';
  const tagCls   = isRosa ? 'rosa' : isTeal ? 'teal' : isAdmin ? 'admin-tag' : '';
  const dateBadge = dateBadgeHtml(t.due_date);

  return `
    <div class="todo-item${t.completed ? ' done' : ''}">
      <div class="todo-check ${checkCls}" onclick="toggleTodo('${t.id}',${t.completed})"
           title="${t.completed ? 'Marcar pendiente' : 'Marcar completada'}">
        ${t.completed ? '✓' : ''}
      </div>
      <div class="todo-body">
        <span class="todo-title">${t.title}</span>
        <div class="todo-meta">
          ${dateBadge}
          <span class="todo-cat-tag ${tagCls}">${cat.icon} ${cat.label}</span>
        </div>
      </div>
      <button class="todo-del" onclick="deleteTodoItem('${t.id}')" title="Eliminar">🗑</button>
    </div>`;
}
