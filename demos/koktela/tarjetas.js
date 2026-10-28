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
  const COL = "demo_koktela_clientes", IDX = "demo_koktela_ced", ACC = "demo_koktela_acceso";
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
  const link = token => new URL("tarjeta.html#t=" + token, location.href).href;
  const tokenDeTexto = txt => { const m = String(txt || "").match(/[#&?]t=([a-z0-9]{16,40})/i) || String(txt || "").match(/^([a-z0-9]{16,40})$/i); return m ? m[1].toLowerCase() : null; };

  async function buscarPorCedula(cedula) {
    await iniciar();
    const s = await F.getDoc(F.doc(db, IDX, await huella(cedula)));
    return s.exists() ? s.data().t : null;
  }
  async function obtener(token) {
    await iniciar();
    const s = await F.getDoc(F.doc(db, COL, token));
    return s.exists() ? { token, ...s.data() } : null;
  }
  // Registra un cliente nuevo. Si la cédula ya existe, devuelve la tarjeta que ya tenía.
  async function crear({ nombre, cedula }) {
    await iniciar();
    const ced = soloDigitos(cedula), h = await huella(ced);
    const ya = await F.getDoc(F.doc(db, IDX, h));
    if (ya.exists()) return { token: ya.data().t, existia: true };
    const token = nuevoToken(), w = F.writeBatch(db);
    w.set(F.doc(db, COL, token), { nombre: String(nombre).trim().slice(0, 60), ced4: ced.slice(-4), sellos: 0, canjes: 0,
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
  // Suma sellos (máximo 10 en la tarjeta). No existe la opción de restar.
  async function sumar(token, n) {
    await iniciar();
    const ref = F.doc(db, COL, token);
    return F.runTransaction(db, async tx => {
      const s = await tx.get(ref); if (!s.exists()) throw new Error("no-existe");
      const actual = s.data().sellos || 0, nuevo = Math.min(10, actual + Math.max(1, Math.floor(n)));
      if (nuevo <= actual) throw new Error("llena");
      tx.update(ref, { sellos: nuevo, actualizado: F.serverTimestamp() });
      return nuevo;
    });
  }
  // Con la tarjeta llena (10 sellos), entrega la bebida gratis y la tarjeta vuelve a cero.
  async function canjear(token) {
    await iniciar();
    const ref = F.doc(db, COL, token);
    return F.runTransaction(db, async tx => {
      const s = await tx.get(ref); if (!s.exists()) throw new Error("no-existe");
      const d = s.data(); if ((d.sellos || 0) < 10) throw new Error("incompleta");
      tx.update(ref, { sellos: 0, canjes: (d.canjes || 0) + 1, actualizado: F.serverTimestamp() });
    });
  }
  // Escucha la tarjeta y avisa cada vez que cambia (así el cliente ve sus sellos al instante).
  async function escuchar(token, alCambiar, alFallar) {
    await iniciar();
    return F.onSnapshot(F.doc(db, COL, token), s => alCambiar(s.exists() ? { token, ...s.data() } : null), e => alFallar && alFallar(e));
  }
  return { iniciar, buscarPorCedula, obtener, crear, crearAcceso, ingresar, sumar, canjear, escuchar, link, tokenDeTexto, soloDigitos };
})();
