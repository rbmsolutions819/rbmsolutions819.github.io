// Cuenta las visitas de rbmsolutionscr.com y de las demos. No usa cookies ni guarda datos personales:
// solo suma 1 a la página del día y a la hora en que entró. Lo ve únicamente el administrador de RBM (sección Visitas).
(() => {
  try {
    if (/[?&]local\b/.test(location.search) || /^(localhost|127\.|0\.0\.0\.0)/.test(location.hostname)) return;
    if (location.hash.startsWith("#admin") || localStorage.getItem("rbm-no-contar") === "1") return;
    const ruta = location.pathname.replace(/^\/+/, "").replace(/(index)?\.html$/, "").replace(/\/+$/, "").replace(/^demos\//, "");
    const p = (ruta.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "inicio").slice(0, 50);
    const marca = "rbm-v-" + p;
    if (sessionStorage.getItem(marca)) return;            // recargar la página no suma otra visita
    sessionStorage.setItem(marca, "1");
    const cr = new Date(Date.now() - 6 * 3600e3), f = cr.toISOString().slice(0, 10);   // fecha y hora de Costa Rica
    const hh = "h" + String(cr.getUTCHours()).padStart(2, "0");
    const dia = "rbm-vd-" + p, nueva = localStorage.getItem(dia) !== f;      // primera vez hoy en este aparato
    localStorage.setItem(dia, f);
    const P = "projects/rbm-solutions-2a4ce/databases/(default)/documents";
    fetch(`https://firestore.googleapis.com/v1/${P}:commit?key=AIzaSyCdNwaEKRzhLAXf-vG5WJkf7qbrQJ4lkWg`, {
      method: "POST", keepalive: true, headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ writes: [{ update: { name: `${P}/visitas/${f}_${p}`, fields: { p: { stringValue: p }, f: { stringValue: f } } },
        updateMask: { fieldPaths: ["p", "f"] },
        updateTransforms: [{ fieldPath: "n", increment: { integerValue: "1" } }, { fieldPath: "u", increment: { integerValue: nueva ? "1" : "0" } },
          { fieldPath: "h." + hh, increment: { integerValue: "1" } }, { fieldPath: "t", setToServerValue: "REQUEST_TIME" }] }] })
    }).catch(() => {});
  } catch {}
})();
