// The Blessing: guarda la app para abrirla rápido. Las páginas siempre se buscan primero en internet.
const CACHE = 'blessing-demo-v5';
const FILES = ['./', './index.html', './barberia.html', './estilo.css', './blessing.js', './qrcode.min.js', './jsQR.js', './manifest.json', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x.startsWith('blessing-') && x !== CACHE).map(x => caches.delete(x)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin || !u.pathname.includes('/demos/blessing/')) return;
  e.respondWith(fetch(r).then(res => {
    if (res.ok) { const c = res.clone(); caches.open(CACHE).then(x => x.put(r, c)); }
    return res;
  }).catch(() => caches.match(r).then(h => h || caches.match('./index.html'))));
});
