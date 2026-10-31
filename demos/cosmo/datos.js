// Pedidos de Cosmo: se guardan en la base de datos (Firebase) para que la asesora los valide desde su panel
// y el cliente vea el estado de su orden. Con ?local en la dirección se guarda solo en este navegador (para probar).
window.Pedidos = (() => {
  const CONFIG = {
    apiKey: "AIzaSyCdNwaEKRzhLAXf-vG5WJkf7qbrQJ4lkWg",
    authDomain: "rbm-solutions-2a4ce.firebaseapp.com",
    projectId: "rbm-solutions-2a4ce",
    storageBucket: "rbm-solutions-2a4ce.firebasestorage.app",
    messagingSenderId: "602522235911",
    appId: "1:602522235911:web:bd4fe58dcecb79edefe6a2"
  };
  const COL = "cosmo_pedidos", META = "cosmo_meta";
  const LOCAL = /[?&]local\b/.test(location.search);
  const BASE = "https://www.gstatic.com/firebasejs/10.12.2/";
  let F = null, db = null, listo = null;

  // ---------- versión local (solo este navegador) ----------
  const LK = "cosmo-pedidos-v1", subs = [];
  const vacio = () => ({ n: 1000, pedidos: {}, ajustes: null });
  const lLeer = () => { try { return { ...vacio(), ...JSON.parse(localStorage.getItem(LK)) }; } catch { return vacio(); } };
  const lGuardar = d => { localStorage.setItem(LK, JSON.stringify(d)); subs.forEach(f => f()); };
  addEventListener("storage", e => { if (e.key === LK) subs.forEach(f => f()); });

  function iniciar() {
    if (LOCAL) return Promise.resolve();
    if (!listo) listo = (async () => {
      const [A, Fs] = await Promise.all([import(BASE + "firebase-app.js"), import(BASE + "firebase-firestore.js")]);
      F = Fs;
      const app = A.getApps().find(a => a.name === "cosmo") || A.initializeApp(CONFIG, "cosmo");
      db = F.getFirestore(app);
    })();
    return listo;
  }
  const ms = v => v == null ? null : typeof v === "number" ? v : v.toMillis ? v.toMillis() : +v;
  const limpiar = (id, d) => ({ id, ...d, creado: ms(d.creado), historial: (d.historial || []).map(h => ({ ...h, t: ms(h.t) })) });
  const token = () => { const b = new Uint8Array(12); crypto.getRandomValues(b); return [...b].map(x => x.toString(36).padStart(2, "0")).join("").slice(0, 18); };
  const codigo = n => "COS-" + n;

  // ---------- cuentas ----------
  // Promo Cosmo: 1 por 33.800, 2 por 59.800, 3 por 86.400 (combina paquetes al menor precio).
  function precioCosmo(n){ const pk = [[1, 33800], [2, 59800], [3, 86400]], m = [0]; for (let i = 1; i <= n; i++) m[i] = Math.min(...pk.filter(([k]) => k <= i).map(([k, v]) => m[i - k] + v)); return m[n]; }
  // Solo cuentan los artículos que no se marcaron como "no disponible".
  function totales(items){
    let sub = 0, nC = 0;
    items.filter(x => x.disp !== false).forEach(x => { sub += x.precio * x.cant; if (x.promo) nC += x.cant; });
    const ahorro = nC * 33800 - precioCosmo(nC);
    return { sub, ahorro, total: sub - ahorro };
  }

  async function crear(p) {
    await iniciar();
    const ahora = Date.now(), id = token(), ev = { t: ahora, txt: "Pedido enviado para validar" };
    const doc = { ...p, estado: "nuevo", nota: "", guia: "", pagoAvisado: false };
    if (LOCAL) { const d = lLeer(); d.n++; d.pedidos[id] = { ...doc, num: d.n, codigo: codigo(d.n), creado: ahora, historial: [ev] }; lGuardar(d); return { id, codigo: codigo(d.n) }; }
    const ref = F.doc(db, COL, id), cRef = F.doc(db, META, "contador");
    const n = await F.runTransaction(db, async tx => {
      const c = await tx.get(cRef), n = (c.exists() ? c.data().n : 1000) + 1;
      tx.set(cRef, { n });
      tx.set(ref, { ...doc, num: n, codigo: codigo(n), creado: F.Timestamp.fromMillis(ahora), historial: [{ ...ev, t: F.Timestamp.fromMillis(ahora) }] });
      return n;
    });
    return { id, codigo: codigo(n) };
  }
  async function escucharUno(id, alCambiar, alFallar) {
    await iniciar();
    if (LOCAL) { const f = () => { const d = lLeer().pedidos[id]; alCambiar(d ? limpiar(id, d) : null); }; subs.push(f); setTimeout(f, 0); return; }
    F.onSnapshot(F.doc(db, COL, id), s => alCambiar(s.exists() ? limpiar(id, s.data()) : null), e => alFallar && alFallar(e));
  }
  async function escucharTodos(alCambiar, alFallar) {
    await iniciar();
    if (LOCAL) { const f = () => alCambiar(Object.entries(lLeer().pedidos).map(([id, d]) => limpiar(id, d)).sort((a, b) => b.creado - a.creado)); subs.push(f); setTimeout(f, 0); return; }
    F.onSnapshot(F.query(F.collection(db, COL), F.orderBy("creado", "desc"), F.limit(300)),
      s => alCambiar(s.docs.map(x => limpiar(x.id, x.data()))), e => alFallar && alFallar(e));
  }
  // Cambia un pedido y deja la huella en su historial.
  async function cambiar(id, cambios, evento) {
    await iniciar();
    const ahora = Date.now();
    if (LOCAL) { const d = lLeer(), p = d.pedidos[id]; if (!p) throw new Error("no-existe");
      d.pedidos[id] = { ...p, ...cambios, historial: [...(p.historial || []), ...(evento ? [{ t: ahora, txt: evento }] : [])] }; lGuardar(d); return; }
    const ref = F.doc(db, COL, id);
    await F.runTransaction(db, async tx => {
      const s = await tx.get(ref); if (!s.exists()) throw new Error("no-existe");
      tx.update(ref, { ...cambios, historial: [...(s.data().historial || []), ...(evento ? [{ t: F.Timestamp.fromMillis(ahora), txt: evento }] : [])].slice(-40) });
    });
  }
  // Datos de pago que la asesora configura en su panel y que el cliente ve al confirmarse su pedido.
  const AJ_BASE = { sinpe: "", titular: "", banco: "BAC", cuenta: "", whatsapp: "6131-9025" };
  async function ajustes() {
    await iniciar();
    if (LOCAL) return { ...AJ_BASE, ...(lLeer().ajustes || {}) };
    const s = await F.getDoc(F.doc(db, META, "ajustes")); return { ...AJ_BASE, ...(s.exists() ? s.data() : {}) };
  }
  async function guardarAjustes(a) {
    await iniciar();
    if (LOCAL) { const d = lLeer(); d.ajustes = a; lGuardar(d); return; }
    await F.setDoc(F.doc(db, META, "ajustes"), a);
  }
  // Pedidos de ejemplo para que el panel no se vea vacío la primera vez.
  async function sembrar(lista) {
    await iniciar();
    for (const p of lista) {
      const r = await crear(p.pedido);
      if (p.cambios) await cambiar(r.id, p.cambios, p.evento);
    }
  }
  return { LOCAL, crear, escucharUno, escucharTodos, cambiar, ajustes, guardarAjustes, sembrar, totales, codigo };
})();
