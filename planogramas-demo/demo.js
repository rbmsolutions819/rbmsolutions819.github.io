// Planogramas AI — modo demostración. Sin conexión a Microsoft ni a Auto Mercado: todo es de prueba.
(function () {
  const store = (() => { try { return window.sessionStorage; } catch { return { getItem(){return null}, setItem(){}, removeItem(){} }; } })();
  const cuenta = { name: "Usuario de demostración", username: "demo@automercado.biz", homeAccountId: "demo" };
  window.msal = { PublicClientApplication: function () {
    let activa = null;
    this.initialize = () => Promise.resolve();
    this.handleRedirectPromise = () => Promise.resolve(null);
    this.getAllAccounts = () => store.getItem("demo-sesion") ? [cuenta] : [];
    this.setActiveAccount = (c) => { activa = c; };
    this.getActiveAccount = () => activa || cuenta;
    this.acquireTokenSilent = () => Promise.resolve({ accessToken: "demo" });
    this.acquireTokenRedirect = () => Promise.resolve();
    this.loginRedirect = () => { store.setItem("demo-sesion", "1"); location.reload(); };
    this.logoutRedirect = () => { store.removeItem("demo-sesion"); location.reload(); };
  } };

  const cats = ["Aceites y Grasas","Aderezos y Vinagres","Salsas","Pastas Alimenticias","Cloro","Detergentes Líquidos","Galletas","Cereales","Tortillas","Barquillos","Aguas","Cervezas"];
  const planos = cats.map((c, i) => ({ id: "demo-" + i, codigo: String(417600 + i), categoria: c, pasillo: String(4 + (i % 8)) }));
  planos.push({ id: "demo-99", codigo: "900019", categoria: "Mueble Palomitas", pasillo: null });
  const ahora = Date.now();
  const resultados = planos.slice(0, 7).map((p, k) => {
    const pct = [54, 67, 92, 81, 96, 73, 45][k];
    const det = { cumplimiento: pct, resumen: "Dos frentes vacíos en el estante 2 y un producto fuera de lugar.",
      estantes: [{ estante: 1, estado: "correcto", detalle: "Coincide con el planograma" }, { estante: 2, estado: "con_diferencias", detalle: "Dos frentes vacíos a la derecha" }, { estante: 3, estado: "correcto", detalle: "Coincide con el planograma" }],
      faltantes: ["Producto del estante 2, posición 7"], mal_ubicados: ["Producto del estante 4 fuera de su lugar"], sobrantes: [], calidad_foto: "buena", recomendacion_foto: "" };
    return { id: "r" + k, fecha: new Date(ahora - k * 5 * 3600e3).toISOString(), usuario: cuenta.username, nombre: cuenta.name, storeId: "17", tienda: "AM-17-SAN FRANCISCO",
      planogramaId: p.id, codigo: p.codigo, pasillo: p.pasillo, categoria: p.categoria, notas: "", cumplimiento: pct, resumen: det.resumen, detalle: det };
  });

  const json = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { "Content-Type": "application/json" } });
  const fetchReal = window.fetch.bind(window);
  window.fetch = async (url, opts = {}) => {
    const u = new URL(typeof url === "string" ? url : url.url, location.href);
    const i = u.pathname.indexOf("/api/");
    if (i < 0) return fetchReal(url, opts);
    const ruta = u.pathname.slice(i);
    await new Promise(r => setTimeout(r, 150));
    if (ruta === "/api/me") return json({ nombre: cuenta.name, correo: cuenta.username, admin: false, tiendas: ["17"], roles: ["Tienda.17"] });
    if (ruta === "/api/tiendas") return json([{ storeId: "17", nombre: "AM-17-SAN FRANCISCO", activa: true }]);
    if (ruta === "/api/tiendas/17/planogramas") return json(planos);
    if (ruta === "/api/resultados") {
      const pl = u.searchParams.get("planograma");
      return json(resultados.filter(r => !pl || r.planogramaId === pl).sort((a, b) => b.fecha.localeCompare(a.fecha)));
    }
    let m = ruta.match(/^\/api\/planogramas\/([^/]+)\/pdf$/);
    if (m) return fetchReal(new URL("plano-demo.pdf", location.href));
    m = ruta.match(/^\/api\/planogramas\/([^/]+)\/analizar$/);
    if (m) {
      const p = planos.find(x => x.id === m[1]); const cuerpo = JSON.parse(opts.body || "{}");
      await new Promise(r => setTimeout(r, 2600));
      const pct = 62 + Math.floor(Math.random() * 36);
      const malo = pct < 90;
      const det = { cumplimiento: pct,
        resumen: malo ? "Hay frentes vacíos en el estante 2 y un producto fuera de lugar en el estante 4. El resto coincide con el planograma." : "La góndola coincide con el planograma. Solo hay detalles menores de acomodo.",
        estantes: [1,2,3,4,5].map(n => ({ estante: n, estado: malo && (n === 2 || n === 4) ? "con_diferencias" : "correcto",
          detalle: malo && n === 2 ? "Tres frentes vacíos al lado derecho" : malo && n === 4 ? "Un producto fuera de su lugar" : "Coincide con el planograma" })),
        faltantes: malo ? ["Producto del estante 2, posiciones 8 a 10"] : [], mal_ubicados: malo ? ["Producto del estante 4, posición 3"] : [], sobrantes: [],
        calidad_foto: "buena", recomendacion_foto: "" };
      const r = { id: "n" + Date.now(), fecha: new Date().toISOString(), usuario: cuenta.username, nombre: cuenta.name, storeId: "17", tienda: "AM-17-SAN FRANCISCO",
        planogramaId: p.id, codigo: p.codigo, pasillo: p.pasillo, categoria: p.categoria, notas: cuerpo.notas || "", cumplimiento: pct, resumen: det.resumen, detalle: det };
      resultados.push(r);
      return json(r);
    }
    return json({ error: "No disponible en la demostración" }, 404);
  };
})();
