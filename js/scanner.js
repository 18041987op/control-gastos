// ── ESCÁNER DE CÓDIGO DE BARRAS ──────────────────────────
// Usa Html5Qrcode para acceder a la cámara y detectar códigos.
// Consulta Open Food Facts API (gratuita, sin key) para info del producto.
let scannerInstance = null;
let scannerRunning  = false;
let lastScannedCode = '';
let lastProductName = '';

function openScanner(){
  document.getElementById('scannerModal').style.display = 'flex';
  document.getElementById('scanResult').style.display   = 'none';
  document.getElementById('scannerView').innerHTML      = '';
  startScanner();
}

function closeScanner(){
  stopScanner();
  document.getElementById('scannerModal').style.display = 'none';
}

function startScanner(){
  const scanner = new Html5Qrcode('scannerView');
  scannerInstance = scanner;
  scannerRunning  = true;

  scanner.start(
    { facingMode: 'environment' },
    { fps: 10, qrbox: { width: 260, height: 120 } },
    onBarcodeDetected,
    () => {} // ignorar errores de frame (normales durante el escaneo)
  ).catch(() => {
    document.getElementById('scannerView').innerHTML =
      '<p class="scan-err">No se pudo acceder a la cámara.<br>Verifica los permisos del navegador.</p>';
    scannerRunning = false;
  });
}

function stopScanner(){
  if(scannerInstance && scannerRunning){
    scannerInstance.stop().catch(() => {});
    scannerRunning = false;
  }
}

async function onBarcodeDetected(code){
  stopScanner();
  lastScannedCode = code;
  lastProductName = '';

  document.getElementById('scannerView').innerHTML    = '<div class="scan-ok-icon">✅</div>';
  document.getElementById('scannedCodeDisplay').textContent = code;
  document.getElementById('scanResult').style.display = 'block';
  document.getElementById('productInfo').innerHTML    =
    '<div class="loading"><div class="spinner"></div><br>Buscando producto…</div>';

  try {
    const res  = await fetch(`https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(code)}.json`);
    const data = await res.json();

    if(data.status === 1 && data.product){
      const p     = data.product;
      const name  = p.product_name || p.product_name_es || p.product_name_en || '';
      const brand = p.brands   || '';
      const qty   = p.quantity || '';

      if(name){
        lastProductName = name + (brand ? ' — ' + brand : '');
        document.getElementById('productInfo').innerHTML = `
          <div class="product-card">
            <div class="product-name">${name}</div>
            ${brand ? `<div class="product-brand">🏷️ ${brand}</div>` : ''}
            ${qty   ? `<div class="product-qty">📦 ${qty}</div>`   : ''}
          </div>
          <button class="btn btn-t" onclick="useProductName()" style="margin-top:10px">
            ✏️ Usar como descripción
          </button>`;
      } else {
        document.getElementById('productInfo').innerHTML =
          '<p class="scan-not-found">Código encontrado pero sin nombre de producto registrado.</p>';
      }
    } else {
      document.getElementById('productInfo').innerHTML =
        '<p class="scan-not-found">Producto no encontrado en la base de datos.</p>';
    }
  } catch(_){
    document.getElementById('productInfo').innerHTML =
      '<p class="scan-not-found">Sin conexión o error al consultar.</p>';
  }
}

function useProductName(){
  if(lastProductName) document.getElementById('gastoDesc').value = lastProductName;
  closeScanner();
}

function searchOnWeb(){
  const q = lastProductName || lastScannedCode;
  window.open(`https://www.google.com/search?q=${encodeURIComponent(q)}`, '_blank');
}
