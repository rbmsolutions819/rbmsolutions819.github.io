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
  // Promo por paquetes (Cosmo: 1 por 33.800, 2 por 59.800, 3 por 86.400). Combina paquetes al menor precio.
  const PK_BASE = [33800, 59800, 86400];
  function precioPaquetes(n, pk = PK_BASE){ const m = [0]; for (let i = 1; i <= n; i++) m[i] = Math.min(...pk.map((v, j) => j + 1 <= i ? m[i - j - 1] + v : Infinity)); return m[n]; }
  // Solo cuentan los artículos que no se marcaron como "no disponible".
  function totales(items){
    let sub = 0, nC = 0, pk = null;
    items.filter(x => x.disp !== false).forEach(x => { sub += x.precio * x.cant; if (x.promo) { nC += x.cant; pk = pk || (Array.isArray(x.pk) ? x.pk : PK_BASE); } });
    const ahorro = nC ? nC * pk[0] - precioPaquetes(nC, pk) : 0;
    return { sub, ahorro: Math.max(0, ahorro), total: sub - Math.max(0, ahorro), nC, pk: pk || PK_BASE };
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

  // ---------- catálogo editable ----------
  // Se guarda en cosmo_meta/catalogo. Las fotos que sube la asesora van aparte, en cosmo_fotos (una por documento),
  // y en el catálogo quedan como "f:<id>". Las fotos originales de la página son rutas "fotos/...".
  const TALLAS = ["XXS","XS","S","M","L","XL","XXL","XXXL","Única"];
  const T_MUJER = TALLAS.slice(0, 8), T_GAB = ["XS","S","M","L","XL","XXL"];
  const c = (id, nombre, hex, foto) => ({ id, nombre, hex, foto });
  const serie = (pre, l) => l.map(([id, n, h]) => c(id, n, h, `fotos/${pre}-${id}.jpg`));
  const CAT_BASE = { promo: { activa: true, nombre: "Promo Cosmo", pk: [33800, 59800, 86400] }, productos: [
    { id: "cosmo", linea: "Cosmo", nombre: "Uniforme Cosmo", precio: 33800, promo: true, tallas: T_MUJER, largo: true, visible: true, modelo: false,
      desc: "Blusa cuello mao con escote en V y pantalón cargo con cordón. Tela colombiana antifluidos y stretch.",
      colores: serie("cosmo", [["negro","Negro","#1b1c1f"],["rosado","Rosado","#e98fb0"],["vino","Vino","#6e1428"],["lila","Lila","#9b7be0"],["gris-acero","Gris acero","#5a5a72"],["verde-botella","Verde botella","#1f5a44"],["durazno","Durazno","#f0a596"],["malva","Malva","#d79ab8"],["turquesa","Turquesa","#2ab2c4"]]) },
    { id: "aloha", linea: "Aloha", nombre: "Uniforme Aloha", precio: 32800, promo: false, tallas: T_MUJER, largo: true, visible: true, modelo: false,
      desc: "Blusa cuello V y pantalón cargo con cordón. Disponible en colores sólidos y en degradado.",
      colores: serie("aloha", [["degradado-lila","Degradado lila","linear-gradient(180deg,#e6d4f5,#6d2cc0)"],["degradado-celeste","Degradado celeste","linear-gradient(180deg,#bff0ee,#5b25b5)"],["coral","Coral","#f0566f"],["morado","Morado","#7a1fcf"],["palo-rosa","Palo rosa","#dba3a3"],["vino","Vino","#6e1428"],["rosado-claro","Rosado claro","#f6b9d3"],["verde-jade","Verde jade","#0b7f7a"],["verde-salvia","Verde salvia","#8fa684"],["grafito","Grafito","#3a3b40"]]) },
    { id: "ionik", linea: "IONIK", nombre: "Uniforme IONIK", precio: 20800, promo: false, tallas: T_MUJER, largo: true, visible: true, modelo: false,
      desc: "Blusa cuello V y pantalón jogger con puño. La opción más económica, de la línea Doctor Outlet.",
      colores: serie("ionik", [["lila","Lila","#9b7be0"],["beige","Beige","#c9a882"],["vino","Vino","#6e1428"],["gris-oxford","Gris oxford","#55575c"],["rojo","Rojo","#cf1f35"],["gris-claro","Gris claro","#a5a8ae"],["verde-olivo","Verde olivo","#3d4a2c"],["fucsia","Fucsia","#e0218a"],["rosado","Rosado","#e98fb0"],["azul-marino","Azul marino","#1b2440"]]) },
    { id: "gabacha", linea: "Gabachas", nombre: "Gabacha de laboratorio Cosmo", precio: 22000, promo: false, tallas: T_GAB, largo: false, visible: true, modelo: true,
      desc: "Gabacha blanca de manga larga, con bolsas al frente. Escoja el modelo con botones o con cierre.",
      colores: [c("con-botones", "Con botones", "#f6f6f4", "fotos/gabacha-botones.jpg"), c("con-cierre", "Con cierre", "#f6f6f4", "fotos/gabacha-cierre.jpg")] },
    { id: "gorro", linea: "Gorros", nombre: "Gorro quirúrgico", precio: 5000, promo: false, tallas: ["Única"], largo: false, visible: true, modelo: false,
      desc: "Gorro quirúrgico con amarre atrás, en la misma tela de los uniformes. Combínelo con su scrub.",
      colores: [c("vino", "Vino", "#6e1428", "fotos/gorro-modelo.jpg"), ...serie("gorro", [["blanco","Blanco","#f6f6f4"],["rojo","Rojo","#cf1f35"],["fucsia","Fucsia","#e0218a"],["cafe","Café","#5a3a28"],["negro","Negro","#1b1c1f"],["azul-rey","Azul rey","#1f45c9"],["rosado","Rosado","#e98fb0"]])] }
  ] };
  const copia = o => JSON.parse(JSON.stringify(o));
  async function catalogo() {
    await iniciar();
    if (LOCAL) return copia(lLeer().catalogo || CAT_BASE);
    const s = await F.getDoc(F.doc(db, META, "catalogo")); return s.exists() ? s.data() : copia(CAT_BASE);
  }
  async function escucharCatalogo(alCambiar) {
    await iniciar();
    if (LOCAL) { const f = () => alCambiar(copia(lLeer().catalogo || CAT_BASE)); subs.push(f); setTimeout(f, 0); return; }
    F.onSnapshot(F.doc(db, META, "catalogo"), s => alCambiar(s.exists() ? s.data() : copia(CAT_BASE)), () => alCambiar(copia(CAT_BASE)));
  }
  async function guardarCatalogo(cat) {
    await iniciar();
    const limpio = { promo: cat.promo, productos: cat.productos, actualizado: Date.now() };
    if (LOCAL) { const d = lLeer(); d.catalogo = limpio; lGuardar(d); return; }
    await F.setDoc(F.doc(db, META, "catalogo"), limpio);
  }
  // Achica la foto en el navegador (máx. 1000 px, JPG) antes de guardarla.
  function achicar(file, max = 1000) {
    return new Promise((ok, mal) => {
      const img = new Image(), url = URL.createObjectURL(file);
      img.onload = () => { const k = Math.min(1, max / Math.max(img.width, img.height)), cv = document.createElement("canvas");
        cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k); cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
        URL.revokeObjectURL(url); let q = .85, d = cv.toDataURL("image/jpeg", q); while (d.length > 600000 && q > .4) { q -= .1; d = cv.toDataURL("image/jpeg", q); } ok(d); };
      img.onerror = () => { URL.revokeObjectURL(url); mal(new Error("imagen")); }; img.src = url;
    });
  }
  async function subirFoto(file) {
    const data = await achicar(file); await iniciar(); const id = token();
    if (LOCAL) { const k = "cosmo-foto-" + id; try { localStorage.setItem(k, data); } catch { throw new Error("espacio"); } }
    else await F.setDoc(F.doc(db, "cosmo_fotos", id), { data, creado: Date.now() });
    cacheF[id] = data; return "f:" + id;
  }
  const cacheF = {}, pend = {};
  async function fotoData(id) {
    if (cacheF[id]) return cacheF[id];
    if (!pend[id]) pend[id] = (async () => { await iniciar();
      if (LOCAL) return cacheF[id] = localStorage.getItem("cosmo-foto-" + id) || "";
      const s = await F.getDoc(F.doc(db, "cosmo_fotos", id)); return cacheF[id] = s.exists() ? s.data().data : ""; })();
    return pend[id];
  }
  // Para usar en <img ${Pedidos.src(foto)}>: las fotos subidas se llenan solas cuando cargan.
  const VACIA = "data:image/gif;base64,R0lGODlhAQABAAAAACw=";
  const src = f => { f = String(f || ""); if (!f.startsWith("f:")) return `src="${f.replace(/"/g, "")}"`; const id = f.slice(2).replace(/[^a-z0-9]/gi, "");
    return cacheF[id] ? `src="${cacheF[id]}"` : `src="${VACIA}" data-fid="${id}"`; };
  function llenar(root) { root.querySelectorAll?.("img[data-fid]").forEach(img => { const id = img.dataset.fid; img.removeAttribute("data-fid"); fotoData(id).then(d => { if (d) img.src = d; }); }); }
  if (typeof MutationObserver !== "undefined") new MutationObserver(m => m.forEach(r => r.addedNodes.forEach(n => n.nodeType === 1 && (n.matches?.("img[data-fid]") ? llenar(n.parentNode || n) : llenar(n))))).observe(document.documentElement, { childList: true, subtree: true });

  return { LOCAL, PK_BASE, TALLAS, CAT_BASE, catalogo, escucharCatalogo, guardarCatalogo, subirFoto, src, precioPaquetes, crear, escucharUno, escucharTodos, cambiar, ajustes, guardarAjustes, sembrar, totales, codigo };
})();
