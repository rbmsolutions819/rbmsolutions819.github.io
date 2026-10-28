// Koktela: permite mostrar avisos en el celular (sellos, gratis y promociones).
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));
// Al tocar un aviso, abre (o trae al frente) la tarjeta.
self.addEventListener("notificationclick", e => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || "tarjeta.html";
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(ws => {
    for (const w of ws) if (w.url.includes("tarjeta.html") && "focus" in w) return w.focus();
    return self.clients.openWindow(url);
  }));
});
