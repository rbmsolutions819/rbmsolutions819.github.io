// Reportes del condominio (demo). Todo se guarda en una misma base de datos (Firebase), así el residente,
// el oficial de seguridad y la administración ven lo mismo al instante, cada uno desde su propia página.
// Con ?local en la dirección se guarda solo en este navegador (para probar sin internet).
window.Datos = (() => {
  const CONFIG = {
    apiKey: "AIzaSyCdNwaEKRzhLAXf-vG5WJkf7qbrQJ4lkWg",
    authDomain: "rbm-solutions-2a4ce.firebaseapp.com",
    projectId: "rbm-solutions-2a4ce",
    storageBucket: "rbm-solutions-2a4ce.firebasestorage.app",
    messagingSenderId: "602522235911",
    appId: "1:602522235911:web:bd4fe58dcecb79edefe6a2"
  };
  const CASOS = "demo_condo_casos", META = "demo_condo_meta", RES = "demo_condo_residentes", ACC = "demo_condo_acceso";
  const LOCAL = /[?&]local\b/.test(location.search);
  const BASE = "https://www.gstatic.com/firebasejs/10.12.2/";
  let F = null, db = null, listo = null;

  // ---------- versión local (solo este navegador) ----------
  const LK = "condo-demo-v1", subs = [];
  const vacio = () => ({ n: 1000, casos: {}, res: {}, acc: {} });
  const lLeer = () => { try { return { ...vacio(), ...JSON.parse(localStorage.getItem(LK)) }; } catch { return vacio(); } };
  const lGuardar = d => { localStorage.setItem(LK, JSON.stringify(d)); subs.forEach(f => f()); };
  addEventListener("storage", e => { if (e.key === LK) subs.forEach(f => f()); });

  function iniciar() {
    if (LOCAL) return Promise.resolve();
    if (!listo) listo = (async () => {
      const [A, Fs] = await Promise.all([import(BASE + "firebase-app.js"), import(BASE + "firebase-firestore.js")]);
      F = Fs;
      const app = A.getApps().find(a => a.name === "condo") || A.initializeApp(CONFIG, "condo");
      db = F.getFirestore(app);
    })();
    return listo;
  }
  const ms = v => v == null ? null : typeof v === "number" ? v : v.toMillis ? v.toMillis() : +v;
  const ts = v => v == null ? null : F.Timestamp.fromMillis(v);
  const limpiar = (id, d) => ({ id, ...d, creado: ms(d.creado), atendido: ms(d.atendido), cerrado: ms(d.cerrado),
    historial: (d.historial || []).map(h => ({ ...h, t: ms(h.t) })) });
  const soloDigitos = s => String(s || "").replace(/\D/g, "");
  async function huella(texto) {
    const h = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("condo-demo:" + texto));
    return [...new Uint8Array(h)].map(b => b.toString(16).padStart(2, "0")).join("");
  }
  const nuevoToken = () => { const b = new Uint8Array(15); crypto.getRandomValues(b); return [...b].map(x => x.toString(36).padStart(2, "0")).join("").slice(0, 24); };

  /* ================= CASOS ================= */
  async function escuchar(alCambiar, alFallar) {
    await iniciar();
    if (LOCAL) { const f = () => alCambiar(Object.entries(lLeer().casos).map(([id, d]) => limpiar(id, d)).sort((a, b) => b.creado - a.creado)); subs.push(f); setTimeout(f, 0); return () => {}; }
    return F.onSnapshot(F.query(F.collection(db, CASOS), F.orderBy("creado", "desc"), F.limit(500)),
      s => alCambiar(s.docs.map(x => limpiar(x.id, x.data({ serverTimestamps: "estimate" })))), e => alFallar && alFallar(e));
  }
  // Crea un caso con número consecutivo (#1001, #1002…).
  async function crear(caso) {
    await iniciar();
    const ahora = Date.now(), ev = { t: ahora, quien: `${caso.nombre || "Residente"} (casa ${caso.casa})`, txt: "Reporte enviado" };
    if (LOCAL) { const d = lLeer(); d.n++; const id = "c" + ahora; d.casos[id] = { ...caso, num: d.n, estado: "nuevo", creado: ahora, historial: [ev] }; lGuardar(d); return { id, num: d.n }; }
    const ref = F.doc(F.collection(db, CASOS)), cRef = F.doc(db, META, "contador");
    const num = await F.runTransaction(db, async tx => {
      const c = await tx.get(cRef), n = (c.exists() ? c.data().n : 1000) + 1;
      tx.set(cRef, { n });
      tx.set(ref, { ...caso, num: n, estado: "nuevo", creado: ts(ahora), historial: [{ ...ev, t: ts(ahora) }] });
      return n;
    });
    return { id: ref.id, num };
  }
  // Cambia un caso y deja la huella en su historial (quién, qué y cuándo).
  async function actualizar(id, cambios, evento) {
    await iniciar();
    const ahora = Date.now(), cc = { ...cambios };
    if (LOCAL) { const d = lLeer(), c = d.casos[id]; if (!c) throw new Error("no-existe");
      ["atendido", "cerrado"].forEach(k => { if (cc[k] === true) cc[k] = ahora; });
      d.casos[id] = { ...c, ...cc, historial: [...(c.historial || []), ...(evento ? [{ ...evento, t: ahora }] : [])] }; lGuardar(d); return; }
    const ref = F.doc(db, CASOS, id);
    await F.runTransaction(db, async tx => {
      const s = await tx.get(ref); if (!s.exists()) throw new Error("no-existe");
      ["atendido", "cerrado"].forEach(k => { if (cc[k] === true) cc[k] = ts(ahora); });
      tx.update(ref, { ...cc, historial: [...(s.data().historial || []), ...(evento ? [{ ...evento, t: ts(ahora) }] : [])].slice(-30) });
    });
  }

  /* ================= RESIDENTES ================= */
  // La administración registra al residente; el residente abre su link y crea su contraseña.
  async function escucharResidentes(alCambiar, alFallar) {
    await iniciar();
    if (LOCAL) { const f = () => alCambiar(Object.entries(lLeer().res).map(([id, r]) => ({ id, ...r, creado: ms(r.creado) })).sort((a, b) => String(a.casa).localeCompare(String(b.casa), "es", { numeric: true }))); subs.push(f); setTimeout(f, 0); return () => {}; }
    return F.onSnapshot(F.collection(db, RES), s => alCambiar(s.docs.map(x => ({ id: x.id, ...x.data(), creado: ms(x.data().creado) }))
      .sort((a, b) => String(a.casa).localeCompare(String(b.casa), "es", { numeric: true }))), e => alFallar && alFallar(e));
  }
  async function crearResidente({ nombre, cedula, casa, tel = "" }) {
    await iniciar();
    const ced = soloDigitos(cedula), cedH = await huella("ced:" + ced), id = nuevoToken();
    const r = { nombre: String(nombre).trim().slice(0, 60), ced4: ced.slice(-4), cedH, casa: String(casa).trim().slice(0, 10), tel: soloDigitos(tel).slice(0, 12), activo: true, conClave: false };
    if (LOCAL) { const d = lLeer(); if (Object.values(d.res).some(x => x.cedH === cedH)) throw new Error("ya-existe"); d.res[id] = { ...r, creado: Date.now() }; lGuardar(d); return id; }
    const ya = await F.getDocs(F.query(F.collection(db, RES), F.where("cedH", "==", cedH), F.limit(1)));
    if (!ya.empty) throw new Error("ya-existe");
    await F.setDoc(F.doc(db, RES, id), { ...r, creado: F.serverTimestamp() });
    return id;
  }
  async function obtenerResidente(id) {
    await iniciar();
    if (LOCAL) { const r = lLeer().res[id]; return r ? { id, ...r } : null; }
    const s = await F.getDoc(F.doc(db, RES, id)); return s.exists() ? { id, ...s.data() } : null;
  }
  async function cambiarResidente(id, cambios) {
    await iniciar();
    if (LOCAL) { const d = lLeer(); if (!d.res[id]) throw new Error("no-existe"); d.res[id] = { ...d.res[id], ...cambios }; lGuardar(d); return; }
    await F.updateDoc(F.doc(db, RES, id), cambios);
  }
  // El residente confirma su cédula y crea su contraseña (solo se guarda una huella, nunca la contraseña).
  async function crearClave(id, cedula, clave) {
    const r = await obtenerResidente(id); if (!r) throw new Error("no-existe");
    const ced = soloDigitos(cedula);
    if ((await huella("ced:" + ced)) !== r.cedH) throw new Error("cedula");
    const h = await huella("acc:" + ced + ":" + clave);
    if (LOCAL) { const d = lLeer(); d.acc[h] = id; d.res[id].conClave = true; lGuardar(d); return r; }
    const w = F.writeBatch(db);
    w.set(F.doc(db, ACC, h), { t: id });
    w.update(F.doc(db, RES, id), { conClave: true });
    await w.commit();
    return r;
  }
  async function ingresar(cedula, clave) {
    await iniciar();
    const h = await huella("acc:" + soloDigitos(cedula) + ":" + clave);
    let id = null;
    if (LOCAL) id = lLeer().acc[h] || null;
    else { const s = await F.getDoc(F.doc(db, ACC, h)); id = s.exists() ? s.data().t : null; }
    if (!id) return null;
    const r = await obtenerResidente(id);
    return r && r.activo ? r : null;
  }

  // Residente de ejemplo con acceso listo (si no existe, lo crea). Sirve para entrar a la demo con "ricardo".
  async function asegurarResidente({ nombre, cedula, casa, clave }) {
    await iniciar();
    const ced = soloDigitos(cedula), id = "ej-" + ced, cedH = await huella("ced:" + ced), h = await huella("acc:" + ced + ":" + clave);
    const r = { nombre, ced4: ced.slice(-4), cedH, casa: String(casa), tel: "", activo: true, conClave: true };
    if (LOCAL) { const d = lLeer(); if (!d.res[id]) d.res[id] = { ...r, creado: Date.now() }; else d.res[id].activo = true; d.acc[h] = id; lGuardar(d); return; }
    const w = F.writeBatch(db);
    const s = await F.getDoc(F.doc(db, RES, id));
    if (s.exists()) w.update(F.doc(db, RES, id), { activo: true, conClave: true }); else w.set(F.doc(db, RES, id), { ...r, creado: F.serverTimestamp() });
    w.set(F.doc(db, ACC, h), { t: id });
    await w.commit();
  }
  /* ================= DATOS DE EJEMPLO ================= */
  async function sembrar(casos, residentes) {
    await iniciar();
    const filas = [];
    for (const r of residentes) {
      const ced = soloDigitos(r.cedula), id = "ej-" + ced;
      filas.push({ id, r: { nombre: r.nombre, ced4: ced.slice(-4), cedH: await huella("ced:" + ced), casa: r.casa, tel: "", activo: true, conClave: !!r.clave }, acc: r.clave ? await huella("acc:" + ced + ":" + r.clave) : null });
    }
    if (LOCAL) {
      const d = vacio();
      filas.forEach(f => { d.res[f.id] = { ...f.r, creado: Date.now() }; if (f.acc) d.acc[f.acc] = f.id; });
      casos.forEach((c, i) => { d.n++; d.casos["s" + i] = { ...c, num: d.n }; });
      lGuardar(d); return;
    }
    let w = F.writeBatch(db), k = 0;
    const paso = async () => { if (++k >= 400) { await w.commit(); w = F.writeBatch(db); k = 0; } };
    for (const f of filas) { w.set(F.doc(db, RES, f.id), { ...f.r, creado: F.serverTimestamp() }); await paso(); if (f.acc) { w.set(F.doc(db, ACC, f.acc), { t: f.id }); await paso(); } }
    let n = 1000;
    for (const c of casos) { n++; w.set(F.doc(F.collection(db, CASOS)), { ...c, num: n, creado: ts(c.creado), atendido: ts(c.atendido), cerrado: ts(c.cerrado), historial: c.historial.map(h => ({ ...h, t: ts(h.t) })) }); await paso(); }
    w.set(F.doc(db, META, "contador"), { n });
    await w.commit();
  }
  async function borrarTodo() {
    await iniciar();
    if (LOCAL) { lGuardar(vacio()); return; }
    for (const c of [CASOS, RES, ACC]) {
      const s = await F.getDocs(F.collection(db, c));
      for (let i = 0; i < s.docs.length; i += 400) { const w = F.writeBatch(db); s.docs.slice(i, i + 400).forEach(d => w.delete(d.ref)); await w.commit(); }
    }
    await F.setDoc(F.doc(db, META, "contador"), { n: 1000 });
  }
  return { LOCAL, soloDigitos, asegurarResidente, escuchar, crear, actualizar, escucharResidentes, crearResidente, obtenerResidente, cambiarResidente, crearClave, ingresar, sembrar, borrarTodo };
})();
