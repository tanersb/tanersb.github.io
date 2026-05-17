/**
 * NCZViewer — DevTools Koruma Katmanı
 * 
 * index.html'deki <head> sonuna veya ana <script> bloğunun başına ekle.
 * 
 * Yaptıkları:
 *  1. DevTools açıkken debugger döngüsü (stepping'i zorlaştırır)
 *  2. Konsol metodlarını siler (console.log/warn/error)
 *  3. Kaynak görüntülemeyi zorlaştır (right-click menüsünü engelle)
 * 
 * ⚠ NOT: Bu korumalar kararlı bir reverse engineer'ı durduramaz.
 *         Ama casual/script-kiddie seviyesini tamamen durdurur.
 */

(function () {

  // ── 1. Debugger döngüsü ─────────────────────────────────────────
  // DevTools açıkken pause eder, stepping imkansız hale gelir
  setInterval(function _noDebug() {
    (function () { debugger; }.call(this));
  }, 50);

  // ── 2. Console silme ────────────────────────────────────────────
  // console.log/warn/error/table/dir vs. devre dışı bırak
  (function _noConsole() {
    const noop = function () {};
    const methods = [
      'assert','clear','count','debug','dir','dirxml',
      'error','group','groupCollapsed','groupEnd',
      'info','log','profile','profileEnd',
      'table','time','timeEnd','timeStamp',
      'trace','warn'
    ];
    for (const m of methods) {
      try { console[m] = noop; } catch (_) {}
    }
    try {
      Object.defineProperty(window, 'console', {
        get() { return { ...Object.fromEntries(methods.map(m => [m, noop])) }; }
      });
    } catch (_) {}
  })();

  // ── 3. Sağ tık menüsünü engelle ─────────────────────────────────
  document.addEventListener('contextmenu', function (e) {
    e.preventDefault();
    return false;
  });

  // ── 4. F12 / Ctrl+Shift+I / Ctrl+U engellemesi ──────────────────
  document.addEventListener('keydown', function (e) {
    // F12
    if (e.keyCode === 123) { e.preventDefault(); return false; }
    // Ctrl+Shift+I
    if (e.ctrlKey && e.shiftKey && e.keyCode === 73) { e.preventDefault(); return false; }
    // Ctrl+Shift+J (Chrome console)
    if (e.ctrlKey && e.shiftKey && e.keyCode === 74) { e.preventDefault(); return false; }
    // Ctrl+U (kaynak kodu)
    if (e.ctrlKey && e.keyCode === 85) { e.preventDefault(); return false; }
  });

  // ── 5. DevTools boyut algılama ───────────────────────────────────
  // DevTools açıldığında pencere boyutu değişir → sayfayı temizle
  const _threshold = 200;
  let _devtoolsOpen = false;

  setInterval(function _detectDevtools() {
    const widthDiff  = window.outerWidth  - window.innerWidth;
    const heightDiff = window.outerHeight - window.innerHeight;
    const isOpen = widthDiff > _threshold || heightDiff > _threshold;

    if (isOpen && !_devtoolsOpen) {
      _devtoolsOpen = true;
      // İçeriği gizle — sadece uyarı göster
      document.body.innerHTML =
        '<div style="display:flex;height:100vh;align-items:center;justify-content:center;' +
        'font-family:sans-serif;font-size:18px;color:#666;">' +
        '⚠ Geliştirici araçları kapatıldığında sayfa yenilenir.' +
        '</div>';
    } else if (!isOpen && _devtoolsOpen) {
      _devtoolsOpen = false;
      window.location.reload();
    }
  }, 300);

})();
