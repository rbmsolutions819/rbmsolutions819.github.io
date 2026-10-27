// RBM Solutions: permite instalar la página como app y que abra rápido.
// Cuando subás una versión nueva de la página, cambiá el número de VERSION.
const VERSION = "rbm-v9";
const ARCHIVOS = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png", "./icon-maskable-512.png", "./apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET" || new URL(r.url).origin !== location.origin) return;
  // La página: primero internet (para ver siempre lo último), si no hay señal la copia guardada.
  if (r.mode === "navigate") {
    e.respondWith(fetch(r).then(res => { const copia = res.clone(); caches.open(VERSION).then(c => c.put("./index.html", copia)); return res; })
      .catch(() => caches.match("./index.html")));
    return;
  }
  // Íconos y demás: la copia guardada y, si no está, internet.
  e.respondWith(caches.match(r).then(g => g || fetch(r)));
});
// Al tocar una notificación, abre la app.
self.addEventListener("notificationclick", e => {
  e.notification.close();
  const url = e.notification.data?.url || "./";
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(ws => {
    for (const w of ws) if ("focus" in w) return w.focus();
    return self.clients.openWindow(url);
  }));
});
