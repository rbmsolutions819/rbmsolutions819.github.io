// Tarjeta de sellos de The Blessing Barbershop (demo de RBM Solutions), guardada en Firebase (Firestore).
// - Cada corte cuesta ₡5.000 y suma un sello. El 5.º corte sale en ₡2.000 y la tarjeta vuelve a empezar.
// - El barbero que registra a un cliente nuevo queda anotado en la tarjeta, y cada corte guarda quién lo hizo.
// - El cliente entra con su celular (o cédula) y un PIN de 4 dígitos. Nunca se guarda el número completo ni el PIN:
//   solo los últimos 4 dígitos del celular y huellas (hash) para poder buscarlo.
window.Blessing = (() => {
  const CONFIG = {
    apiKey: "AIzaSyCdNwaEKRzhLAXf-vG5WJkf7qbrQJ4lkWg",
    authDomain: "rbm-solutions-2a4ce.firebaseapp.com",
    projectId: "rbm-solutions-2a4ce",
    storageBucket: "rbm-solutions-2a4ce.firebasestorage.app",
    messagingSenderId: "602522235911",
    appId: "1:602522235911:web:bd4fe58dcecb79edefe6a2"
  };
  const PRE = "demo_blessing_";
  const COL = PRE + "clientes", IDS = PRE + "ids", ACC = PRE + "acceso", CORTES = PRE + "cortes", CFG = PRE + "config";
  const META = 5, PRECIO = 5000, PRECIO_QUINTO = 2000;
  const BARBEROS_EJEMPLO = ["Josué", "Kevin", "Daniel"];
  const BASE = "https://www.gstatic.com/firebasejs/10.12.2/";
  let listo = null, F = null, db = null;

  function iniciar() {
    if (!listo) listo = (async () => {
      const [A, Fs] = await Promise.all([import(BASE + "firebase-app.js"), import(BASE + "firebase-firestore.js")]);
      F = Fs;
      const app = A.getApps().find(a => a.name === "blessing") || A.initializeApp(CONFIG, "blessing");
      db = F.getFirestore(app);
    })();
    return listo;
  }
  const digitos = s => String(s || "").replace(/\D/g, "");
  async function sha(txt) {
    const h = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(txt));
    return [...new Uint8Array(h)].map(b => b.toString(16).padStart(2, "0")).join("");
  }
  const huellaId = id => sha("blessing-id:" + digitos(id));
  const huellaAcceso = (id, pin) => sha("blessing-acceso:" + digitos(id) + ":" + digitos(pin));
  function nuevoToken() {
    const b = new Uint8Array(15); crypto.getRandomValues(b);
    return [...b].map(x => x.toString(36).padStart(2, "0")).join("").slice(0, 24);
  }
  // El QR lleva el link al panel de la barbería con el código de la tarjeta.
  const link = token => new URL("barberia.html#t=" + token, location.href).href;
  const tokenDeTexto = txt => {
    const m = String(txt || "").match(/[#&?]t=([a-z0-9]{16,40})/i) || String(txt || "").match(/^([a-z0-9]{16,40})$/i);
    return m ? m[1].toLowerCase() : null;
  };
  const precioSiguiente = sellos => (sellos >= META - 1 ? PRECIO_QUINTO : PRECIO);
  const colones = n => "₡" + String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  // Registra un cliente nuevo (lo hace el barbero). Celular obligatorio; cédula opcional.
  async function crear({ nombre, celular, cedula = "", pin, barbero }) {
    await iniciar();
    const cel = digitos(celular), ced = digitos(cedula), p = digitos(pin);
    if (cel.length !== 8) throw new Error("celular");
    if (ced && (ced.length < 9 || ced.length > 12)) throw new Error("cedula");
    if (p.length !== 4) throw new Error("pin");
    if (!String(barbero || "").trim()) throw new Error("barbero");
    const hCel = await huellaId(cel), hCed = ced ? await huellaId(ced) : null;
    const ya = await F.getDoc(F.doc(db, IDS, hCel));
    if (ya.exists()) throw new Error("ya-existe");
    if (hCed && (await F.getDoc(F.doc(db, IDS, hCed))).exists()) throw new Error("ya-existe-cedula");
    const token = nuevoToken(), w = F.writeBatch(db);
    w.set(F.doc(db, COL, token), {
      nombre: String(nombre).trim().slice(0, 60), cel4: cel.slice(-4), barbero: String(barbero).trim().slice(0, 40),
      sellos: 0, ciclos: 0, total: 0, creado: F.serverTimestamp(), actualizado: F.serverTimestamp()
    });
    w.set(F.doc(db, IDS, hCel), { t: token });
    w.set(F.doc(db, ACC, await huellaAcceso(cel, p)), { t: token });
    if (hCed) {
      w.set(F.doc(db, IDS, hCed), { t: token });
      w.set(F.doc(db, ACC, await huellaAcceso(ced, p)), { t: token });
    }
    await w.commit();
    return token;
  }
  // Ingreso del cliente: celular (o cédula) + PIN. Devuelve el código de su tarjeta o null.
  async function ingresar(id, pin) {
    await iniciar();
    const s = await F.getDoc(F.doc(db, ACC, await huellaAcceso(id, pin)));
    return s.exists() ? s.data().t : null;
  }
  // El barbero busca a un cliente por celular o cédula.
  async function buscar(id) {
    await iniciar();
    const s = await F.getDoc(F.doc(db, IDS, await huellaId(id)));
    return s.exists() ? s.data().t : null;
  }
  async function obtener(token) {
    await iniciar();
    const s = await F.getDoc(F.doc(db, COL, token));
    return s.exists() ? { token, ...s.data() } : null;
  }
  // Registra un corte: suma un sello. Si era el 5.º (₡2.000), la tarjeta vuelve a 0.
  async function registrarCorte(token, barbero, pago = "efectivo") {
    pago = pago === "sinpe" ? "sinpe" : "efectivo";
    await iniciar();
    const ref = F.doc(db, COL, token), corte = F.doc(F.collection(db, CORTES));
    return F.runTransaction(db, async tx => {
      const s = await tx.get(ref); if (!s.exists()) throw new Error("no-existe");
      const d = s.data(), n = d.sellos + 1, quinto = n >= META, precio = quinto ? PRECIO_QUINTO : PRECIO;
      const nuevo = { sellos: quinto ? 0 : n, ciclos: d.ciclos + (quinto ? 1 : 0), total: d.total + 1, ultimo: String(barbero).slice(0, 40) };
      tx.update(ref, { ...nuevo, actualizado: F.serverTimestamp() });
      tx.set(corte, { t: token, nombre: d.nombre, barbero: String(barbero).slice(0, 40), precio, n, pago, fecha: F.serverTimestamp() });
      return { ...nuevo, precio, n, quinto, pago, nombre: d.nombre };
    });
  }
  async function escuchar(token, alCambiar, alFallar) {
    await iniciar();
    return F.onSnapshot(F.doc(db, COL, token), s => alCambiar(s.exists() ? { token, ...s.data({ serverTimestamps: "estimate" }) } : null), e => alFallar && alFallar(e));
  }
  async function cortesDe(token, max = 20) {
    await iniciar();
    const s = await F.getDocs(F.query(F.collection(db, CORTES), F.where("t", "==", token), F.limit(60)));
    return s.docs.map(d => ({ id: d.id, ...d.data({ serverTimestamps: "estimate" }) }))
      .sort((a, b) => (b.fecha?.toMillis?.() || 0) - (a.fecha?.toMillis?.() || 0)).slice(0, max);
  }
  // Para el panel: clientes y cortes en vivo.
  async function escucharClientes(alCambiar, alFallar) {
    await iniciar();
    return F.onSnapshot(F.query(F.collection(db, COL), F.orderBy("creado", "desc"), F.limit(300)),
      s => alCambiar(s.docs.map(d => ({ token: d.id, ...d.data({ serverTimestamps: "estimate" }) }))), e => alFallar && alFallar(e));
  }
  async function escucharCortes(alCambiar, alFallar) {
    await iniciar();
    // Solo el último mes (y un poco más), que es lo que se puede consultar en los reportes.
    const desde = F.Timestamp.fromMillis(Date.now() - 33 * 864e5);
    return F.onSnapshot(F.query(F.collection(db, CORTES), F.where("fecha", ">=", desde), F.orderBy("fecha", "desc"), F.limit(5000)),
      s => alCambiar(s.docs.map(d => ({ id: d.id, ...d.data({ serverTimestamps: "estimate" }) }))), e => alFallar && alFallar(e));
  }
  // ----- Equipo: cada barbero entra con su propio PIN. El administrador (César) ve los reportes de todos. -----
  const DUENO = "César";
  const PINES_DEMO = { "César": "1234", Miguel: "4444", "Josué": "1111", Kevin: "2222", Daniel: "3333" };
  const huellaPin = (nombre, pin) => sha("blessing-barbero:" + String(nombre).trim().toLowerCase() + ":" + digitos(pin));
  async function equipo() {
    await iniciar();
    const s = await F.getDoc(F.doc(db, CFG, "barberos")), d = s.exists() ? s.data() : {};
    let lista = Array.isArray(d.lista) && d.lista.length ? d.lista.slice() : ["Josué", "Kevin", "Daniel"];
    const dueno = DUENO; // el administrador siempre es César; Miguel y los demás son barberos
    lista = [dueno, ...lista.filter(n => n !== dueno)];
    return { lista, pines: d.pines || {}, dueno };
  }
  // Revisa el PIN de un barbero. Si todavía no tiene uno guardado, vale el PIN de la demo (o 0000).
  async function revisarPin(eq, nombre, pin) {
    const h = eq.pines[nombre];
    if (h) return h === await huellaPin(nombre, pin);
    return digitos(pin) === (PINES_DEMO[nombre] || "0000");
  }
  async function guardarEquipo({ lista, pines, dueno }) {
    await iniciar();
    const limpia = [...new Set(lista.map(x => String(x).trim().slice(0, 40)).filter(Boolean))].slice(0, 20);
    if (!limpia.length) throw new Error("vacia");
    const p = {}; limpia.forEach(n => { if (pines[n]) p[n] = pines[n]; });
    await F.setDoc(F.doc(db, CFG, "barberos"), { lista: limpia, pines: p, dueno: DUENO });
    return { lista: limpia, pines: p, dueno: DUENO };
  }

  // ----- Clientes de ejemplo para enseñar la demo -----
  // Se crean solos la primera vez (con sus cortes) si todavía no existen.
  const EJEMPLOS = [
    { nombre: "Andrés Mora",    cel: "80000001", ced: "101110111", pin: "1111", barbero: "Josué",  cortes: 2,  atendio: ["Josué"] },
    { nombre: "Carlos Vargas",  cel: "80000002", ced: "",          pin: "2222", barbero: "Kevin",  cortes: 4,  atendio: ["Kevin", "Josué"] },
    { nombre: "María Solís",    cel: "80000003", ced: "",          pin: "3333", barbero: "Daniel", cortes: 0,  atendio: ["Daniel"] },
    { nombre: "Diego Rojas",    cel: "80000004", ced: "",          pin: "4444", barbero: "Josué",  cortes: 6,  atendio: ["Josué", "Daniel"] },
    { nombre: "Sofía Chaves",   cel: "80000005", ced: "",          pin: "5555", barbero: "Kevin",  cortes: 3,  atendio: ["Kevin"] },
    { nombre: "José Quesada",   cel: "80000006", ced: "",          pin: "6666", barbero: "Daniel", cortes: 12, atendio: ["Daniel", "Kevin", "Josué"] },
    { nombre: "Ricardo Brenes", cel: "61572339", ced: "", pin: "7777", barbero: "Josué", cortes: 0, atendio: ["Josué"], oculto: true }
  ];
  let sembrando = null;
  function asegurarEjemplos() {
    if (!sembrando) sembrando = (async () => {
      await iniciar();
      for (const e of EJEMPLOS) {
        try {
          if ((await F.getDoc(F.doc(db, IDS, await huellaId(e.cel)))).exists()) continue;
          const t = await crear({ nombre: e.nombre, celular: e.cel, cedula: e.ced, pin: e.pin, barbero: e.barbero });
          for (let i = 0; i < e.cortes; i++) await registrarCorte(t, e.atendio[i % e.atendio.length], i % 3 === 1 ? "sinpe" : "efectivo");
        } catch (x) { console.warn("Ejemplo no cargado:", e.nombre, x && x.message); }
      }
    })();
    return sembrando;
  }
  return { META, PRECIO, PRECIO_QUINTO, precioSiguiente, colones, digitos, link, tokenDeTexto, iniciar, crear, ingresar, buscar, obtener,
    registrarCorte, escuchar, cortesDe, escucharClientes, escucharCortes, equipo, revisarPin, guardarEquipo, huellaPin, PINES_DEMO, EJEMPLOS, asegurarEjemplos };
})();
