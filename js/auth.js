// ── PIN ───────────────────────────────────────────────────
let pinBuf = '';

function pinPress(d){
  if(pinBuf.length >= 4) return;
  if(secGetLockout()) return;           // ignorar pulsaciones si bloqueado
  pinBuf += d;
  updateDots();
  if(pinBuf.length === 4) setTimeout(pinSubmit, 120);
}

function pinClear(){
  if(secGetLockout()) return;
  pinBuf = pinBuf.slice(0,-1);
  updateDots();
}

function updateDots(){
  document.querySelectorAll('.pin-dot').forEach((d,i) => d.classList.toggle('filled', i < pinBuf.length));
}

async function pinSubmit(){
  // 1 ── ¿Bloqueado?
  const lockout = secGetLockout();
  if(lockout){ secShowLockout(lockout.until); pinBuf = ''; updateDots(); return; }

  // 2 ── Calcular hash del PIN introducido
  const h = await sha256hex(pinBuf + PIN_SALT);

  // 3 ── Comparar contra hashes almacenados
  let role = null, pinHash = null;
  if     (h === ADMIN_PIN_HASH)    { role = 'admin';    pinHash = ADMIN_PIN_HASH; }
  else if(h === SHARELYN_PIN_HASH) { role = 'sharelyn'; pinHash = SHARELYN_PIN_HASH; }
  else if(h === TERESA_PIN_HASH)   { role = 'teresa';   pinHash = TERESA_PIN_HASH; }

  if(role){
    // ✅ PIN correcto
    secClearFails();
    await secSaveSession(role, pinHash);
    if(role === 'admin')    unlockAdmin();
    else if(role === 'sharelyn') unlockSharelyn();
    else                         unlockTeresa();
  } else {
    // ❌ PIN incorrecto
    const r = secRecordFail();
    const el = document.getElementById('pinError');
    if(r.locked){
      secShowLockout(r.until);
    } else {
      el.textContent = r.remaining === 1
        ? 'PIN incorrecto — 1 intento restante.'
        : `PIN incorrecto — ${r.remaining} intentos restantes.`;
      setTimeout(() => el.textContent = '', 3000);
    }
    pinBuf = '';
    updateDots();
  }
}

function logout(){
  sessionStorage.clear();
  location.reload();
}

// ── DESBLOQUEO POR USUARIO ───────────────────────────────
function unlockAdmin(){
  currentUser = 'admin';
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('adminShell').classList.add('visible');
  document.getElementById('adminHdr').className        = 'hdr hdr-admin';
  document.getElementById('adminHdrTitle').textContent = '💳 Control de Gastos';
  document.getElementById('adminPersonTabs').style.display = 'flex';
  buildCatGrid('catGrid','opt-btn','sel-admin', Object.entries(CAT), (k) => selectedCat = k);
  setTodayDate('cashDate');
  loadDashboard();
}

function unlockSharelyn(){
  currentUser = 'sharelyn';
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('adminShell').classList.add('visible');
  document.getElementById('adminHdr').className        = 'hdr hdr-sharelyn';
  document.getElementById('adminHdrTitle').textContent = '💜 Sharelyn';
  document.getElementById('adminPersonTabs').style.display  = 'none';
  document.getElementById('slyBalBanner').style.display     = 'block';
  buildCatGrid('catGrid','opt-btn','sel', Object.entries(CAT), (k) => selectedCat = k);
  setTodayDate('cashDate');
  loadDashboard();
}

function unlockTeresa(){
  currentUser       = 'teresa';
  currentTeresaMode = 'obra';
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('teresaShell').classList.add('visible');
  // Asegurar estado visual inicial correcto (modo Obra)
  document.getElementById('teresaHdr').className       = 'hdr hdr-teresa';
  document.getElementById('teresaHdrTitle').textContent = '🏠 Obra';
  document.getElementById('teresaBanner').className    = 'balance-banner bal-teresa';
  document.getElementById('tabTeresaObra').classList.add('active');
  document.getElementById('tabTeresaPersonal').classList.remove('active');
  document.getElementById('teresaScanBtn').style.display = '';
  buildMethodGrid('ingresoMethodGrid', INCOME_METHODS,  'sel-teal', (k) => selectedIngresoMethod = k);
  buildMethodGrid('gastoMethodGrid',   EXPENSE_METHODS, 'sel-teal', (k) => selectedGastoMethod   = k);
  buildCatGrid('gastoCatGrid','opt-btn','sel-teal', Object.entries(TERESA_CAT), (k) => selectedGastoCat = k);
  setTodayDate('ingresoDate');
  setTodayDate('gastoDate');
  loadTeresaData();
  teresaShow('Dashboard');
}

// ── RESTAURAR SESIÓN ──────────────────────────────────────
window.addEventListener('DOMContentLoaded', async () => {
  // Si hay un bloqueo activo, mostrarlo aunque no haya sesión guardada
  const lockout = secGetLockout();
  if(lockout){ secShowLockout(lockout.until); }

  // Intentar restaurar sesión con token verificado
  const hashMap = {
    admin:    ADMIN_PIN_HASH,
    sharelyn: SHARELYN_PIN_HASH,
    teresa:   TERESA_PIN_HASH,
  };
  const role = await secRestoreSession(hashMap);
  if(role === 'admin')    unlockAdmin();
  else if(role === 'sharelyn') unlockSharelyn();
  else if(role === 'teresa')   unlockTeresa();
});
