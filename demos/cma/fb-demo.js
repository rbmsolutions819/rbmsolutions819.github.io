// Versión de demostración: imita Firebase (base de datos, archivos y usuarios) guardando todo en este navegador.
// Así la demo funciona completa sin tocar ninguna base de datos real. En la versión final se cambia por Firebase.
const LS = "cma-demo-v3", USR = "cma-demo-usuario", CLAVE = "demo1234";
const tsDe = ms => ({ seconds: Math.floor(ms / 1000), nanoseconds: 0, toMillis: () => ms, toDate: () => new Date(ms) });
const SERV = { __srv: 1 }, INC = n => ({ __inc: n });

function leer(){ try { return JSON.parse(localStorage.getItem(LS)) || {}; } catch { return {}; } }
let BD = leer();
function guardar(){ try { localStorage.setItem(LS, JSON.stringify(BD)); } catch (e) { console.warn("Demo: no hay espacio en el navegador", e); } avisar(); }
addEventListener("storage", e => { if (e.key === LS) { BD = leer(); avisar(); } });
export function sembrar(datos){ if (!BD.__sembrado) { BD = { ...datos, __sembrado: 1 }; guardar(); } }

// valores guardados → como los devuelve Firebase
function salida(v){
  if (v && typeof v === "object") {
    if ("__ts" in v) return tsDe(v.__ts);
    if (Array.isArray(v)) return v.map(salida);
    const o = {}; for (const k in v) o[k] = salida(v[k]); return o;
  }
  return v;
}
// aplica serverTimestamp, increment y mezcla
function aplicar(prev, nuevo, mezclar){
  const out = mezclar && prev && typeof prev === "object" && !Array.isArray(prev) ? { ...prev } : {};
  for (const [k, v] of Object.entries(nuevo)) {
    if (v === SERV) out[k] = { __ts: Date.now() };
    else if (v && typeof v === "object" && "__inc" in v) out[k] = (+((prev || {})[k]) || 0) + v.__inc;
    else if (v instanceof Date) out[k] = { __ts: +v };
    else if (v && typeof v === "object" && !Array.isArray(v) && !("__ts" in v) && !(v.toMillis)) out[k] = aplicar((prev || {})[k], v, mezclar);
    else if (v && v.toMillis) out[k] = { __ts: v.toMillis() };
    else out[k] = v;
  }
  return out;
}

/* ---------------- Firestore ---------------- */
export const getFirestore = () => ({ tipo: "db" });
const ruta = (base, partes) => [...(base && base.ruta ? [base.ruta] : []), ...partes].join("/");
export function collection(base, ...partes){ return { tipo: "col", ruta: ruta(base, partes) }; }
export function doc(base, ...partes){
  if (base && base.tipo === "col" && !partes.length) partes = [Date.now().toString(36) + Math.random().toString(36).slice(2, 8)];
  const r = ruta(base, partes); return { tipo: "doc", ruta: r, id: r.split("/").pop(), path: r };
}
export const where = (campo, op, valor) => ({ campo, op, valor });
export const orderBy = () => null, limit = () => null;
export const query = (col, ...f) => ({ tipo: "q", ruta: col.ruta, filtros: f.filter(Boolean) });
export const serverTimestamp = () => SERV;
export const increment = n => INC(n);
export const Timestamp = { fromMillis: tsDe, now: () => tsDe(Date.now()), fromDate: d => tsDe(+d) };

const snapDoc = (r) => { const d = BD[r.ruta]; return { id: r.id, ref: r, exists: () => d !== undefined, data: () => d === undefined ? undefined : salida(d) }; };
function cumple(d, f){ const v = d[f.campo]; switch (f.op) {
  case "==": return v === f.valor; case "!=": return v !== f.valor; case ">": return v > f.valor; case ">=": return v >= f.valor; case "<": return v < f.valor; case "<=": return v <= f.valor;
  case "in": return f.valor.includes(v); case "array-contains": return Array.isArray(v) && v.includes(f.valor); default: return true; } }
function snapCol(q){
  const pre = q.ruta + "/", filtros = q.filtros || [];
  const docs = Object.keys(BD).filter(k => k.startsWith(pre) && !k.slice(pre.length).includes("/") && filtros.every(f => cumple(BD[k], f)))
    .map(k => snapDoc({ tipo: "doc", ruta: k, id: k.slice(pre.length), path: k }));
  return { docs, size: docs.length, empty: !docs.length, forEach: fn => docs.forEach(fn) };
}
export async function getDoc(r){ return snapDoc(r); }
export async function getDocs(q){ return snapCol(q); }
export async function setDoc(r, datos, op){ BD[r.ruta] = aplicar(BD[r.ruta], datos, !!(op && op.merge)); guardar(); }
export async function addDoc(col, datos){ const r = doc(col); BD[r.ruta] = aplicar(undefined, datos, false); guardar(); return r; }
export async function updateDoc(r, datos){
  if (BD[r.ruta] === undefined) throw new Error("not-found");
  const plano = {}; for (const [k, v] of Object.entries(datos)) { if (k.includes(".")) { const p = k.split("."); let o = plano; p.slice(0, -1).forEach(x => o = o[x] = o[x] || {}); o[p[p.length - 1]] = v; } else plano[k] = v; }
  BD[r.ruta] = aplicar(BD[r.ruta], plano, true); guardar();
}
export async function deleteDoc(r){ delete BD[r.ruta]; for (const k of Object.keys(BD)) if (k.startsWith(r.ruta + "/")) delete BD[k]; guardar(); }
export function writeBatch(){ const ops = []; return { set: (r, d, o) => ops.push(() => setDoc(r, d, o)), update: (r, d) => ops.push(() => updateDoc(r, d)), delete: r => ops.push(() => deleteDoc(r)), commit: async () => { for (const f of ops) await f(); } }; }

const oyentes = new Set();
function avisar(){ for (const o of oyentes) setTimeout(o, 0); }
export function onSnapshot(r, bien, mal){
  let antes = null; // ids de la vez anterior, para docChanges()
  const f = () => { try {
    if (r.tipo === "doc") return bien(snapDoc(r));
    const s = snapCol(r.tipo === "q" ? r : { ruta: r.ruta }), ids = new Set(s.docs.map(d => d.id));
    s.docChanges = () => s.docs.filter(d => !antes || !antes.has(d.id)).map(d => ({ type: "added", doc: d }));
    bien(s); antes = ids;
  } catch (e) { mal && mal(e); } };
  oyentes.add(f); setTimeout(f, 0); return () => oyentes.delete(f);
}

/* ---------------- Archivos (fotos y videos subidos) ---------------- */
// Se guardan en IndexedDB de este navegador.
const idb = new Promise((ok, no) => { const r = indexedDB.open("cma-demo-archivos", 1); r.onupgradeneeded = () => r.result.createObjectStore("a"); r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error); });
const tx = async (modo, fn) => { const db = await idb; return new Promise((ok, no) => { const t = db.transaction("a", modo), s = t.objectStore("a"), r = fn(s); t.oncomplete = () => ok(r && r.result); t.onerror = () => no(t.error); }); };
export const getStorage = () => ({ tipo: "storage" });
export const ref = (base, ruta = "") => ({ fullPath: ruta, name: ruta.split("/").pop(), toString: () => "demo://" + ruta });
export function uploadBytesResumable(r, archivo){
  const tarea = { snapshot: { ref: r, bytesTransferred: 0, totalBytes: archivo.size, state: "running" }, _cb: null,
    on(ev, prog, err, fin){ this._cb = { prog, err, fin }; return () => {}; }, cancel(){}, pause(){}, resume(){},
    then(a, b){ return listo.then(a, b); }, catch(b){ return listo.catch(b); } };
  const listo = (async () => {
    for (const p of [.25, .6, .9]) { await new Promise(s => setTimeout(s, 180)); tarea.snapshot.bytesTransferred = Math.round(archivo.size * p); tarea._cb?.prog?.(tarea.snapshot); }
    await tx("readwrite", s => s.put({ blob: archivo, tipo: archivo.type, t: Date.now() }, r.fullPath));
    tarea.snapshot.bytesTransferred = archivo.size; tarea.snapshot.state = "success"; tarea._cb?.prog?.(tarea.snapshot); tarea._cb?.fin?.(); return tarea.snapshot;
  })().catch(e => { tarea._cb?.err?.(e); throw e; });
  return tarea;
}
const urls = new Map();
export async function getDownloadURL(r){
  if (urls.has(r.fullPath)) return urls.get(r.fullPath);
  const x = await tx("readonly", s => s.get(r.fullPath)); if (!x) throw new Error("not-found");
  const u = URL.createObjectURL(x.blob); urls.set(r.fullPath, u); return u;
}
export async function deleteObject(r){ await tx("readwrite", s => s.delete(r.fullPath)); urls.delete(r.fullPath); }
export async function listAll(r){ const keys = await tx("readonly", s => s.getAllKeys()) || []; return { items: keys.filter(k => k.startsWith(r.fullPath + "/")).map(k => ref(null, k)), prefixes: [] }; }
export async function getMetadata(r){ const x = await tx("readonly", s => s.get(r.fullPath)); return { size: x ? x.blob.size : 0, contentType: x ? x.tipo : "", timeCreated: new Date(x ? x.t : Date.now()).toISOString() }; }

/* ---------------- Usuarios ---------------- */
// Cualquier usuario del equipo entra con la clave demo1234.
export const getAuth = () => authObj;
const authObj = { currentUser: (() => { try { return JSON.parse(localStorage.getItem(USR)); } catch { return null; } })() };
const authOyentes = new Set();
const cambiar = u => { authObj.currentUser = u; try { u ? localStorage.setItem(USR, JSON.stringify(u)) : localStorage.removeItem(USR); } catch {} authOyentes.forEach(f => setTimeout(() => f(u), 0)); };
export function onAuthStateChanged(a, f){ authOyentes.add(f); setTimeout(() => f(authObj.currentUser), 0); return () => authOyentes.delete(f); }
export async function signInWithEmailAndPassword(a, email, clave){
  await new Promise(s => setTimeout(s, 350));
  if (clave !== CLAVE || !/@cma\.demo$/.test(email)) { const e = new Error("auth/invalid-credential"); e.code = "auth/invalid-credential"; throw e; }
  const u = { email, uid: email.split("@")[0] }; cambiar(u); return { user: u };
}
export async function createUserWithEmailAndPassword(a, email){ return { user: { email, uid: email.split("@")[0] } }; }
export async function signOut(){ cambiar(null); }
export async function updatePassword(){ alert("En la demostración la contraseña siempre es demo1234."); }
export async function reauthenticateWithCredential(){ }
export const EmailAuthProvider = { credential: () => ({}) };
export const initializeApp = () => ({ tipo: "app" });
