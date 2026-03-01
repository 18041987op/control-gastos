// ── ESTADO TODO ───────────────────────────────────────────
let selectedTodoCat = '';
let allTodos        = [];

// ── HELPERS ───────────────────────────────────────────────
function getTodoCats(){
  return currentUser === 'teresa' ? TERESA_TODO_CATS : SHARELYN_TODO_CATS;
}

function getTodoContainerId(suffix){
  return currentUser === 'teresa' ? `todo${suffix}T` : `todo${suffix}S`;
}

function getTodoSelClass(){
  if(currentUser === 'teresa')  return 'sel-teal';
  if(currentUser === 'sharelyn') return 'sel';
  return 'sel-admin'; // admin ve la sección de Sharelyn
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
    .forEach(b => b.classList.remove('sel','sel-admin','sel-teal'));
  btn.classList.add(selCls);
}

// ── CARGAR TODOS ─────────────────────────────────────────
async function loadTodos(){
  const person = currentUser === 'admin' ? 'sharelyn' : currentUser;
  const {data, error} = await db.from('todos')
    .select('*').eq('person', person)
    .order('created_at', {ascending: false});

  const listId    = getTodoContainerId('List');
  const container = document.getElementById(listId);

  if(error){
    // Si la tabla no existe todavía
    if(error.code === '42P01'){
      container.innerHTML = `
        <div class="empty">
          <div class="empty-icon">🛠️</div>
          <p style="font-size:.82rem">Crea la tabla <strong>todos</strong> en tu Supabase para usar esta función.<br><br>
          <code style="background:#f0f0f0;padding:4px 8px;border-radius:6px;font-size:.75rem">
            CREATE TABLE todos (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, person TEXT, title TEXT, category TEXT, completed BOOLEAN DEFAULT FALSE, created_at TIMESTAMPTZ DEFAULT NOW());
          </code></p>
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
  const alertId = getTodoContainerId('Alert');
  const title   = document.getElementById(inputId).value.trim();
  const al      = document.getElementById(alertId);

  if(!title || !selectedTodoCat){
    showAlert(al, 'Escribe una tarea y selecciona una categoría.', 'error');
    return;
  }

  const person   = currentUser === 'admin' ? 'sharelyn' : currentUser;
  const {error}  = await db.from('todos').insert([{person, title, category: selectedTodoCat, completed: false}]);
  if(error){ showAlert(al, 'Error: ' + error.message, 'error'); return; }

  document.getElementById(inputId).value = '';
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

// ── RENDERIZAR LISTA ──────────────────────────────────────
function renderTodos(){
  const listId    = getTodoContainerId('List');
  const container = document.getElementById(listId);
  const cats      = getTodoCats();
  const isTeal    = currentUser === 'teresa';
  const isAdmin   = currentUser === 'admin';

  if(!allTodos.length){
    container.innerHTML = `
      <div class="todo-empty">
        <div class="todo-empty-icon">✅</div>
        <p>¡Sin tareas pendientes!</p>
      </div>`;
    return;
  }

  const pending = allTodos.filter(t => !t.completed);
  const done    = allTodos.filter(t => t.completed);
  let html      = '';

  if(pending.length){
    html += `<div class="todo-section-title">Pendientes (${pending.length})</div>`;
    html += pending.map(t => todoItemHtml(t, cats, isTeal, isAdmin)).join('');
  }
  if(done.length){
    html += `<div class="todo-section-title">Completadas (${done.length})</div>`;
    html += done.map(t => todoItemHtml(t, cats, isTeal, isAdmin)).join('');
  }

  container.innerHTML = html;
}

function todoItemHtml(t, cats, isTeal, isAdmin){
  const cat      = cats.find(c => c.k === t.category) || {icon:'📌', label: t.category};
  const checkCls = t.completed
    ? (isTeal ? 'checked-teal' : isAdmin ? 'checked-admin' : 'checked')
    : '';
  const tagCls   = isTeal ? 'teal' : isAdmin ? 'admin-tag' : '';

  return `
    <div class="todo-item${t.completed ? ' done' : ''}">
      <div class="todo-check ${checkCls}" onclick="toggleTodo('${t.id}',${t.completed})" title="${t.completed?'Marcar pendiente':'Marcar completada'}">
        ${t.completed ? '✓' : ''}
      </div>
      <span class="todo-title">${t.title}</span>
      <span class="todo-cat-tag ${tagCls}">${cat.icon} ${cat.label}</span>
      <button class="todo-del" onclick="deleteTodoItem('${t.id}')" title="Eliminar">🗑</button>
    </div>`;
}
