// Tarjetas de sellos de la demo de Koktela, guardadas en Firebase (Firestore).
// Cada cliente tiene un código secreto (token) que va dentro de su QR y de su link.
// La cédula no se guarda completa: solo los últimos 4 dígitos y una huella (hash) para poder buscarla.
// Las reglas de la base de datos solo permiten SUMAR sellos o canjear una tarjeta llena; nunca restar.
window.Tarjetas = (() => {
  const CONFIG = {
    apiKey: "AIzaSyCdNwaEKRzhLAXf-vG5WJkf7qbrQJ4lkWg",
    authDomain: "rbm-solutions-2a4ce.firebaseapp.com",
    projectId: "rbm-solutions-2a4ce",
    storageBucket: "rbm-solutions-2a4ce.firebasestorage.app",
    messagingSenderId: "602522235911",
    appId: "1:602522235911:web:bd4fe58dcecb79edefe6a2"
  };
  // Modo prueba: con ?prueba en la dirección todo va a una base de datos aparte, con clientes de ejemplo.
  const PRUEBA = /[?&]prueba\b/.test(location.search);
  const PRE = PRUEBA ? "prueba_koktela_" : "demo_koktela_";
  const COL = PRE + "clientes", IDX = PRE + "ced", ACC = PRE + "acceso", PRO = PRE + "promos";
  const KEY = PRUEBA ? "kk-token-prueba" : "kk-token";
  const url = ruta => { const u = new URL(ruta, location.href); if (PRUEBA) u.search = "?prueba"; return u.href; };
  const BASE = "https://www.gstatic.com/firebasejs/10.12.2/";
  let listo = null, F = null, db = null;

  function iniciar() {
    if (!listo) listo = (async () => {
      const [A, Fs] = await Promise.all([import(BASE + "firebase-app.js"), import(BASE + "firebase-firestore.js")]);
      F = Fs;
      const app = A.getApps().find(a => a.name === "koktela") || A.initializeApp(CONFIG, "koktela");
      db = F.getFirestore(app);
    })();
    return listo;
  }
  const soloDigitos = s => String(s || "").replace(/\D/g, "");
  async function huella(cedula) {
    const datos = new TextEncoder().encode("koktela:" + soloDigitos(cedula));
    const h = await crypto.subtle.digest("SHA-256", datos);
    return [...new Uint8Array(h)].map(b => b.toString(16).padStart(2, "0")).join("");
  }
  // Usuario del cliente: cédula + clave de 4 dígitos. Se guarda solo una huella de las dos juntas, nunca la clave.
  async function huellaAcceso(cedula, clave) {
    const datos = new TextEncoder().encode("koktela-acceso:" + soloDigitos(cedula) + ":" + soloDigitos(clave));
    const h = await crypto.subtle.digest("SHA-256", datos);
    return [...new Uint8Array(h)].map(b => b.toString(16).padStart(2, "0")).join("");
  }
  function nuevoToken() {
    const b = new Uint8Array(15); crypto.getRandomValues(b);
    return [...b].map(x => x.toString(36).padStart(2, "0")).join("").slice(0, 24);
  }
  const link = token => url("tarjeta.html#t=" + token);
  const tokenDeTexto = txt => { const m = String(txt || "").match(/[#&?]t=([a-z0-9]{16,40})/i) || String(txt || "").match(/^([a-z0-9]{16,40})$/i); return m ? m[1].toLowerCase() : null; };

  async function buscarPorCedula(cedula) {
    await iniciar();
    const s = await F.getDoc(F.doc(db, IDX, await huella(cedula)));
    return s.exists() ? s.data().t : null;
  }
  async function obtener(token) {
    await iniciar();
    const s = await F.getDoc(F.doc(db, COL, token));
    return s.exists() ? normal({ token, ...s.data() }) : null;
  }
  // Registra un cliente nuevo. Si la cédula ya existe, devuelve la tarjeta que ya tenía.
  // previos = sellos que el cliente ya traía de su tarjeta anterior (cada 10 se vuelven un gratis).
  async function crear({ nombre, cedula, correo = "", tel = "", previos = 0 }) {
    await iniciar();
    const ced = soloDigitos(cedula), h = await huella(ced);
    const ya = await F.getDoc(F.doc(db, IDX, h));
    if (ya.exists()) return { token: ya.data().t, existia: true };
    const token = nuevoToken(), w = F.writeBatch(db);
    w.set(F.doc(db, COL, token), tarjetaNueva({ nombre, ced4: ced.slice(-4), correo, tel, previos }));
    w.set(F.doc(db, IDX, h), { t: token });
    await w.commit();
    return { token, existia: false };
  }
  const limpiarTel = t => { let d = soloDigitos(t); if (d.length === 11 && d.startsWith("506")) d = d.slice(3); return d.length === 8 ? d : ""; };
  function tarjetaNueva({ nombre, ced4 = "", correo = "", tel = "", previos = 0, gratisPrevios = 0 }) {
    const n = Math.max(0, Math.min(209, Math.floor(+previos || 0) + 10 * Math.floor(+gratisPrevios || 0)));
    const sellos = n % 10, gratis = Math.floor(n / 10);
    return { nombre: String(nombre).trim().slice(0, 60), ced4, correo: limpiarCorreo(correo), tel: limpiarTel(tel), sellos, gratis, canjes: 0, total: n,
      creado: F.serverTimestamp(), actualizado: F.serverTimestamp() };
  }
  // ----- Traer clientes de otra tarjeta (Loopy, Devotio, Excel o tarjetas de papel) -----
  // filas: [{nombre, tel, correo, cedula, sellos, gratis}]. Si trae cédula y ya existe, no se duplica.
  async function importar(filas) {
    await iniciar();
    const hechos = [], repetidos = [];
    for (let i = 0; i < filas.length; i += 150) {
      const w = F.writeBatch(db), lote = [];
      for (const f of filas.slice(i, i + 150)) {
        const ced = soloDigitos(f.cedula);
        let h = null;
        if (ced.length >= 9) { h = await huella(ced); if ((await F.getDoc(F.doc(db, IDX, h))).exists()) { repetidos.push(f.nombre); continue; } }
        const token = nuevoToken(), d = tarjetaNueva({ nombre: f.nombre, ced4: h ? ced.slice(-4) : "", correo: f.correo, tel: f.tel, previos: f.sellos, gratisPrevios: f.gratis });
        w.set(F.doc(db, COL, token), d);
        if (h) w.set(F.doc(db, IDX, h), { t: token });
        lote.push({ token, nombre: d.nombre, tel: d.tel, sellos: d.sellos, gratis: d.gratis, conCedula: !!h });
      }
      if (lote.length) { await w.commit(); hechos.push(...lote); }
    }
    return { hechos, repetidos };
  }
  // Crea el usuario del cliente (cédula + clave). Solo funciona si esa cédula es la de esta tarjeta.
  async function crearAcceso(token, cedula, clave) {
    await iniciar();
    if (soloDigitos(clave).length !== 4) throw new Error("clave");
    const ced = soloDigitos(cedula); if (ced.length < 9) throw new Error("cedula");
    const t = await buscarPorCedula(ced);
    if (!t) {
      // Tarjeta traída de otra plataforma, todavía sin cédula: se le pone la cédula y se crea el usuario en un solo paso.
      const c = await obtener(token);
      if (!c || c.ced4) throw new Error("cedula");
      const w = F.writeBatch(db);
      w.update(F.doc(db, COL, token), { ced4: ced.slice(-4) });
      w.set(F.doc(db, IDX, await huella(ced)), { t: token });
      w.set(F.doc(db, ACC, await huellaAcceso(ced, clave)), { t: token });
      await w.commit();
      return true;
    }
    if (t !== token) throw new Error(t ? "otra" : "cedula");
    const ref = F.doc(db, ACC, await huellaAcceso(cedula, clave));
    const ya = await F.getDoc(ref);
    if (!ya.exists()) await F.setDoc(ref, { t: token });
    return true;
  }
  // Ingreso del cliente: con cédula y clave devuelve el código de su tarjeta (o null si no coincide).
  async function ingresar(cedula, clave) {
    await iniciar();
    const s = await F.getDoc(F.doc(db, ACC, await huellaAcceso(cedula, clave)));
    return s.exists() ? s.data().t : null;
  }
  // ----- Solo en modo prueba -----
  // total = sellos de toda la vida = sellos + 10 × (gratis + canjeados)
  const EJEMPLOS = [
    {nombre: "Ana Solís", ced: "101110111", pin: "1111", sellos: 3, gratis: 0, canjes: 0},
    {nombre: "Carlos Mora", ced: "202220222", pin: "2222", sellos: 6, gratis: 1, canjes: 1},
    {nombre: "María Vargas", ced: "303330333", pin: "3333", sellos: 9, gratis: 0, canjes: 0},
    {nombre: "José Rojas", ced: "404440444", pin: "4444", sellos: 2, gratis: 5, canjes: 2},
    {nombre: "Laura Jiménez", ced: "505550555", pin: "5555", sellos: 0, gratis: 0, canjes: 0},
    {nombre: "Diego Castro", ced: "606660666", pin: "6666", sellos: 5, gratis: 2, canjes: 3},
    {nombre: "Sofía Chaves", ced: "707770777", pin: "7777", sellos: 8, gratis: 1, canjes: 0},
    {nombre: "Andrés Quesada", ced: "808880888", pin: "8888", sellos: 1, gratis: 0, canjes: 4},
    {nombre: "Valeria Núñez", ced: "909990999", pin: "9999", sellos: 4, gratis: 3, canjes: 1},
    {nombre: "Pablo Arias", ced: "112223334", pin: "1212", sellos: 7, gratis: 0, canjes: 1}
  ].map(e => ({...e, total: e.sellos + 10 * (e.gratis + e.canjes)}));
  // Simula la lista que el negocio exporta de su plataforma vieja (sin cédula: la pone el cliente al reclamar).
  const LISTA_EJEMPLO = [
    {nombre: "Ricardo Brenes", tel: "8888 1111", correo: "ricardo@correo.com", cedula: "", sellos: 7, gratis: 0},
    {nombre: "Mariana Soto", tel: "8888 2222", correo: "", cedula: "", sellos: 3, gratis: 1},
    {nombre: "Esteban Ulate", tel: "8888 3333", correo: "esteban@correo.com", cedula: "", sellos: 9, gratis: 0},
    {nombre: "Natalia Fallas", tel: "8888 4444", correo: "", cedula: "", sellos: 1, gratis: 0},
    {nombre: "Kevin Araya", tel: "8888 5555", correo: "", cedula: "", sellos: 5, gratis: 2}
  ];
  async function cargarEjemplos() {
    if (!PRUEBA) throw new Error("solo-prueba");
    await iniciar();
    await cargarPromosEjemplo();
    for (const e of EJEMPLOS) {
      const h = await huella(e.ced), ya = await F.getDoc(F.doc(db, IDX, h));
      const token = ya.exists() ? ya.data().t : nuevoToken(), w = F.writeBatch(db);
      w.set(F.doc(db, COL, token), { nombre: e.nombre, ced4: e.ced.slice(-4), sellos: e.sellos, gratis: e.gratis, canjes: e.canjes, total: e.total, creado: F.serverTimestamp(), actualizado: F.serverTimestamp() });
      w.set(F.doc(db, IDX, h), { t: token });
      w.set(F.doc(db, ACC, await huellaAcceso(e.ced, e.pin)), { t: token });
      await w.commit();
    }
  }
  // Si faltan los clientes de ejemplo (o son de una versión vieja), se vuelven a cargar.
  async function asegurarEjemplos() {
    if (!PRUEBA) return;
    await iniciar();
    const ult = EJEMPLOS[EJEMPLOS.length - 1], s = await F.getDoc(F.doc(db, IDX, await huella(ult.ced)));
    if (!s.exists()) await cargarEjemplos();
    else { const e = await F.getDoc(F.doc(db, PRO, PROMOS_EJEMPLO[0].id)); if (!e.exists() || e.data().producto !== PROMOS_EJEMPLO[0].producto) await cargarPromosEjemplo(); }
  }
  // Top 10 de clientes por sellos acumulados (en la versión real, solo la dueña con su acceso seguro).
  async function top10() {
    await iniciar();
    const s = await F.getDocs(F.query(F.collection(db, COL), F.orderBy("total", "desc"), F.limit(10)));
    return s.docs.map(d => normal({ token: d.id, ...d.data() }));
  }
  async function borrarPrueba() {
    if (!PRUEBA) throw new Error("solo-prueba");
    await iniciar();
    for (const c of [PRO, ACC, IDX, COL]) {
      const s = await F.getDocs(F.collection(db, c));
      for (let i = 0; i < s.docs.length; i += 400) { const w = F.writeBatch(db); s.docs.slice(i, i + 400).forEach(d => w.delete(d.ref)); await w.commit(); }
    }
  }
  // Deja la tarjeta en su forma normal: sellos de 0 a 9; cada 10 sellos es un cóctel gratis guardado.
  function normal(d) {
    let sellos = d.sellos || 0, gratis = d.gratis || 0; const canjes = d.canjes || 0;
    gratis += Math.floor(sellos / 10); sellos %= 10;
    const total = d.total ?? ((d.sellos || 0) + 10 * ((d.gratis || 0) + canjes));
    return { ...d, sellos, gratis, canjes, total };
  }
  // ----- Correo del cliente (opcional) -----
  const limpiarCorreo = c => { const v = String(c || "").trim().toLowerCase().slice(0, 100); return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v) ? v : ""; };
  async function guardarCorreo(token, correo) {
    await iniciar();
    const v = limpiarCorreo(correo); if (correo && !v) throw new Error("correo");
    await F.updateDoc(F.doc(db, COL, token), { correo: v });
    return v;
  }
  // ----- Promociones: la dueña las publica y les llegan a todos los clientes que tengan la página -----
  // dias: [] = una sola vez (se avisa al publicarla); [3] = se repite todos los miércoles (0 = domingo).
  const PROMOS_EJEMPLO = [
    {id: "ej-miercoles", titulo: "Miércoles de 2x1", texto: "Todos los miércoles, estos cócteles al 2x1. ¡Doble es mejor!", producto: "Cíclope, Artemisa, Afrodita, Zeus, Ninfa, Sirena", dias: [3]},
    {id: "ej-domingo", titulo: "Domingo: 3 por ₡10.000", texto: "De 2 a 8 p. m., armá tu combo de 3 cócteles.", producto: "", dias: [0]},
    {id: "ej-nuevo", titulo: "¡Nuevo! Ajax", texto: "Arándano, naranja, soda, Aperol y vodka. Probalo esta semana.", producto: "Ajax", dias: []}
  ];
  async function publicarPromo({ titulo, texto, producto = "", dias = [] }) {
    await iniciar();
    const r = await F.addDoc(F.collection(db, PRO), { titulo: String(titulo).trim().slice(0, 60), texto: String(texto).trim().slice(0, 200),
      producto: (Array.isArray(producto) ? producto.join(", ") : String(producto || "")).slice(0, 400), dias: [...new Set(dias.map(Number))].filter(n => n >= 0 && n <= 6).sort(), creado: F.serverTimestamp() });
    return r.id;
  }
  async function borrarPromo(id) { await iniciar(); await F.deleteDoc(F.doc(db, PRO, id)); }
  async function escucharPromos(alCambiar, alFallar) {
    await iniciar();
    return F.onSnapshot(F.query(F.collection(db, PRO), F.orderBy("creado", "desc"), F.limit(30)),
      s => alCambiar(s.docs.map(x => ({ id: x.id, ...x.data({ serverTimestamps: "estimate" }) }))), e => alFallar && alFallar(e));
  }
  async function cargarPromosEjemplo() {
    const w = F.writeBatch(db);
    PROMOS_EJEMPLO.forEach(({ id, ...p }) => w.set(F.doc(db, PRO, id), { ...p, creado: F.serverTimestamp() }));
    await w.commit();
  }
  // Suma sellos. Al llegar a 10 gana un cóctel gratis y la tarjeta vuelve a cero. No existe la opción de restar.
  async function sumar(token, n) {
    await iniciar();
    const ref = F.doc(db, COL, token), k = Math.max(1, Math.min(50, Math.floor(n)));
    return F.runTransaction(db, async tx => {
      const s = await tx.get(ref); if (!s.exists()) throw new Error("no-existe");
      const d = normal(s.data()), suma = d.sellos + k, ganados = Math.floor(suma / 10);
      const nuevo = { sellos: suma % 10, gratis: d.gratis + ganados, canjes: d.canjes, total: d.total + k };
      tx.update(ref, { ...nuevo, actualizado: F.serverTimestamp() });
      return { ...nuevo, ganados };
    });
  }
  // Entrega cócteles gratis: la dueña escoge cuántos (hasta los que tenga guardados).
  async function canjear(token, cuantos = 1) {
    await iniciar();
    const ref = F.doc(db, COL, token), k = Math.max(1, Math.floor(cuantos));
    return F.runTransaction(db, async tx => {
      const s = await tx.get(ref); if (!s.exists()) throw new Error("no-existe");
      const d = normal(s.data()); if (d.gratis < k) throw new Error("insuficientes");
      const nuevo = { sellos: d.sellos, gratis: d.gratis - k, canjes: d.canjes + k, total: d.total };
      tx.update(ref, { ...nuevo, actualizado: F.serverTimestamp() });
      return nuevo;
    });
  }
  // Escucha la tarjeta y avisa cada vez que cambia (así el cliente ve sus sellos al instante).
  async function escuchar(token, alCambiar, alFallar) {
    await iniciar();
    return F.onSnapshot(F.doc(db, COL, token), s => alCambiar(s.exists() ? normal({ token, ...s.data() }) : null), e => alFallar && alFallar(e));
  }
  return { importar, LISTA_EJEMPLO, limpiarTel, guardarCorreo, limpiarCorreo, publicarPromo, borrarPromo, escucharPromos, prueba: PRUEBA, KEY, url, EJEMPLOS, cargarEjemplos, asegurarEjemplos, borrarPrueba, top10, normal, iniciar, buscarPorCedula, obtener, crear, crearAcceso, ingresar, sumar, canjear, escuchar, link, tokenDeTexto, soloDigitos };
})();
