// ── SEGURIDAD: SHA-256 + BLOQUEO + TOKENS ─────────────────
// Toda la lógica de seguridad del login vive aquí.

// ── 1. SHA-256 VÍA WEB CRYPTO API ─────────────────────────
// Nativa en todos los navegadores modernos, sin librerías externas.
async function sha256hex(str){
  const buf = await crypto.subtle.digest(
    'SHA-256', new TextEncoder().encode(str)
  );
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2,'0')).join('');
}

// ── 2. BLOQUEO PROGRESIVO ──────────────────────────────────
const SEC_MAX_ATTEMPTS = 5;     // intentos antes de bloquear
const SEC_LOCK_MS      = 5 * 60 * 1000; // 5 minutos de bloqueo
const _LOCK_KEY        = 'gasto_lockout';
const _ATTEMPTS_KEY    = 'gasto_attempts';

let _lockTimer = null;

function secGetLockout(){
  try {
    const v = JSON.parse(localStorage.getItem(_LOCK_KEY));
    if(v?.until > Date.now()) return v;
  } catch(e){}
  return null;
}

// Registra un fallo y devuelve {locked, until?, remaining?}
function secRecordFail(){
  let n = parseInt(localStorage.getItem(_ATTEMPTS_KEY) || '0') + 1;
  localStorage.setItem(_ATTEMPTS_KEY, n);
  if(n >= SEC_MAX_ATTEMPTS){
    const until = Date.now() + SEC_LOCK_MS;
    localStorage.setItem(_LOCK_KEY, JSON.stringify({until}));
    localStorage.removeItem(_ATTEMPTS_KEY);
    return {locked: true, until};
  }
  return {locked: false, remaining: SEC_MAX_ATTEMPTS - n};
}

function secClearFails(){
  localStorage.removeItem(_ATTEMPTS_KEY);
  localStorage.removeItem(_LOCK_KEY);
}

// Muestra cuenta regresiva en #pinError y bloquea el pad
function secShowLockout(until){
  if(_lockTimer) clearInterval(_lockTimer);
  _setPadDisabled(true);
  function tick(){
    const secs = Math.ceil((until - Date.now()) / 1000);
    if(secs <= 0){
      clearInterval(_lockTimer);
      _lockTimer = null;
      localStorage.removeItem(_LOCK_KEY);
      document.getElementById('pinError').textContent = '';
      _setPadDisabled(false);
      return;
    }
    const m = Math.floor(secs / 60);
    const s = String(secs % 60).padStart(2,'0');
    document.getElementById('pinError').textContent =
      `🔒 Demasiados intentos — espera ${m}:${s}`;
  }
  tick();
  _lockTimer = setInterval(tick, 1000);
}

function _setPadDisabled(on){
  document.querySelectorAll('.pin-btn').forEach(b => {
    b.disabled = on;
    b.style.opacity = on ? '0.35' : '';
  });
}

// ── 3. TOKEN DE SESIÓN CON FECHA ───────────────────────────
// El token es SHA-256(role + ':' + pinHash + ':' + YYYY-MM-DD).
// Cambia cada día → una sesión guardada en sessionStorage expira
// automáticamente y no puede ser forjada sin conocer el pinHash.

async function secMakeToken(role, pinHash){
  const day = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  return sha256hex(`${role}:${pinHash}:${day}`);
}

async function secVerifyToken(role, pinHash, token){
  return token === await secMakeToken(role, pinHash);
}

// Guarda sesión en sessionStorage como JSON firmado
async function secSaveSession(role, pinHash){
  const token = await secMakeToken(role, pinHash);
  sessionStorage.setItem('auth', JSON.stringify({role, token}));
}

// Restaura sesión si el token sigue siendo válido; devuelve rol o null
async function secRestoreSession(hashMap){
  try {
    const stored = JSON.parse(sessionStorage.getItem('auth'));
    if(!stored?.role || !stored?.token) return null;
    const pinHash = hashMap[stored.role];
    if(!pinHash) return null;
    const ok = await secVerifyToken(stored.role, pinHash, stored.token);
    if(!ok){ sessionStorage.clear(); return null; }
    return stored.role;
  } catch(e){
    sessionStorage.clear();
    return null;
  }
}
