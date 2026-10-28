// Tarjetas de sellos de la demo de Matcha Mía, guardadas en Firebase (Firestore).
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
  const PRE = PRUEBA ? "prueba_matcha_" : "demo_matcha_";
  const COL = PRE + "clientes", IDX = PRE + "ced", ACC = PRE + "acceso", RCL = PRE + "reclamos", PEN = PRE + "pendientes";
  const KEY = PRUEBA ? "mm-token-prueba" : "mm-token";
  const url = ruta => { const u = new URL(ruta, location.href); if (PRUEBA) u.search = "?prueba"; return u.href; };
  const BASE = "https://www.gstatic.com/firebasejs/10.12.2/";
  let listo = null, F = null, db = null;

  function iniciar() {
    if (!listo) listo = (async () => {
      const [A, Fs] = await Promise.all([import(BASE + "firebase-app.js"), import(BASE + "firebase-firestore.js")]);
      F = Fs;
      const app = A.getApps().find(a => a.name === "matcha") || A.initializeApp(CONFIG, "matcha");
      db = F.getFirestore(app);
    })();
    return listo;
  }
  const soloDigitos = s => String(s || "").replace(/\D/g, "");
  async function huella(cedula) {
    const datos = new TextEncoder().encode("matcha-mia:" + soloDigitos(cedula));
    const h = await crypto.subtle.digest("SHA-256", datos);
    return [...new Uint8Array(h)].map(b => b.toString(16).padStart(2, "0")).join("");
  }
  // Usuario del cliente: cédula + clave de 4 dígitos. Se guarda solo una huella de las dos juntas, nunca la clave.
  async function huellaAcceso(cedula, clave) {
    const datos = new TextEncoder().encode("matcha-acceso:" + soloDigitos(cedula) + ":" + soloDigitos(clave));
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
  async function crear({ nombre, cedula }) {
    await iniciar();
    const ced = soloDigitos(cedula), h = await huella(ced);
    const ya = await F.getDoc(F.doc(db, IDX, h));
    if (ya.exists()) return { token: ya.data().t, existia: true };
    const token = nuevoToken(), w = F.writeBatch(db);
    w.set(F.doc(db, COL, token), { nombre: String(nombre).trim().slice(0, 60), ced4: ced.slice(-4), sellos: 0, gratis: 0, canjes: 0, total: 0,
      creado: F.serverTimestamp(), actualizado: F.serverTimestamp() });
    w.set(F.doc(db, IDX, h), { t: token });
    await w.commit();
    return { token, existia: false };
  }
  // Crea el usuario del cliente (cédula + clave). Solo funciona si esa cédula es la de esta tarjeta.
  async function crearAcceso(token, cedula, clave) {
    await iniciar();
    if (soloDigitos(clave).length !== 4) throw new Error("clave");
    const t = await buscarPorCedula(cedula);
    if (t !== token) throw new Error("cedula");
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
  async function cargarEjemplos() {
    if (!PRUEBA) throw new Error("solo-prueba");
    await iniciar();
    for (const e of EJEMPLOS) {
      const h = await huella(e.ced), ya = await F.getDoc(F.doc(db, IDX, h));
      const token = ya.exists() ? ya.data().t : nuevoToken(), w = F.writeBatch(db);
      w.set(F.doc(db, COL, token), { nombre: e.nombre, ced4: e.ced.slice(-4), sellos: e.sellos, gratis: e.gratis, canjes: e.canjes, total: e.total, creado: F.serverTimestamp(), actualizado: F.serverTimestamp() });
      w.set(F.doc(db, IDX, h), { t: token });
      w.set(F.doc(db, ACC, await huellaAcceso(e.ced, e.pin)), { t: token });
      const rp = RECLAMOS_PRUEBA.find(r => r[2] === EJEMPLOS.indexOf(e));
      if (rp) {
        w.set(F.doc(db, RCL, idReclamo(rp[0], rp[1])), { t: token, nombre: e.nombre, app: rp[0], orden: rp[1], estado: "pendiente", creado: F.serverTimestamp() });
        w.set(F.doc(db, PEN, idReclamo(rp[0], rp[1])), { nombre: nombreCorto(e.nombre), app: rp[0], orden: rp[1], creado: F.serverTimestamp() });
      }
      await w.commit();
    }
  }
  // Si faltan los clientes de ejemplo (o son de una versión vieja), se vuelven a cargar.
  async function asegurarEjemplos() {
    if (!PRUEBA) return;
    await iniciar();
    const ult = EJEMPLOS[EJEMPLOS.length - 1], s = await F.getDoc(F.doc(db, IDX, await huella(ult.ced)));
    const id0 = idReclamo(RECLAMOS_PRUEBA[0][0], RECLAMOS_PRUEBA[0][1]);
    const r = await F.getDoc(F.doc(db, RCL, id0)), p = await F.getDoc(F.doc(db, PEN, id0));
    // Se recarga si falta algo (o si quedó de una versión vieja sin la lista de pendientes).
    if (!s.exists() || !r.exists() || (r.data().estado === "pendiente" && !p.exists())) await cargarEjemplos();
  }
  // Top 10 de clientes por sellos acumulados (en la versión real, solo la dueña con su acceso seguro).
  async function top10() {
    await iniciar();
    const s = await F.getDocs(F.query(F.collection(db, COL), F.orderBy("total", "desc"), F.limit(10)));
    return s.docs.map(d => normal({ token: d.id, ...d.data() }));
  }
  // ----- Pedidos a domicilio (Uber Eats, DiDi, Rappi) -----
  // El cliente reclama su sello con el número de orden; la dueña busca ese número en su panel y lo confirma.
  const APPS = [["UBER", "Uber Eats"], ["DIDI", "DiDi Food"], ["RAPPI", "Rappi"]];
  const ordenLimpia = o => String(o || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 30);
  const idReclamo = (app, orden) => app + "-" + ordenLimpia(orden);
  // En la lista de pendientes solo va el primer nombre y la inicial del apellido (nada más del cliente).
  const nombreCorto = n => { const p = String(n || "").trim().split(/\s+/); return (p[0] || "Cliente").slice(0, 30) + (p[1] ? " " + p[1][0].toUpperCase() + "." : ""); };
  async function reclamar(token, nombre, app, orden) {
    await iniciar();
    const o = ordenLimpia(orden); if (o.length < 3) throw new Error("orden");
    const ref = F.doc(db, RCL, idReclamo(app, o));
    await F.runTransaction(db, async tx => {
      const s = await tx.get(ref); if (s.exists()) throw new Error("ya-reclamada");
      tx.set(ref, { t: token, nombre: String(nombre).slice(0, 60), app, orden: o, estado: "pendiente", creado: F.serverTimestamp() });
      tx.set(F.doc(db, PEN, idReclamo(app, o)), { nombre: nombreCorto(nombre), app, orden: o, creado: F.serverTimestamp() });
    });
    return idReclamo(app, o);
  }
  async function verReclamo(id) {
    await iniciar();
    const s = await F.getDoc(F.doc(db, RCL, id));
    return s.exists() ? { id, ...s.data() } : null;
  }
  // La dueña confirma la orden: se suman los sellos y el reclamo queda aprobado (todo junto).
  async function aprobarReclamo(id, n) {
    await iniciar();
    const k = Math.max(1, Math.min(20, Math.floor(n))), rRef = F.doc(db, RCL, id);
    return F.runTransaction(db, async tx => {
      const r = await tx.get(rRef); if (!r.exists()) throw new Error("no-existe");
      const rd = r.data(); if (rd.estado !== "pendiente") throw new Error("ya-revisada");
      const cRef = F.doc(db, COL, rd.t), c = await tx.get(cRef); if (!c.exists()) throw new Error("sin-tarjeta");
      const d = normal(c.data()), suma = d.sellos + k, ganados = Math.floor(suma / 10);
      const nuevo = { sellos: suma % 10, gratis: d.gratis + ganados, canjes: d.canjes, total: d.total + k };
      tx.update(cRef, { ...nuevo, actualizado: F.serverTimestamp() });
      tx.update(rRef, { estado: "aprobado", sellos: k, revisado: F.serverTimestamp() });
      tx.delete(F.doc(db, PEN, id));
      return { ...nuevo, ganados, nombre: c.data().nombre };
    });
  }
  async function rechazarReclamo(id) {
    await iniciar();
    const w = F.writeBatch(db);
    w.update(F.doc(db, RCL, id), { estado: "rechazado", sellos: 0, revisado: F.serverTimestamp() });
    w.delete(F.doc(db, PEN, id));
    await w.commit();
  }
  // Lista en vivo de pedidos esperando sello (la más vieja primero).
  async function escucharPendientes(alCambiar, alFallar) {
    await iniciar();
    return F.onSnapshot(F.query(F.collection(db, PEN), F.orderBy("creado", "asc"), F.limit(100)),
      s => alCambiar(s.docs.map(d => ({ id: d.id, ...d.data({ serverTimestamps: "estimate" }) }))), e => alFallar && alFallar(e));
  }
  const RECLAMOS_PRUEBA = [["UBER", "UE1001", 0], ["DIDI", "DD2002", 2], ["RAPPI", "RP3003", 3]];
  async function borrarPrueba() {
    if (!PRUEBA) throw new Error("solo-prueba");
    await iniciar();
    for (const c of [PEN, RCL, ACC, IDX, COL]) {
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
  return { APPS, idReclamo, ordenLimpia, escucharPendientes, reclamar, verReclamo, aprobarReclamo, rechazarReclamo, RECLAMOS_PRUEBA, prueba: PRUEBA, KEY, url, EJEMPLOS, cargarEjemplos, asegurarEjemplos, borrarPrueba, top10, normal, iniciar, buscarPorCedula, obtener, crear, crearAcceso, ingresar, sumar, canjear, escuchar, link, tokenDeTexto, soloDigitos };
})();
