// ── PIN ───────────────────────────────────────────────────
let pinBuf = '';

function pinPress(d){
  if(pinBuf.length >= 4) return;
  pinBuf += d;
  updateDots();
  if(pinBuf.length === 4) setTimeout(pinSubmit, 120);
}

function pinClear(){
  pinBuf = pinBuf.slice(0,-1);
  updateDots();
}

function updateDots(){
  document.querySelectorAll('.pin-dot').forEach((d,i) => d.classList.toggle('filled', i < pinBuf.length));
}

function pinSubmit(){
  if(pinBuf === ADMIN_PIN)         { sessionStorage.setItem('auth','admin');    unlockAdmin(); }
  else if(pinBuf === SHARELYN_PIN) { sessionStorage.setItem('auth','sharelyn'); unlockSharelyn(); }
  else if(pinBuf === TERESA_PIN)   { sessionStorage.setItem('auth','teresa');   unlockTeresa(); }
  else {
    document.getElementById('pinError').textContent = 'PIN incorrecto.';
    pinBuf = '';
    updateDots();
    setTimeout(() => document.getElementById('pinError').textContent = '', 2000);
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
  currentUser = 'teresa';
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('teresaShell').classList.add('visible');
  buildMethodGrid('ingresoMethodGrid', INCOME_METHODS,  'sel-teal', (k) => selectedIngresoMethod = k);
  buildMethodGrid('gastoMethodGrid',   EXPENSE_METHODS, 'sel-teal', (k) => selectedGastoMethod   = k);
  buildCatGrid('gastoCatGrid','opt-btn','sel-teal', Object.entries(TERESA_CAT), (k) => selectedGastoCat = k);
  setTodayDate('ingresoDate');
  setTodayDate('gastoDate');
  loadTeresaData();
  teresaShow('Dashboard');
}

// ── RESTAURAR SESIÓN ──────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  const a = sessionStorage.getItem('auth');
  if(a === 'admin')    unlockAdmin();
  else if(a === 'sharelyn') unlockSharelyn();
  else if(a === 'teresa')   unlockTeresa();
});
