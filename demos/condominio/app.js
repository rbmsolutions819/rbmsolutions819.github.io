// Reportes del condominio: una sola lógica para las tres páginas.
// <body data-modo="residente"> · <body data-modo="seguridad"> · <body data-modo="admin">
(() => {
"use strict";
const MODO = document.body.dataset.modo;
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const app = $("#app");
const I_P = {"volume": "<path d=\"M11 5 6 9H2v6h4l5 4V5z\"/><path d=\"M15.5 8.5a5 5 0 0 1 0 7\"/><path d=\"M19 5a10 10 0 0 1 0 14\"/>", "paw": "<circle cx=\"11\" cy=\"4\" r=\"2\"/><circle cx=\"18\" cy=\"8\" r=\"2\"/><circle cx=\"20\" cy=\"16\" r=\"2\"/><path d=\"M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.05Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z\"/>", "car": "<path d=\"M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2\"/><circle cx=\"7\" cy=\"17\" r=\"2\"/><path d=\"M9 17h6\"/><circle cx=\"17\" cy=\"17\" r=\"2\"/>", "trash": "<path d=\"M3 6h18\"/><path d=\"M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6\"/><path d=\"M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2\"/>", "sparkles": "<path d=\"M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z\"/><path d=\"M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z\"/>", "hammer": "<path d=\"m15 12-8.5 8.5a2.12 2.12 0 1 1-3-3L12 9\"/><path d=\"M17.64 15 22 10.64\"/><path d=\"m20.91 11.7-1.25-1.25c-.6-.6-.93-1.4-.93-2.25v-.86L16.01 4.6a5.56 5.56 0 0 0-3.94-1.64H9l.92.82A6.18 6.18 0 0 1 12 8.4v1.56l2 2h2.47l2.26 1.91\"/>", "bulb": "<path d=\"M9 18h6\"/><path d=\"M10 22h4\"/><path d=\"M15 14c.2-1 .7-1.7 1.5-2.5A6 6 0 1 0 7.5 11.5c.8.8 1.3 1.5 1.5 2.5\"/>", "gauge": "<path d=\"m12 14 4-4\"/><path d=\"M3.34 19a10 10 0 1 1 17.32 0\"/>", "shieldAlert": "<path d=\"M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z\"/><path d=\"M12 8v4\"/><path d=\"M12 16h.01\"/>", "shield": "<path d=\"M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z\"/>", "note": "<path d=\"M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z\"/><path d=\"M14 2v6h6\"/><path d=\"M16 13H8\"/><path d=\"M16 17H8\"/>", "megaphone": "<path d=\"m3 11 18-5v12L3 14v-3z\"/><path d=\"M11.6 16.8a3 3 0 1 1-5.8-1.6\"/>", "calendar": "<rect x=\"3\" y=\"4\" width=\"18\" height=\"18\" rx=\"2\"/><path d=\"M16 2v4M8 2v4M3 10h18\"/>", "wrench": "<path d=\"M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z\"/>", "alert": "<path d=\"m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z\"/><path d=\"M12 9v4\"/><path d=\"M12 17h.01\"/>", "cake": "<path d=\"M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8\"/><path d=\"M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1\"/><path d=\"M2 21h20\"/><path d=\"M7 8v3M12 8v3M17 8v3\"/>", "book": "<path d=\"M4 19.5A2.5 2.5 0 0 1 6.5 17H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z\"/><path d=\"M6.5 17A2.5 2.5 0 0 0 4 19.5 2.5 2.5 0 0 0 6.5 22H20v-5\"/>", "scissors": "<circle cx=\"6\" cy=\"6\" r=\"3\"/><circle cx=\"6\" cy=\"18\" r=\"3\"/><path d=\"M20 4 8.12 15.88M14.47 14.48 20 20M8.12 8.12 12 12\"/>", "bag": "<path d=\"M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z\"/><path d=\"M3 6h18\"/><path d=\"M16 10a4 4 0 0 1-8 0\"/>", "laptop": "<rect x=\"3\" y=\"4\" width=\"18\" height=\"12\" rx=\"2\"/><path d=\"M2 20h20\"/>", "box": "<path d=\"M21 8 12 3 3 8v8l9 5 9-5z\"/><path d=\"m3 8 9 5 9-5\"/><path d=\"M12 13v8\"/>", "users": "<path d=\"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2\"/><circle cx=\"9\" cy=\"7\" r=\"4\"/><path d=\"M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75\"/>", "user": "<circle cx=\"12\" cy=\"8\" r=\"4\"/><path d=\"M4 21a8 8 0 0 1 16 0\"/>", "tent": "<path d=\"M3.5 21 12 4l8.5 17\"/><path d=\"M12 13l4 8M12 13l-4 8\"/><path d=\"M2 21h20\"/>", "home": "<path d=\"M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z\"/>", "chart": "<path d=\"M3 3v18h18\"/><path d=\"M7 16v-5M12 16V8M17 16v-8\"/>", "coffee": "<path d=\"M17 8h1a4 4 0 1 1 0 8h-1\"/><path d=\"M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z\"/><path d=\"M6 2v2M10 2v2M14 2v2\"/>", "gift": "<rect x=\"3\" y=\"8\" width=\"18\" height=\"4\" rx=\"1\"/><path d=\"M12 8v13\"/><path d=\"M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7\"/><path d=\"M7.5 8a2.5 2.5 0 0 1 0-5C10 3 12 8 12 8s2-5 4.5-5a2.5 2.5 0 0 1 0 5\"/>", "star": "<path d=\"m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z\"/>", "check": "<path d=\"M20 6 9 17l-5-5\"/>", "phone": "<path d=\"M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z\"/>", "pin": "<path d=\"M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z\"/><circle cx=\"12\" cy=\"9.5\" r=\"2.5\"/>", "clock": "<circle cx=\"12\" cy=\"12\" r=\"10\"/><path d=\"M12 6v6l4 2\"/>", "mail": "<rect x=\"2\" y=\"4\" width=\"20\" height=\"16\" rx=\"2\"/><path d=\"m22 7-10 6L2 7\"/>", "cart": "<circle cx=\"8\" cy=\"21\" r=\"1\"/><circle cx=\"19\" cy=\"21\" r=\"1\"/><path d=\"M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12\"/>", "bell": "<path d=\"M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9\"/><path d=\"M10.3 21a1.94 1.94 0 0 0 3.4 0\"/>", "heart": "<path d=\"M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z\"/>", "glass": "<path d=\"M8 22h8M12 11v11M5 3h14l-7 8z\"/>", "truck": "<path d=\"M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2\"/><path d=\"M15 18H9\"/><path d=\"M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14\"/><circle cx=\"17\" cy=\"18\" r=\"2\"/><circle cx=\"7\" cy=\"18\" r=\"2\"/>", "tag": "<path d=\"M12.59 2.59A2 2 0 0 0 11.17 2H4a2 2 0 0 0-2 2v7.17a2 2 0 0 0 .59 1.41l8.7 8.7a2.43 2.43 0 0 0 3.42 0l6.58-6.58a2.43 2.43 0 0 0 0-3.42z\"/><circle cx=\"7.5\" cy=\"7.5\" r=\".5\" fill=\"currentColor\"/>", "flame": "<path d=\"M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z\"/>", "leaf": "<path d=\"M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z\"/><path d=\"M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12\"/>", "lock": "<rect x=\"3\" y=\"11\" width=\"18\" height=\"11\" rx=\"2\"/><path d=\"M7 11V7a5 5 0 0 1 10 0v4\"/>", "qr": "<rect x=\"3\" y=\"3\" width=\"7\" height=\"7\" rx=\"1\"/><rect x=\"14\" y=\"3\" width=\"7\" height=\"7\" rx=\"1\"/><rect x=\"3\" y=\"14\" width=\"7\" height=\"7\" rx=\"1\"/><path d=\"M14 14h3v3h-3zM20 14v.01M14 20h.01M17 17h4v4h-4\"/>", "chat": "<path d=\"M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z\"/>", "spa": "<path d=\"M12 22c-4.4 0-8-3.1-8-7 2.5 0 5 1 8 4 3-3 5.5-4 8-4 0 3.9-3.6 7-8 7Z\"/><path d=\"M12 19c-1.7-2.3-2.5-4.6-2.5-7S10.3 7.3 12 5c1.7 2.3 2.5 4.6 2.5 7s-.8 4.7-2.5 7Z\"/>", "fish": "<path d=\"M6.5 12c.94-3.46 4.94-6 8.5-6 3.56 0 6.06 3.54 7 6-.94 2.47-3.44 6-7 6s-7.56-2.53-8.5-6Z\"/><path d=\"M18 12v.5\"/><path d=\"M2 8c2 2 2 6 0 8 2 0 4.5-1 6-4-1.5-3-4-4-6-4Z\"/>", "bowl": "<path d=\"M12 21a9 9 0 0 0 9-9H3a9 9 0 0 0 9 9Z\"/><path d=\"M7 21h10\"/><path d=\"M19.5 12 22 6\"/><path d=\"M16.25 3c.27.1.8.53.75 1.36-.06.83-.93 1.2-1 2.02-.05.78.34 1.24.73 1.62\"/><path d=\"M11.25 3c.27.1.8.53.74 1.36-.05.83-.93 1.2-.98 2.02-.06.78.33 1.24.72 1.62\"/>", "candle": "<path d=\"M9 22h6M10 22V10h4v12\"/><path d=\"M12 10V7\"/><path d=\"M12 2c-1 1.5-1.5 2.5-1 3.5s2 1 2 0-.5-2-1-3.5Z\"/>", "shirt": "<path d=\"M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z\"/>", "dumbbell": "<path d=\"M6.5 6.5h11M6.5 17.5h11M6 20V4M18 20V4M3 15V9M21 15V9\"/>", "sun": "<circle cx=\"12\" cy=\"12\" r=\"4\"/><path d=\"M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41\"/>", "moon": "<path d=\"M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z\"/>", "settings": "<circle cx=\"12\" cy=\"12\" r=\"3\"/><path d=\"M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z\"/>"};
const I = new Proxy({}, { get: (_, k) => `<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I_P[k] || I_P.box}</svg>` });


/* ===================== CATÁLOGOS ===================== */
// [clave, ícono, nombre, prioridad]
const TIPOS = [
  ["ruido",I.volume,"Ruido o bulla","alta"], ["mascotas",I.paw,"Mascotas","media"], ["parqueo",I.car,"Parqueo","media"],
  ["basura",I.trash,"Basura","baja"], ["sucio",I.sparkles,"Área común sucia","baja"], ["dano",I.hammer,"Daño o vandalismo","media"],
  ["averia",I.bulb,"Avería (luz, agua, portón)","media"], ["velocidad",I.gauge,"Exceso de velocidad","media"],
  ["seguridad",I.shieldAlert,"Seguridad o sospechoso","alta"], ["otro",I.note,"Otro","baja"]];
const tipo = k => TIPOS.find(t => t[0] === k) || TIPOS[TIPOS.length - 1];
const LUGARES = ["Una casa","Parque infantil","Rancho / BBQ","Piscina","Gimnasio","Salón de eventos","Parqueo de visitas","Calle interna","Portón / entrada","Zona de basura","Otro"];
const RESULTADOS = [["resuelto","Resuelto"],["llamado","Se llamó la atención"],["no_encontrado","No se encontró el problema"],["falsa","Falsa alarma"],["escalado","Pasado a administración"]];
const resultado = k => (RESULTADOS.find(r => r[0] === k) || [k, k])[1];
const ESTADOS = { nuevo: "Nuevo", en_atencion: "En atención", cerrado: "Cerrado" };
const OFICIALES = ["Oficial Mora", "Oficial Rojas", "Oficial Vargas"];
const USUARIOS = { seguridad: { usuario: "seguridad", clave: "demo1234", otros: [] }, admin: { usuario: "administrador", clave: "demo1234", otros: ["administracion", "admin"] } };
const RICARDO = { nombre: "José Ricardo Montoya", cedula: "1111111", casa: "18", clave: "demo1234", usuario: "ricardo" };
const nombreCondo = () => { const n = lsGet("condo-nombre", ""); return !n || n === "Condominio Vista Verde" ? "Condominio Puerto España" : n; };

/* ===================== RANCHOS ===================== */
const RANCHOS = [
  { n: 1, nombre: "Rancho 1", desc: "Junto a la piscina · hasta 20 personas" },
  { n: 2, nombre: "Rancho 2", desc: "Con parrilla · hasta 30 personas" },
  { n: 3, nombre: "Rancho 3", desc: "Frente al parque infantil · hasta 15 personas" }];
const R_INI = 8 * 60, R_FIN = 21 * 60, R_MAX = 6 * 60, R_DIAS = 30;   // se reserva de 8 a. m. a 9 p. m., máximo 6 horas
const rancho = n => RANCHOS.find(r => r.n === n) || { n, nombre: "Rancho " + n, desc: "" };
const isoL = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const deIsoL = f => { const [y, m, d] = f.split("-").map(Number); return new Date(y, m - 1, d); };
const hoyL = () => isoL(new Date());
const minAhora = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); };
const h12 = m => { let h = Math.floor(m / 60), mm = m % 60; const pm = h >= 12; h = h % 12 || 12; return `${h}:${String(mm).padStart(2, "0")} ${pm ? "p. m." : "a. m."}`; };
const horario = r => `${h12(r.ini)} – ${h12(r.fin)}`;
const mayus = t => t.charAt(0).toUpperCase() + t.slice(1);
function diaTxt(f, largo){
  const d = mayus(deIsoL(f).toLocaleDateString("es-CR", largo ? { weekday: "long", day: "numeric", month: "long" } : { weekday: "short", day: "numeric", month: "short" }));
  const man = new Date(); man.setDate(man.getDate() + 1);
  return f === hoyL() ? `Hoy · ${d}` : f === isoL(man) ? `Mañana · ${d}` : d;
}
const activasDe = (lista, n, f) => lista.filter(r => r.estado === "activa" && r.rancho === n && r.fecha === f).sort((a, b) => a.ini - b.ini);
function libresDe(lista, n, f){
  let desde = R_INI; if (f === hoyL()) desde = Math.max(desde, Math.ceil(minAhora() / 60) * 60);
  const out = []; for (const r of activasDe(lista, n, f)) { if (r.ini > desde) out.push([desde, r.ini]); desde = Math.max(desde, r.fin); }
  if (desde < R_FIN) out.push([desde, R_FIN]); return out;
}
// Cómo está cada rancho un día: lo apartado y lo que queda libre
function resumenDia(lista, f, { verNombre = false, yo = "", privado = false } = {}){
  return `<div class="rdia">${RANCHOS.map(R => { const l = activasDe(lista, R.n, f), lib = libresDe(lista, R.n, f);
    return `<div class="rcard"><b>${R.nombre}</b>${l.map(r => `<span class="ocup">${horario(r)} · ${r.resId === yo ? "Tu reserva" : privado ? "Reservado" : "Casa " + esc(r.casa)}${verNombre ? ` (${esc(r.nombre)})` : ""}${r.nota && (!privado || r.resId === yo) ? ` · ${esc(r.nota)}` : ""}</span>`).join("")}
      <span class="lib">${lib.length ? "Libre " + lib.map(([a, b]) => `${h12(a)} – ${h12(b)}`).join(" · ") : "Sin horas libres"}</span></div>`; }).join("")}</div>`;
}

/* ===================== NOTICIAS Y EMPRENDIMIENTOS ===================== */
const NT_TIPOS = [["aviso",I.megaphone,"Aviso"],["evento",I.calendar,"Evento"],["mant",I.wrench,"Mantenimiento"],["importante",I.alert,"Importante"]];
const ntTipo = k => NT_TIPOS.find(t => t[0] === k) || NT_TIPOS[0];
const EMP_CAT = [["comida",I.cake,"Comida"],["servicios",I.wrench,"Servicios"],["clases",I.book,"Clases"],["belleza",I.scissors,"Belleza"],["productos",I.bag,"Productos"],["mascotas",I.paw,"Mascotas"],["tecno",I.laptop,"Tecnología"],["otro",I.box,"Otro"]];
const empCat = k => EMP_CAT.find(t => t[0] === k) || EMP_CAT[EMP_CAT.length - 1];
const parrafos = t => esc(t).replace(/\n/g, "<br>");
const telWa = t => { const d = String(t || "").replace(/\D/g, ""); return d.length === 8 ? "506" + d : d; };
const telVer = t => { const d = String(t || "").replace(/\D/g, ""); return d.length === 8 ? d.slice(0, 4) + "-" + d.slice(4) : d; };
const ordenNoticias = l => [...l].sort((a, b) => (b.fijada ? 1 : 0) - (a.fijada ? 1 : 0) || b.creado - a.creado);
function tarjetaNoticia(n, acciones = ""){
  const [k, ic, nom] = ntTipo(n.tipo);
  return `<article class="noticia t-${k}${n.fijada ? " fija" : ""}">${n.foto ? `<img class="nt-foto" src="${esc(n.foto)}" alt="" loading="lazy">` : ""}
    <div class="nt-cuerpo"><div class="nt-meta"><span class="nt-tipo">${ic} ${nom}</span>${n.fijada ? `<span class="nt-fija">Fijada</span>` : ""}<span class="nt-t">${n.creado ? hace(n.creado) : ""}</span></div>
    <h3>${esc(n.titulo)}</h3>${n.fecha ? `<p class="nt-fecha">${esc(diaTxt(n.fecha, true))}</p>` : ""}<p class="nt-texto">${parrafos(n.texto)}</p>${acciones}</div></article>`;
}
const noticiasHTML = (l, acc = () => "") => l.length ? `<div class="noticias">${ordenNoticias(l).map(n => tarjetaNoticia(n, acc(n))).join("")}</div>` : `<p class="vacio">Todavía no hay noticias.</p>`;
function tarjetaEmp(e, acciones = ""){
  const [, ic, nom] = empCat(e.categoria), w = telWa(e.tel);
  const msg = `Hola ${String(e.resNombre || "").split(" ")[0]}, vi tu emprendimiento "${e.nombre}" en la app del ${nombreCondo()}.`;
  return `<article class="emp">${e.foto ? `<img class="emp-foto" src="${esc(e.foto)}" alt="" loading="lazy">` : `<div class="emp-foto sin c-${esc(e.categoria)}" aria-hidden="true">${ic}</div>`}
    <div class="emp-cuerpo"><span class="emp-cat">${ic} ${nom}</span><h3>${esc(e.nombre)}</h3><p class="emp-desc">${parrafos(e.descripcion)}</p>
      <p class="emp-de">Casa ${esc(e.casa)} · ${esc(e.resNombre)}</p>
      <div class="emp-acc">${w ? `<a class="btn sm wa" target="_blank" rel="noopener" href="https://wa.me/${w}?text=${encodeURIComponent(msg)}">WhatsApp ${telVer(e.tel)}</a>` : ""}${acciones}</div></div></article>`;
}
// Catálogo con filtro por categoría (solo los aprobados)
function catalogoEmp(l, cat){
  const ok = l.filter(e => e.estado === "aprobado"), cats = EMP_CAT.filter(([k]) => ok.some(e => e.categoria === k)), ver = ok.filter(e => !cat || e.categoria === cat);
  return `<div class="chips"><button type="button" data-ecat="" aria-pressed="${!cat}">Todos (${ok.length})</button>${cats.map(([k, ic, n]) => `<button type="button" data-ecat="${k}" aria-pressed="${cat === k}">${ic} ${n}</button>`).join("")}</div>
    ${ver.length ? `<div class="emps">${ver.map(e => tarjetaEmp(e)).join("")}</div>` : `<p class="vacio">Todavía no hay emprendimientos publicados.</p>`}`;
}
const EST_EMP = { pendiente: ["en_atencion", "En revisión"], aprobado: ["cerrado", "Publicado"], rechazado: ["nuevo", "No aprobado"] };

/* ===================== VISITAS ===================== */
const VI_TIPOS = [["visita",I.users,"Visita"],["entrega",I.box,"Entrega o delivery"],["servicio",I.wrench,"Servicio o técnico"],["transporte",I.car,"Taxi o Uber"]];
const viTipo = k => VI_TIPOS.find(t => t[0] === k) || VI_TIPOS[0];
const viHasta = v => v.hasta || v.fecha;
const viVarios = v => viHasta(v) !== v.fecha;
const viVigente = v => v.fecha <= hoyL() && hoyL() <= viHasta(v);
const viEstado = v => v.estado === "autorizada" && viHasta(v) < hoyL() ? "vencida" : v.estado;
// Puede entrar hoy: autorizada y vigente, o de varios días que ya salió y vuelve otro día
const viPuedeEntrar = v => viVigente(v) && (v.estado === "autorizada" || (v.estado === "salio" && viVarios(v)));
const EST_VI = { autorizada: ["en_atencion", "Autorizada"], adentro: ["cerrado", "Adentro"], salio: ["sal", "Salió"], cancelada: ["nuevo", "Cancelada"], vencida: ["sal", "Vencida"] };
const viEstHTML = v => { const e = viEstado(v), [cl, t] = EST_VI[e] || EST_VI.autorizada; return `<span class="est ${cl}">${e === "salio" && viPuedeEntrar(v) ? "Puede volver" : t}</span>`; };
const diaCorto = f => mayus(deIsoL(f).toLocaleDateString("es-CR", { weekday: "short", day: "numeric", month: "short" }));
const viCuando = v => viVarios(v) ? `Del ${diaCorto(v.fecha)} al ${diaCorto(viHasta(v))}` : diaTxt(v.fecha);
const hora = t => t ? new Date(t).toLocaleTimeString("es-CR", { hour: "numeric", minute: "2-digit" }) : "";
const h24a12 = hh => { if (!hh) return ""; const [h, m] = hh.split(":").map(Number); return h12(h * 60 + m); };
const nuevoCodigo = () => String(1000 + Math.floor(Math.random() * 9000));
function filaVisita(v, { verCasa = true, acciones = "" } = {}){
  const [, ic, nom] = viTipo(v.tipo);
  const mov = v.estado === "adentro" ? `Entró ${hace(v.ingreso)} (${hora(v.ingreso)})` : v.estado === "salio" ? `Entró ${hora(v.ingreso)} · salió ${hora(v.salida)}` : "";
  return `<div class="caso visita${v.estado === "adentro" ? " uso" : ""}" style="cursor:default;${["cancelada", "vencida"].includes(viEstado(v)) ? "opacity:.6" : ""}"><span class="ic">${ic}</span>
    <span><b>${esc(v.nombre)}${v.placa ? ` · ${esc(v.placa)}` : ""}</b><span class="meta">${verCasa ? `Casa ${esc(v.casa)} · ` : ""}${esc(nom)} · ${esc(viCuando(v))}${v.hora ? ` · ~${esc(h24a12(v.hora))}` : ""}${v.codigo ? ` · Código <b>${esc(v.codigo)}</b>` : ""}${v.registradaPor ? ` · Sin anunciar (${esc(v.registradaPor)})` : ""}${mov ? ` · ${mov}` : ""}${v.nota ? ` · ${esc(v.nota)}` : ""}</span></span>
    <span class="der">${viEstHTML(v)}${acciones}</span></div>`;
}
const mensajeVisita = v => `Hola ${String(v.nombre).split(" ")[0]}, ya autoricé tu entrada al ${nombreCondo()} (${viCuando(v).toLowerCase()}). En la caseta de seguridad decí que vas a la casa ${v.casa} y da este código: *${v.codigo}*`;

/* ===================== UTILIDADES ===================== */
const min = (a, b) => Math.round((b - a) / 60000);
function hace(t){ const m = min(t, Date.now()); if (m < 1) return "recién"; if (m < 60) return `hace ${m} min`; const h = Math.floor(m / 60); if (h < 24) return `hace ${h} h`; const d = Math.floor(h / 24); return d === 1 ? "ayer" : `hace ${d} días`; }
const fecha = t => t ? new Date(t).toLocaleString("es-CR", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : "—";
const dur = m => m == null || isNaN(m) ? "—" : m < 60 ? `${Math.round(m)} min` : `${Math.floor(m / 60)} h ${Math.round(m % 60)} min`;
const donde = c => c.lugar === "Una casa" && c.contraCasa ? `Casa ${c.contraCasa}` : [c.lugar, c.donde].filter(Boolean).join(" · ");
let tAviso; function aviso(t){ const el = $("#toast"); el.textContent = t; el.classList.add("on"); clearTimeout(tAviso); tAviso = setTimeout(() => el.classList.remove("on"), 3200); }
function hoja(html, alAbrir){
  const v = document.createElement("div"); v.className = "velo"; v.innerHTML = `<div class="hoja" role="dialog" aria-modal="true">${html}</div>`;
  document.body.append(v); document.body.style.overflow = "hidden";
  const cerrar = () => { v.remove(); if (!$(".velo")) document.body.style.overflow = ""; document.removeEventListener("keydown", tecla); };
  const tecla = e => { if (e.key === "Escape") cerrar(); };
  v.addEventListener("click", e => { if (e.target === v || e.target.closest("[data-cerrar]")) cerrar(); });
  document.addEventListener("keydown", tecla);
  alAbrir?.(v.firstElementChild, cerrar); return cerrar;
}
function comprimir(file, max = 900, q = .78){
  return new Promise((ok, mal) => { const r = new FileReader(); r.onload = () => { const im = new Image(); im.onload = () => {
    const s = Math.min(1, max / Math.max(im.width, im.height)), cv = document.createElement("canvas"); cv.width = Math.round(im.width * s); cv.height = Math.round(im.height * s);
    cv.getContext("2d").drawImage(im, 0, 0, cv.width, cv.height); ok(cv.toDataURL("image/jpeg", q)); }; im.onerror = mal; im.src = r.result; }; r.onerror = mal; r.readAsDataURL(file); });
}
const LOGO = `<svg viewBox="0 0 92 78" aria-hidden="true" class="logo-pe"><g fill="currentColor"><rect x="0" y="4" width="58" height="11"/><rect x="0" y="4" width="11" height="42"/><rect x="0" y="35" width="42" height="11"/><rect x="63" y="0" width="11" height="11"/><rect x="77" y="0" width="11" height="11"/><rect x="63" y="14" width="11" height="11"/><rect x="77" y="14" width="11" height="11"/><rect x="77" y="30" width="11" height="45"/><rect x="14" y="64" width="74" height="11"/></g></svg>`;
const nombreCorto = () => nombreCondo().replace(/^condominio\s+/i, "");
const marca = (sub = "Condominio") => `<div class="marca">${LOGO}<div><b>${esc(nombreCorto())}</b><span>${esc(sub)}</span></div></div>`;
function encabezado(rol, extra = "", portada = true){
  document.body.classList.remove("ingreso");
  const saludo = MODO === "residente" ? "Bienvenido a casa" : MODO === "seguridad" ? "Monitoreo del condominio" : "Panel de la administración";
  return `<header class="top"><div class="wrap"><div class="logo" aria-hidden="true">${LOGO}</div>
    <div><h1>${esc(nombreCondo())}</h1><small>${rol}</small></div>
    <div class="der">${extra}<button class="btn sm" type="button" data-salir>Salir</button></div></div></header>
    ${portada ? `<div class="wrap"><div class="portada ${MODO === "residente" ? "alta" : ""}">${marca(saludo)}</div></div>` : ""}`;
}
function encIngreso(rol){
  const h = encabezado(rol, "", false).replace(/<button class="btn sm" type="button" data-salir>Salir<\/button>/, "");
  document.body.classList.add("ingreso");
  return h + `<div class="wrap">${marca()}</div>`;
}
document.addEventListener("click", e => { if (e.target.closest("[data-salir]")) { lsSet("condo-ses-" + MODO, null); location.hash = ""; location.reload(); } });

/* ===================== DATOS DE EJEMPLO (un mes de reportes) ===================== */
function generarEjemplo(){
  let semilla = 7; const rnd = () => { semilla = (semilla * 1664525 + 1013904223) % 4294967296; return semilla / 4294967296; };
  const de = a => a[Math.floor(rnd() * a.length)];
  const peso = o => { const t = Object.values(o).reduce((a, b) => a + b, 0); let r = rnd() * t; for (const [k, v] of Object.entries(o)) { if ((r -= v) <= 0) return k; } return Object.keys(o)[0]; };
  const residentes = [
    { nombre: "María Fernández", cedula: "101110111", casa: "12", clave: "1234" }, { nombre: "Carlos Jiménez", cedula: "202220222", casa: "5" },
    { nombre: "Andrea Solano", cedula: "303330333", casa: "8" }, { nombre: "Luis Quesada", cedula: "404440444", casa: "14" },
    { nombre: "Patricia Rojas", cedula: "505550555", casa: "21" }, { nombre: "Esteban Vargas", cedula: "606660666", casa: "27" },
    { nombre: "Daniela Mora", cedula: "707770777", casa: "33" }, { nombre: "Jorge Chaves", cedula: "808880888", casa: "40" },
    { nombre: "Sofía Castro", cedula: "909990999", casa: "45" }, { nombre: RICARDO.nombre, cedula: RICARDO.cedula, casa: RICARDO.casa, clave: RICARDO.clave }];
  const LUG = { ruido: {"Una casa": 8, "Salón de eventos": 1, "Piscina": 1}, mascotas: {"Parque infantil": 3, "Calle interna": 3, "Una casa": 4},
    parqueo: {"Parqueo de visitas": 5, "Calle interna": 4, "Una casa": 1}, basura: {"Zona de basura": 6, "Calle interna": 3}, sucio: {"Rancho / BBQ": 5, "Parque infantil": 2, "Piscina": 2, "Gimnasio": 1},
    dano: {"Parque infantil": 3, "Gimnasio": 2, "Portón / entrada": 2, "Rancho / BBQ": 2}, averia: {"Calle interna": 4, "Portón / entrada": 3, "Piscina": 2},
    velocidad: {"Calle interna": 1}, seguridad: {"Portón / entrada": 2, "Calle interna": 2}, otro: {"Otro": 1} };
  const TXT = {
    ruido: ["Música a todo volumen desde hace rato.", "Fiesta con gritos pasada la medianoche.", "Están haciendo bulla en la terraza.", "Parlante muy alto, no se puede dormir."],
    mascotas: ["Perro suelto en la calle interna.", "Dejaron popó de perro sin recoger.", "Perro ladrando desde hace más de una hora."],
    parqueo: ["Carro parqueado en mi espacio.", "Visita parqueada en la calle, no deja pasar.", "Moto ocupando dos espacios de visita."],
    basura: ["Sacaron la basura fuera de horario.", "Bolsas rotas y perros regando basura.", "Reciclaje mezclado con basura común."],
    sucio: ["Dejaron la parrilla del rancho sucia.", "Quedó basura en el parque después de una fiesta.", "Vasos y latas en la piscina."],
    dano: ["Quebraron un columpio del parque.", "Rayaron la pared del gimnasio.", "Dañaron el brazo del portón."],
    averia: ["Lámpara de la calle apagada.", "Fuga de agua frente a la casa.", "El portón no cierra bien."],
    velocidad: ["Carro pasó muy rápido por la calle interna.", "Moto a exceso de velocidad cerca del parque."],
    seguridad: ["Persona desconocida rondando las casas.", "Visita entró sin autorización."], otro: ["Otro asunto para revisar."] };
  const NOTA_ESC = ["Reincidente: ya se le llamó la atención varias veces.", "El residente no colabora con seguridad.", "Requiere reunión con la administración.", "Hay que revisar el reglamento con la casa."];
  const RESP_ADM = ["Se habló con el residente y se le envió una advertencia por escrito.", "Se le aplicó la multa según el reglamento.", "Reunión con el residente: se comprometió a no repetirlo."];
  const PROB = ["El residente no abrió la puerta.", "Se negaron a bajar el volumen a la primera.", "Se tuvo que volver dos veces.", "Hubo discusión entre vecinos.", "Se llamó a la Fuerza Pública."];
  const RESOL = { resuelto: "Se atendió y quedó resuelto.", llamado: "Se habló con los residentes y bajaron el volumen.", no_encontrado: "Se revisó la zona y no se encontró el problema.", falsa: "Era una actividad autorizada.", escalado: "Se pasó a la administración para seguimiento." };
  const ahora = Date.now(), casos = [];
  for (let i = 0; i < 64; i++) {
    const t = peso({ ruido: 30, mascotas: 14, parqueo: 14, basura: 9, sucio: 10, dano: 5, averia: 8, velocidad: 5, seguridad: 4, otro: 1 });
    const dia = Math.floor(rnd() * 30);
    let hora = t === "ruido" ? de([20, 21, 22, 22, 23, 23, 0, 0, 1, 19]) : 7 + Math.floor(rnd() * 15);
    const base = new Date(ahora - dia * 864e5); base.setHours(hora, Math.floor(rnd() * 60), 0, 0);
    let creado = base.getTime(); if (creado > ahora - 3 * 3600e3) creado -= 864e5;
    const lugar = peso(LUG[t]);
    const contra = lugar === "Una casa" ? (t === "ruido" ? peso({"27": 5, "33": 3, "8": 1, "40": 1}) : t === "mascotas" ? peso({"14": 5, "21": 2, "45": 1}) : peso({"8": 4, "5": 1})) : "";
    const rep = de(residentes.filter(r => r.casa !== contra));
    const aten = creado + (t === "ruido" || t === "seguridad" ? 3 + rnd() * 12 : 6 + rnd() * 28) * 60000;
    const cerr = aten + (5 + rnd() * 40) * 60000;
    const res = t === "ruido" ? peso({ llamado: 6, resuelto: 2, no_encontrado: 1, falsa: 1 }) : peso({ resuelto: 7, escalado: 2, no_encontrado: 1 });
    const prob = rnd() < .15, ag = de(OFICIALES), cal = rnd() < .6 ? peso({"5": 5, "4": 4, "3": 2, "2": 1}) : null;
    const escl = res === "escalado" ? "resuelto" : "", notaE = escl ? de(NOTA_ESC) : "", respA = escl ? de(RESP_ADM) : "";
    casos.push({ tipo: t, lugar, contraCasa: contra, donde: "", descripcion: de(TXT[t]), foto: "", casa: rep.casa, nombre: rep.nombre, resId: "ej-" + rep.cedula, prioridad: tipo(t)[3],
      estado: "cerrado", agente: ag, resultado: res, resolucion: RESOL[res], problema: prob, problemaNota: prob ? de(PROB) : "", calificacion: cal ? +cal : null, comentarioRes: "",
      creado, atendido: aten, cerrado: cerr, escalado: escl, escaladoNota: notaE, escaladoPor: escl ? ag : "", escaladoT: escl ? cerr : null, adminNota: respA,
      historial: [{ t: creado, quien: `${rep.nombre} (casa ${rep.casa})`, txt: "Reporte enviado" }, { t: aten, quien: ag, txt: "Va en camino" }, { t: cerr, quien: ag, txt: `Cerrado: ${resultado(res)}` },
        ...(escl ? [{ t: cerr + 60000, quien: ag, txt: "Escalado a administración: " + notaE }, { t: cerr + 2 * 864e5, quien: "Administración", txt: "Resuelto por administración: " + respA }] : [])] });
  }
  // dos casos abiertos ahora mismo
  const r1 = residentes[0], r2 = residentes[4];
  casos.push({ tipo: "ruido", lugar: "Una casa", contraCasa: "27", donde: "", descripcion: "Música muy alta y gritos en la terraza.", foto: "", casa: r1.casa, nombre: r1.nombre, resId: "ej-" + r1.cedula, prioridad: "alta",
    estado: "nuevo", agente: "", resultado: "", resolucion: "", problema: false, problemaNota: "", calificacion: null, comentarioRes: "", creado: ahora - 6 * 60000, atendido: null, cerrado: null,
    historial: [{ t: ahora - 6 * 60000, quien: `${r1.nombre} (casa ${r1.casa})`, txt: "Reporte enviado" }] });
  casos.push({ tipo: "sucio", lugar: "Rancho / BBQ", contraCasa: "", donde: "Rancho 2", descripcion: "Dejaron la parrilla sucia y basura en la mesa.", foto: "", casa: r2.casa, nombre: r2.nombre, resId: "ej-" + r2.cedula, prioridad: "baja",
    estado: "en_atencion", agente: "Oficial Mora", resultado: "", resolucion: "", problema: false, problemaNota: "", calificacion: null, comentarioRes: "", creado: ahora - 28 * 60000, atendido: ahora - 14 * 60000, cerrado: null,
    historial: [{ t: ahora - 28 * 60000, quien: `${r2.nombre} (casa ${r2.casa})`, txt: "Reporte enviado" }, { t: ahora - 14 * 60000, quien: "Oficial Mora", txt: "Va en camino" }] });
  // dos casos escalados esperando a la administración
  const esc1 = (t, lugar, contra, txt, nota, rep, horas, ag) => { const cr = ahora - horas * 3600e3, at = cr + 9 * 60000, ce = at + 20 * 60000;
    return { tipo: t, lugar, contraCasa: contra, donde: "", descripcion: txt, foto: "", casa: rep.casa, nombre: rep.nombre, resId: "ej-" + rep.cedula, prioridad: tipo(t)[3],
      estado: "cerrado", agente: ag, resultado: "escalado", resolucion: "Se pasó a la administración para seguimiento.", problema: false, problemaNota: "", calificacion: null, comentarioRes: "",
      creado: cr, atendido: at, cerrado: ce, escalado: "pendiente", escaladoNota: nota, escaladoPor: ag, escaladoT: ce, adminNota: "",
      historial: [{ t: cr, quien: `${rep.nombre} (casa ${rep.casa})`, txt: "Reporte enviado" }, { t: at, quien: ag, txt: "Va en camino" }, { t: ce, quien: ag, txt: "Cerrado: Pasado a administración" }, { t: ce + 60000, quien: ag, txt: "Escalado a administración: " + nota }] }; };
  casos.push(esc1("mascotas", "Una casa", "14", "El perro de la casa 14 está suelto otra vez y se metió al jardín.", "Es la cuarta vez este mes. Ya se le llamó la atención y no cambia. Pedimos que la administración hable con el dueño.", residentes[2], 30, "Oficial Rojas"));
  casos.push(esc1("parqueo", "Una casa", "8", "La visita de la casa 8 se parquea en mi espacio todos los fines de semana.", "El residente de la casa 8 no colabora con seguridad. Se necesita aplicar el reglamento de parqueo.", residentes[5], 52, "Oficial Mora"));
  return { casos, residentes, reservas: generarReservas(residentes), ...extrasEjemplo() };
}
function generarReservas(rs){
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const dia = n => { const d = new Date(hoy); d.setDate(d.getDate() + n); return isoL(d); };
  const sab = (6 - hoy.getDay() + 7) % 7, R = (p, n, f, a, b, nota) => ({ rancho: n, fecha: f, ini: a * 60, fin: b * 60, casa: p.casa, nombre: p.nombre, resId: "ej-" + p.cedula, nota });
  return [R(rs[0], 3, dia(sab), 13, 16, "Cumpleaños de mi hija"), R(rs[5], 1, dia(sab), 10, 14, "Almuerzo familiar"), R(rs[1], 2, dia(sab + 1), 12, 17, "Parrillada"),
    R(rs[6], 1, dia(1), 18, 21, "Reunión de amigos"), R(rs[4], 2, dia(0), 16, 19, "Café con vecinas"), R(rs[3], 3, dia(3), 9, 12, "Clase de yoga"),
    R(rs[7], 2, dia(-5), 12, 16, "Almuerzo"), R(rs[8], 3, dia(-2), 14, 18, "Cumpleaños")];
}
let sembrando = false;
function extrasEjemplo(){
  const H = 36e5, D = 864e5, ahora = Date.now(), en = n => { const d = new Date(); d.setDate(d.getDate() + n); return isoL(d); };
  let fiesta = `${new Date().getFullYear()}-12-13`; if (fiesta < hoyL()) fiesta = en(30);
  const nt = (tipo, titulo, fecha, texto, hrs, fijada = false) => ({ tipo, titulo, fecha, texto, foto: "", fijada, creado: ahora - hrs * H });
  const noticias = [
    nt("importante", "Corte de agua programado", en(2), "El AyA nos informó que habrá un corte de agua de 8:00 a. m. a 2:00 p. m. por trabajos en la tubería principal.\nLes recomendamos guardar agua desde la noche anterior.", 3, true),
    nt("evento", "Fiesta de fin de año del condominio", fiesta, "¡Están todos invitados! Será en el Rancho 2 a partir de las 4:00 p. m. Habrá música, inflables para los chiquitos e intercambio de regalos opcional (₡5.000).\nPor favor confirmen su asistencia con la administración.", 26),
    nt("mant", "Mantenimiento de la piscina", en(5), "La piscina va a estar cerrada todo el día por limpieza profunda y revisión de las bombas. Disculpen las molestias.", 50),
    nt("aviso", "Recordatorio: cuota de mantenimiento", "", "La cuota del mes vence el día 10. Pueden pagar por SINPE Móvil o transferencia y enviar el comprobante a la administración.", 96),
    nt("aviso", "Nuevo horario del portón de visitas", "", "A partir de este mes, después de las 10:00 p. m. las visitas deben anunciarse en la caseta de seguridad. Gracias por su colaboración.", 190)];
  const em = (nombre, categoria, descripcion, casa, resNombre, tel, estado, dias) => ({ nombre, categoria, descripcion, tel, foto: "", casa, resNombre, resId: "", estado, motivo: "", creado: ahora - dias * D, ...(estado === "aprobado" ? { revisado: ahora - (dias - .5) * D } : {}) });
  const emprend = [
    em("Repostería Doña Patri", "comida", "Queques, tres leches, galletas y bocadillos por encargo para cumpleaños y reuniones. Pedidos con 2 días de anticipación.", "21", "Patricia Rojas", "87012121", "aprobado", 12),
    em("Clases de inglés con Andrea", "clases", "Clases de inglés para niños y adultos, presenciales o virtuales. Ayuda con tareas y preparación para exámenes.", "8", "Andrea Solano", "87020808", "aprobado", 10),
    em("Electricista Esteban Vargas", "servicios", "Instalaciones eléctricas, cambio de tomas, lámparas y breakers, revisión de cortos. Atiendo dentro del condominio el mismo día.", "27", "Esteban Vargas", "87032727", "aprobado", 9),
    em("Huevos de gallina libre", "productos", "Huevos frescos de gallinas criadas libres. Cartón de 30 a ₡4.500, se los llevo hasta la casa.", "40", "Jorge Chaves", "87044040", "aprobado", 6),
    em("Uñas Sofi", "belleza", "Manicure, pedicure y uñas acrílicas a domicilio dentro del condominio. Con cita.", "45", "Sofía Castro", "87054545", "pendiente", 1),
    em("Paseo de perros", "mascotas", "Saco a pasear a tu perro en las mañanas o en las tardes, 30 o 60 minutos. También cuido mascotas en vacaciones.", "33", "Daniela Mora", "87063333", "pendiente", .2)];
  return { noticias, emprend, visitas: visitasEjemplo() };
}
function visitasEjemplo(){
  const ahora = Date.now(), M = 60000, en = n => { const d = new Date(); d.setDate(d.getDate() + n); return isoL(d); };
  const hoyA = (h, m = 0) => { const d = new Date(); d.setHours(h, m, 0, 0); return Math.min(d.getTime(), ahora - 5 * M); };
  const diaA = (n, h, m = 0) => { const d = new Date(); d.setDate(d.getDate() + n); d.setHours(h, m, 0, 0); return d.getTime(); };
  const P = { ric: ["18", RICARDO.nombre, "ej-" + RICARDO.cedula], mar: ["12", "María Fernández", "ej-101110111"], car: ["5", "Carlos Jiménez", "ej-202220222"], and: ["8", "Andrea Solano", "ej-303330333"],
    pat: ["21", "Patricia Rojas", "ej-505550555"], est: ["27", "Esteban Vargas", "ej-606660666"], dan: ["33", "Daniela Mora", "ej-707770777"], jor: ["40", "Jorge Chaves", "ej-808880888"] };
  const V = (q, nombre, tipo, placa, fecha, hasta, hh, nota, codigo, estado, ingreso, salida, creado, extra = {}) => { const [casa, resNombre, resId] = P[q] || [q, "", ""];
    const mov = [...(ingreso ? [{ t: ingreso, tipo: "in", of: "Oficial Mora" }] : []), ...(salida ? [{ t: salida, tipo: "out", of: "Oficial Rojas" }] : [])];
    return { nombre, tipo, placa, fecha, hasta: hasta || fecha, hora: hh, nota, codigo, casa, resNombre, resId, estado, ingreso: ingreso || null, salida: salida || null, mov, registradaPor: "", creado, ...extra }; };
  const hoy = hoyL();
  return [
    // Ricardo (casa 18): para ver la demo como residente
    V("ric", "Técnico de Kölbi", "servicio", "CL 245871", hoy, "", "14:00", "Viene a instalar el internet", "4827", "autorizada", null, null, ahora - 3 * 3600e3),
    V("ric", "Rosa Montoya (mamá)", "visita", "BRM 512", hoy, "", "", "", "3190", "adentro", ahora - 52 * M, null, ahora - 26 * 3600e3),
    V("ric", "Pizza Hut", "entrega", "", en(-1), "", "19:30", "", "7712", "salio", diaA(-1, 19, 41), diaA(-1, 19, 49), diaA(-1, 19, 5)),
    V("ric", "Cumpleaños de Sofi (5 invitados)", "visita", "", en(3), "", "15:00", "Cumpleaños en el Rancho 3", "6605", "autorizada", null, null, ahora - 5 * 3600e3),
    // otros residentes
    V("mar", "Ana Lucía Pérez (niñera)", "visita", "", en(-10), en(20), "07:00", "Viene de lunes a viernes", "5521", "adentro", hoyA(7, 4), null, diaA(-11, 18), { mov: [{ t: diaA(-1, 7, 2), tipo: "in", of: "Oficial Vargas" }, { t: diaA(-1, 16, 5), tipo: "out", of: "Oficial Mora" }, { t: hoyA(7, 4), tipo: "in", of: "Oficial Vargas" }] }),
    V("car", "Mudanzas Express", "servicio", "C 158233", hoy, "", "10:00", "Camión grande, va a la casa 5", "2468", "salio", hoyA(9, 48), hoyA(12, 30), ahora - 22 * 3600e3),
    V("and", "Uber · Toyota Corolla gris", "transporte", "BTV 908", hoy, "", "", "", "9034", "autorizada", null, null, ahora - 12 * M),
    V("pat", "Amigas del café", "visita", "", hoy, "", "16:00", "Son 3 personas", "1188", "autorizada", null, null, ahora - 4 * 3600e3),
    V("est", "Rappi", "entrega", "", hoy, "", "", "", "", "salio", hoyA(11, 15), hoyA(11, 22), hoyA(11, 15), { registradaPor: "Oficial Mora" }),
    V("dan", "Veterinaria a domicilio", "servicio", "MVR 330", en(1), "", "09:00", "Vacunas del perro", "7350", "autorizada", null, null, ahora - 2 * 3600e3),
    V("jor", "Familia Chaves Ulate", "visita", "BKP 774", en(-2), "", "12:00", "Almuerzo familiar", "6011", "salio", diaA(-2, 12, 10), diaA(-2, 18, 40), diaA(-3, 20)),
    V("mar", "Fontanero Don Luis", "servicio", "", en(-4), "", "08:00", "", "3377", "salio", diaA(-4, 8, 20), diaA(-4, 10, 5), diaA(-5, 17)),
    V("est", "Amigos del fútbol", "visita", "", en(-6), "", "20:00", "", "8420", "salio", diaA(-6, 20, 15), diaA(-6, 23, 50), diaA(-6, 14)),
    V("car", "Juan Carlos (primo)", "visita", "", en(-3), "", "", "Al final no vino", "4410", "cancelada", null, null, diaA(-4, 9)),
    V("dan", "Correos de Costa Rica", "entrega", "", en(-1), "", "", "", "", "salio", diaA(-1, 10, 30), diaA(-1, 10, 36), diaA(-1, 10, 30), { registradaPor: "Oficial Rojas" })];
}
async function asegurarEjemplo(casos){
  if (casos.length || sembrando || lsGet("condo-sembrado-vacio", false)) return false;
  sembrando = true;
  try { const e = generarEjemplo(); await Datos.sembrar(e.casos, e.residentes, e.reservas, e.noticias, e.emprend, e.visitas); return true; } catch (x) { console.warn(x); return false; } finally { sembrando = false; }
}

/* ===================== DETALLE DE UN CASO ===================== */
function detalleHTML(c, { verReportante = true, esquina = "" } = {}){
  const [, ic, nom] = tipo(c.tipo);
  return `<div class="hoja-cab"><div><span class="est ${c.estado}">${ESTADOS[c.estado]}</span>${c.escalado === "pendiente" ? ' <span class="est esc">Escalado</span>' : ""}<h3 style="margin-top:6px">${ic} ${esc(nom)} · #${c.num}</h3></div>
      <div class="esquina">${esquina}<button class="x" type="button" data-cerrar aria-label="Cerrar">×</button></div></div>
    <dl class="datos"><dt>Dónde</dt><dd>${esc(donde(c)) || "—"}</dd>
      ${verReportante ? `<dt>Reportó</dt><dd>${esc(c.nombre || "Residente")} · Casa ${esc(c.casa)}</dd>` : ""}
      <dt>Hora</dt><dd>${fecha(c.creado)} (${hace(c.creado)})</dd>
      <dt>Prioridad</dt><dd>${c.prioridad === "alta" ? "Alta" : c.prioridad === "media" ? "Media" : "Baja"}</dd>
      ${c.agente ? `<dt>Atiende</dt><dd>${esc(c.agente)}</dd>` : ""}
      ${c.atendido ? `<dt>Respuesta</dt><dd>${dur(min(c.creado, c.atendido))} desde el reporte</dd>` : ""}</dl>
    <p style="margin:12px 0 0;font-size:15.5px">${esc(c.descripcion)}</p>
    ${c.foto ? `<img class="foto-caso" src="${esc(c.foto)}" alt="Foto del reporte">` : ""}
    ${c.estado === "cerrado" ? `<div class="res-box${c.problema ? " prob" : ""}"><b>${esc(resultado(c.resultado))}</b>${c.resolucion ? `<br>${esc(c.resolucion)}` : ""}
      ${c.problema ? `<br><b>Hubo problemas:</b> ${esc(c.problemaNota || "Sí")}` : ""}<br><small>Cerrado ${fecha(c.cerrado)} · ${dur(min(c.creado, c.cerrado))} en total</small>
      ${c.calificacion ? `<br><small>Calificación del residente: ${"★".repeat(c.calificacion)}${"☆".repeat(5 - c.calificacion)}${c.comentarioRes ? ` · “${esc(c.comentarioRes)}”` : ""}</small>` : ""}</div>` : ""}
    ${c.escalado ? `<div class="esc-box ${c.escalado}"><b>${c.escalado === "pendiente" ? "Pasado a la administración" : "Resuelto por la administración"}</b>
      ${verReportante ? `<br>${esc(c.escaladoNota)}<br><small>Escaló ${esc(c.escaladoPor)} · ${fecha(c.escaladoT)}</small>` : c.escalado === "pendiente" ? "<br>La administración le dará seguimiento." : ""}
      ${c.adminNota ? `<br><b>Administración:</b> ${esc(c.adminNota)}` : ""}</div>` : ""}
    <h3 style="font-size:15px;margin-top:16px">Historial</h3>
    <ul class="linea-t">${(c.historial || []).map(h => `<li class="${h.quien === "Administración" ? "adm" : ""}">${esc(h.txt)}<small>${esc(h.quien)} · ${fecha(h.t)}</small></li>`).join("")}</ul>`;
}
const filaCaso = (c, { verReportante = true } = {}) => { const [, ic, nom] = tipo(c.tipo), tarde = c.estado !== "cerrado" && min(c.creado, Date.now()) > 15;
  return `<button type="button" class="caso ${c.estado}${c.prioridad === "alta" && c.estado !== "cerrado" ? " alta" : ""}" data-caso="${esc(c.id)}">
    <span class="ic" aria-hidden="true">${ic}</span>
    <span><b>${esc(nom)} · ${esc(donde(c)) || "Sin lugar"}</b><span class="meta">#${c.num}${verReportante ? ` · Casa ${esc(c.casa)}` : ""} · ${esc(c.descripcion)}</span></span>
    <span class="der">${c.escalado === "pendiente" ? '<span class="est esc">Escalado</span>' : ""}<span class="est ${c.estado}">${ESTADOS[c.estado]}</span><span class="tiempo${tarde ? " tarde" : ""}">${hace(c.creado)}</span></span></button>`; };

/* ===================== INGRESO DE SEGURIDAD Y ADMINISTRACIÓN ===================== */
function loginUsuario(rol, titulo, ico, alEntrar){
  app.innerHTML = `${encIngreso(titulo)}
    <main class="wrap"><form class="caja login" id="fLogin" novalidate><div class="ico">${ico}</div><h2 style="margin-top:6px">${titulo}</h2>
      <div class="campo"><label for="lu">Usuario</label><input id="lu" autocomplete="username" autocapitalize="none"></div>
      <div class="campo"><label for="lc">Contraseña</label><input id="lc" type="password" autocomplete="current-password"></div>
      <p class="err" id="le"></p><button class="btn pri bloque" type="submit">Entrar</button>
      <div class="demo-claves"><b>Demo:</b> usuario <b>${USUARIOS[rol].usuario}</b> · contraseña <b>${USUARIOS[rol].clave}</b></div></form></main>`;
  $("#fLogin").addEventListener("submit", e => { e.preventDefault();
    const u = $("#lu").value.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if ((u === USUARIOS[rol].usuario || USUARIOS[rol].otros.includes(u)) && $("#lc").value === USUARIOS[rol].clave) { lsSet("condo-ses-" + rol, { ok: true }); alEntrar(); }
    else $("#le").textContent = "Usuario o contraseña incorrectos."; });
  setTimeout(() => $("#lu").focus(), 50);
}

/* ===================== PANEL DEL RESIDENTE ===================== */
function residente(){
  const ses = lsGet("condo-ses-residente", null);
  const act = location.hash.match(/^#activar=([a-z0-9-]{6,40})$/i);
  if (act) return activar(act[1]);
  if (!ses || !ses.id) return loginResidente();
  let casos = [], sel = null, foto = "", antes = {};
  let rtab = location.hash === "#ranchos" ? "ran" : location.hash === "#visitas" ? "vis" : lsGet("condo-res-tab", "not");
  if (!["not", "rep", "vis", "ran", "emp"].includes(rtab)) rtab = "not";
  app.innerHTML = `${encabezado(`Casa ${esc(ses.casa)} · ${esc(ses.nombre)}`)}
    <main class="wrap">
      <div class="tabs" id="rTabs">${[["not","Noticias<span class=\"n\" id=\"nNt\" hidden></span>"],["rep","Reportes"],["vis","Visitas"],["ran","Ranchos"],["emp","Emprendimientos"]].map(([k, l]) => `<button type="button" data-rt="${k}" aria-pressed="${rtab === k}">${l}</button>`).join("")}</div>
      <div id="vNot" ${rtab === "not" ? "" : "hidden"}></div>
      <div id="vEmp" ${rtab === "emp" ? "" : "hidden"}></div>
      <div id="vVis" ${rtab === "vis" ? "" : "hidden"}></div>
      <div id="vRan" ${rtab === "ran" ? "" : "hidden"}></div>
      <div id="vRep" ${rtab === "rep" ? "" : "hidden"}>
      <section class="caja"><h2>Reportar un problema</h2><p class="nota" style="margin-top:-4px">Tu reporte le llega al instante al oficial de seguridad. Solo lo ven seguridad y la administración.</p>
        <div class="tipos" id="tipos" style="margin-top:12px">${TIPOS.map(([k, ic, n]) => `<button type="button" data-tipo="${k}" aria-pressed="false"><i aria-hidden="true">${ic}</i>${n}</button>`).join("")}</div>
        <form id="fRep" hidden novalidate>
          <div class="fila2"><div class="campo"><label for="rl">¿Dónde?</label><select id="rl">${LUGARES.map(l => `<option>${l}</option>`).join("")}</select></div>
            <div class="campo" id="rcw"><label for="rc">Número de casa</label><input id="rc" inputmode="numeric" maxlength="6" placeholder="Ej.: 27"></div>
            <div class="campo" id="rdw" hidden><label for="rd">¿Dónde exactamente?</label><input id="rd" maxlength="60" placeholder="Ej.: Rancho 2"></div></div>
          <div class="campo"><label for="rx">¿Qué está pasando?</label><textarea id="rx" maxlength="400" placeholder="Contanos con detalle"></textarea></div>
          <div class="campo"><label>Foto (opcional)</label><div class="foto-in"><label class="btn sm" style="cursor:pointer">Agregar foto<input type="file" id="rf" accept="image/*" hidden></label><span id="rfv"></span></div></div>
          <p class="err" id="re"></p><button class="btn pri bloque" type="submit" id="rb">Enviar reporte</button>
        </form></section>
      <section class="caja"><h2>Mis reportes</h2><div class="lista" id="mis"></div></section></div>
    </main>`;
  $("#rTabs").addEventListener("click", e => { const b = e.target.closest("[data-rt]"); if (!b) return; rtab = b.dataset.rt; lsSet("condo-res-tab", rtab);
    document.querySelectorAll("#rTabs button").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
    ["not", "rep", "vis", "ran", "emp"].forEach(k => $("#v" + mayus(k)).hidden = rtab !== k); if (rtab === "not") verNoticias(); });
  panelRanchos(ses, $("#vRan"));
  panelVisitasRes(ses, $("#vVis"));
  const verNoticias = panelNoticiasRes($("#vNot"), () => rtab === "not");
  panelEmpRes(ses, $("#vEmp"));
  const pintarLugar = () => { const casa = $("#rl").value === "Una casa"; $("#rcw").hidden = !casa; $("#rdw").hidden = casa; };
  $("#rl").addEventListener("change", pintarLugar);
  $("#tipos").addEventListener("click", e => { const b = e.target.closest("[data-tipo]"); if (!b) return; sel = b.dataset.tipo;
    document.querySelectorAll("#tipos [data-tipo]").forEach(x => x.setAttribute("aria-pressed", String(x === b))); $("#fRep").hidden = false;
    const sug = { ruido: "Una casa", mascotas: "Calle interna", parqueo: "Parqueo de visitas", basura: "Zona de basura", sucio: "Rancho / BBQ", dano: "Parque infantil", averia: "Calle interna", velocidad: "Calle interna", seguridad: "Portón / entrada", otro: "Otro" }[sel];
    $("#rl").value = sug; pintarLugar(); $("#rx").focus(); });
  $("#rf").addEventListener("change", async e => { const f = e.target.files[0]; if (!f) return;
    try { foto = await comprimir(f); $("#rfv").innerHTML = `<img src="${foto}" alt="Foto adjunta"> <button class="btn sm" type="button" id="rfq">Quitar</button>`; $("#rfq").onclick = () => { foto = ""; $("#rfv").innerHTML = ""; }; } catch { aviso("No se pudo leer la foto."); } });
  $("#fRep").addEventListener("submit", async e => { e.preventDefault();
    const lugar = $("#rl").value, txt = $("#rx").value.trim(), contra = Datos.soloDigitos($("#rc").value);
    if (!sel) return; if (txt.length < 5) { $("#re").textContent = "Contanos qué está pasando."; $("#rx").focus(); return; }
    $("#re").textContent = ""; $("#rb").disabled = true;
    try { const r = await Datos.crear({ tipo: sel, lugar, contraCasa: lugar === "Una casa" ? contra : "", donde: lugar === "Una casa" ? "" : $("#rd").value.trim(), descripcion: txt, foto,
        casa: ses.casa, nombre: ses.nombre, resId: ses.id, prioridad: tipo(sel)[3], agente: "", resultado: "", resolucion: "", problema: false, problemaNota: "", calificacion: null, comentarioRes: "", atendido: null, cerrado: null });
      aviso(`Reporte #${r.num} enviado a seguridad`); sel = null; foto = ""; $("#fRep").reset(); $("#fRep").hidden = true; $("#rfv").innerHTML = "";
      document.querySelectorAll("#tipos [data-tipo]").forEach(x => x.setAttribute("aria-pressed", "false"));
    } catch { $("#re").textContent = "No se pudo enviar. Revisá tu conexión."; }
    $("#rb").disabled = false; });
  const pintar = () => {
    const mios = casos.filter(c => c.resId === ses.id);
    $("#mis").innerHTML = mios.length ? mios.map(c => filaCaso(c, { verReportante: false })).join("") : `<p class="vacio">Todavía no has hecho reportes.</p>`;
  };
  $("#mis").addEventListener("click", e => { const b = e.target.closest("[data-caso]"); if (b) verMiCaso(b.dataset.caso); });
  function verMiCaso(id){
    const c = casos.find(x => x.id === id); if (!c) return;
    hoja(detalleHTML(c, { verReportante: false }) + (c.estado === "cerrado" && !c.calificacion ? `<div class="caja"><h2 style="font-size:16px">¿Cómo te atendieron?</h2>
      <div class="estrellas" id="est">${[1,2,3,4,5].map(n => `<button type="button" data-e="${n}" aria-label="${n} estrellas">★</button>`).join("")}</div>
      <div class="campo"><label for="ecm">Comentario (opcional)</label><input id="ecm" maxlength="150"></div><button class="btn pri" type="button" id="eok" disabled style="margin-top:10px">Enviar calificación</button></div>` : ""), (h, cerrar) => {
      let n = 0; const est = $("#est", h); if (!est) return;
      est.addEventListener("click", e => { const b = e.target.closest("[data-e]"); if (!b) return; n = +b.dataset.e; est.querySelectorAll("button").forEach(x => x.classList.toggle("si", +x.dataset.e <= n)); $("#eok", h).disabled = false; });
      $("#eok", h).addEventListener("click", async () => { try { await Datos.actualizar(c.id, { calificacion: n, comentarioRes: $("#ecm", h).value.trim().slice(0, 150) }, { quien: ses.nombre, txt: `Calificó la atención: ${n} de 5` }); aviso("¡Gracias por tu calificación!"); cerrar(); } catch { aviso("No se pudo enviar."); } });
    });
  }
  Datos.escuchar(lista => {
    casos = lista;
    lista.filter(c => c.resId === ses.id).forEach(c => { const a = antes[c.id], nAdm = (c.historial || []).filter(h => h.quien === "Administración").length;
      if (a && antes["adm" + c.id] != null && nAdm > antes["adm" + c.id]) aviso(`La administración respondió tu reporte #${c.num}`);
      antes["adm" + c.id] = nAdm;
      if (a && a !== c.estado) aviso(c.estado === "en_atencion" ? `${c.agente || "Seguridad"} va en camino (#${c.num})` : c.estado === "cerrado" ? `Tu reporte #${c.num} se cerró: ${resultado(c.resultado)}` : "");
      antes[c.id] = c.estado; });
    pintar();
  }, () => { $("#mis").innerHTML = `<p class="vacio">No se pudo conectar. Revisá tu conexión.</p>`; }).catch(() => {});
  setInterval(pintar, 60000);
}
function panelRanchos(ses, cont){
  let reservas = [], rSel = 1, fSel = hoyL(), a = null, b = null, nota = "", confirmar = null, guardando = false;
  cont.innerHTML = `<section class="caja"><h2>Reservar un rancho</h2><p class="nota" style="margin-top:-4px">Se reservan de 8:00 a. m. a 9:00 p. m., hasta 6 horas seguidas. Todos los residentes ven qué horas ya están apartadas, y seguridad y la administración reciben la reserva.</p>
      <h3 class="sub">1. ¿Cuál rancho?</h3><div class="ranchos" id="rSel"></div>
      <h3 class="sub">2. ¿Qué día?</h3><div class="dias-r" id="rDias"></div>
      <h3 class="sub">3. ¿A qué hora empezás?</h3><p class="nota" style="margin:-4px 0 8px">Tocá la hora de inicio y después escogé abajo cuántas horas lo vas a usar.</p><div class="bloques" id="rHoras"></div>
      <div id="rForm"></div></section>
    <section class="caja"><h2 id="rDiaT"></h2><div id="rDia"></div></section>
    <section class="caja"><h2>Mis reservas</h2><div class="lista" id="rMis"></div></section>`;
  const act = () => activasDe(reservas, rSel, fSel);
  function pintarForm(){
    const f = $("#rForm", cont);
    if (a === null) { f.innerHTML = ""; return; }
    const durs = []; for (let n = 1; n <= R_MAX / 60; n++) { const fin = a + n * 60; durs.push([n, fin <= R_FIN && !act().some(r => r.ini < fin && a < r.fin)]); }
    f.innerHTML = `<h3 class="sub">4. ¿Cuántas horas?</h3><div class="durs">${durs.map(([n, ok]) => `<button type="button" data-dur="${n}" aria-pressed="${b - a === n * 60}" ${ok ? "" : "disabled"}>${n} ${n === 1 ? "hora" : "horas"}<small>hasta ${h12(a + n * 60)}</small></button>`).join("")}</div>
      ${durs.some(([, ok]) => !ok) ? `<p class="nota">Las opciones apagadas chocan con otra reserva o pasan de las 9:00 p. m.</p>` : ""}
      <div class="res-box" style="margin-top:14px"><b>${rancho(rSel).nombre} · ${diaTxt(fSel, true)}</b><br>De ${h12(a)} a ${h12(b)} (${(b - a) / 60} ${b - a === 60 ? "hora" : "horas"})</div>
      <div class="campo"><label for="rNota">¿Para qué es? (opcional)</label><input id="rNota" maxlength="60" placeholder="Ej.: cumpleaños, almuerzo familiar" value="${esc(nota)}"></div>
      <p class="err" id="rErr"></p><button class="btn pri bloque" type="button" id="rOk">Reservar ${rancho(rSel).nombre}</button>`;
    $("#rNota", f).oninput = e => nota = e.target.value;
    $("#rOk", f).onclick = async () => {
      $("#rOk", f).disabled = true; guardando = true;
      const r = { rancho: rSel, fecha: fSel, ini: a, fin: b, casa: ses.casa, nombre: ses.nombre, resId: ses.id, nota: nota.trim().slice(0, 60) };
      try { await Datos.reservar(r); guardando = false;
        aviso(`${rancho(r.rancho).nombre} reservado: ${diaTxt(r.fecha, true)}, ${h12(r.ini)} – ${h12(r.fin)}`); a = b = null; nota = ""; pintar(); pintarForm();
      } catch (x) { guardando = false; $("#rErr", f).textContent = x.message === "ocupado" ? "Alguien acaba de reservar alguna de esas horas. Escogé otras." : "No se pudo reservar. Revisá tu conexión."; $("#rOk", f).disabled = false; }
    };
  }
  function pintar(){
    const hoy = hoyL(), ahora = minAhora();
    $("#rSel", cont).innerHTML = RANCHOS.map(R => `<button type="button" data-r="${R.n}" aria-pressed="${R.n === rSel}"><b>${R.nombre}</b><small>${esc(R.desc)}</small></button>`).join("");
    let dias = ""; for (let i = 0; i < R_DIAS; i++) { const d = new Date(); d.setDate(d.getDate() + i); const f = isoL(d), n = activasDe(reservas, rSel, f).length;
      dias += `<button type="button" data-f="${f}" aria-pressed="${f === fSel}"><span>${i === 0 ? "Hoy" : i === 1 ? "Mañana" : mayus(d.toLocaleDateString("es-CR", { weekday: "short" }).replace(".", ""))}</span><b>${d.getDate()}</b><i>${n ? `${n} reserva${n === 1 ? "" : "s"}` : ""}</i></button>`; }
    $("#rDias", cont).innerHTML = dias;
    let bl = ""; for (let m = R_INI; m < R_FIN; m += 60) {
      const oc = act().find(r => r.ini < m + 60 && m < r.fin), pas = fSel === hoy && m < ahora, sel = a !== null && m >= a && m < b;
      const cl = oc ? "ocup" + (oc.resId === ses.id ? " mia" : "") : pas ? "pas" : sel ? "sel" : "lib";
      bl += `<button type="button" class="${cl}" data-h="${m}" ${oc || pas ? "disabled" : ""}><b>${h12(m)}</b><span>${oc ? (oc.resId === ses.id ? "Tu reserva" : "Reservado") : pas ? "Ya pasó" : sel ? (m === a ? "✓ Inicio" : "✓ Elegida") : "Libre"}</span></button>`; }
    $("#rHoras", cont).innerHTML = bl;
    $("#rDiaT", cont).textContent = `Así están los ranchos · ${diaTxt(fSel, true)}`;
    $("#rDia", cont).innerHTML = resumenDia(reservas, fSel, { yo: ses.id, privado: true });
    const mias = reservas.filter(r => r.resId === ses.id).sort((x, y) => (y.fecha + y.ini).localeCompare(x.fecha + x.ini));
    const futura = r => r.estado === "activa" && (r.fecha > hoy || (r.fecha === hoy && r.fin > ahora));
    $("#rMis", cont).innerHTML = mias.length ? mias.map(r => `<div class="caso" style="cursor:default;${futura(r) ? "" : "opacity:.6"}"><span class="ic">${I.tent}</span>
      <span><b>${rancho(r.rancho).nombre} · ${diaTxt(r.fecha)}</b><span class="meta">${horario(r)}${r.nota ? " · " + esc(r.nota) : ""}</span></span>
      <span class="der">${r.estado === "cancelada" ? `<span class="est nuevo">Cancelada</span>` : futura(r) ? `<button class="btn sm" type="button" data-cancelar="${esc(r.id)}">${confirmar === r.id ? "¿Seguro? Tocá otra vez" : "Cancelar"}</button>` : `<span class="est cerrado">Usada</span>`}</span></div>`).join("")
      : `<p class="vacio">Todavía no has reservado ningún rancho.</p>`;
  }
  cont.addEventListener("click", async e => {
    const r = e.target.closest("[data-r]"); if (r) { rSel = +r.dataset.r; a = b = null; pintar(); pintarForm(); return; }
    const f = e.target.closest("[data-f]"); if (f) { fSel = f.dataset.f; a = b = null; pintar(); pintarForm(); return; }
    const h = e.target.closest("[data-h]");
    if (h && !h.disabled) { const m = +h.dataset.h;
      if (a === m) a = b = null;
      else { const dur = a !== null ? b - a : 60, fin = m + dur;
        a = m; b = fin <= R_FIN && !act().some(r => r.ini < fin && m < r.fin) ? fin : m + 60; }
      pintar(); pintarForm(); if (a !== null) $("#rForm", cont).scrollIntoView({ behavior: "smooth", block: "nearest" }); return; }
    const d = e.target.closest("[data-dur]");
    if (d && !d.disabled) { b = a + +d.dataset.dur * 60; pintar(); pintarForm(); return; }
    const c = e.target.closest("[data-cancelar]");
    if (c) { const id = c.dataset.cancelar; if (confirmar !== id) { confirmar = id; pintar(); setTimeout(() => { if (confirmar === id) { confirmar = null; pintar(); } }, 4000); return; }
      confirmar = null; const rr = reservas.find(x => x.id === id);
      try { await Datos.cancelarReserva(rr, `${ses.nombre} (casa ${ses.casa})`); aviso("Reserva cancelada. El rancho quedó libre otra vez."); } catch { aviso("No se pudo cancelar."); } }
  });
  Datos.escucharReservas(l => { reservas = l;
    if (!guardando && a !== null && act().some(r => r.ini < b && a < r.fin)) { a = b = null; aviso("Alguien acaba de reservar esas horas. Escogé otras."); pintarForm(); }
    pintar(); }, () => { $("#rDia", cont).innerHTML = `<p class="vacio">No se pudo conectar. Revisá tu conexión.</p>`; }).catch(() => {});
  pintar(); setInterval(pintar, 60000);
}
function panelVisitasRes(ses, cont){
  let lista = [], tSel = "visita", dSel = "hoy", conf = null, antes = null;
  cont.innerHTML = `<section class="caja"><h2>Autorizar una visita</h2><p class="nota" style="margin-top:-4px">Seguridad recibe la autorización al instante. Le pasás el código a tu visita y la dejan entrar sin tener que llamarte.</p>
      <form id="fVis" novalidate>
        <div class="campo"><label>¿Quién viene?</label><div class="ops" id="vTipos">${VI_TIPOS.map(([k, ic, n]) => `<button type="button" data-vt="${k}" aria-pressed="${k === tSel}">${ic} ${n}</button>`).join("")}</div></div>
        <div class="fila2"><div class="campo"><label for="vN">Nombre</label><input id="vN" maxlength="60" placeholder="Ej.: Rosa Montoya"></div>
          <div class="campo"><label for="vP">Placa (opcional)</label><input id="vP" maxlength="10" autocapitalize="characters" placeholder="Ej.: BRM 512"></div></div>
        <div class="campo"><label>¿Qué día?</label><div class="ops" id="vDias"><button type="button" data-vd="hoy" aria-pressed="true">Hoy</button><button type="button" data-vd="man" aria-pressed="false">Mañana</button><button type="button" data-vd="otro" aria-pressed="false">Otro día</button><button type="button" data-vd="varios" aria-pressed="false">Varios días</button></div></div>
        <div class="fila2" id="vFechas" hidden><div class="campo"><label for="vF">Desde</label><input id="vF" type="date"></div><div class="campo" id="vHw"><label for="vH">Hasta</label><input id="vH" type="date"></div></div>
        <p class="nota" id="vVarN" hidden>Para quien viene seguido: niñera, empleada, jardinero. Puede entrar y salir todos los días de ese período con el mismo código.</p>
        <div class="fila2"><div class="campo"><label for="vHo">Hora aproximada (opcional)</label><input id="vHo" type="time"></div>
          <div class="campo"><label for="vNo">Nota para seguridad (opcional)</label><input id="vNo" maxlength="150" placeholder="Ej.: Son 3 personas"></div></div>
        <p class="err" id="vE"></p><button class="btn pri bloque" type="submit" id="vB">Autorizar visita</button></form><div id="vPase"></div></section>
    <section class="caja"><h2>Mis visitas</h2><div class="lista" id="vMis"></div></section>`;
  const f = id => $(id, cont);
  const pintarDias = () => { f("#vFechas").hidden = !["otro", "varios"].includes(dSel); f("#vHw").hidden = dSel !== "varios"; f("#vVarN").hidden = dSel !== "varios";
    f("#vDias").querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", String(x.dataset.vd === dSel))); };
  f("#vF").min = f("#vH").min = hoyL(); f("#vF").value = hoyL();
  const pase = v => { const box = f("#vPase");
    box.innerHTML = `<div class="pase"><span>Código de entrada</span><b>${esc(v.codigo)}</b><small>${esc(v.nombre)} · Casa ${esc(v.casa)} · ${esc(viCuando(v))}</small>
      <div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center;margin-top:10px"><a class="btn sm wa" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(mensajeVisita(v))}">Enviar por WhatsApp</a><button class="btn sm" type="button" id="vCp">Copiar mensaje</button><button class="btn sm" type="button" id="vX">Listo</button></div></div>`;
    f("#vCp").onclick = async () => { try { await navigator.clipboard.writeText(mensajeVisita(v).replace(/\*/g, "")); aviso("Mensaje copiado"); } catch { aviso("Código: " + v.codigo); } };
    f("#vX").onclick = () => box.innerHTML = ""; box.scrollIntoView({ behavior: "smooth", block: "center" }); };
  f("#fVis").addEventListener("submit", async e => { e.preventDefault();
    const nombre = f("#vN").value.trim(), man = (() => { const d = new Date(); d.setDate(d.getDate() + 1); return isoL(d); })();
    const fecha = dSel === "hoy" ? hoyL() : dSel === "man" ? man : f("#vF").value, hasta = dSel === "varios" ? f("#vH").value : fecha;
    if (nombre.length < 3) { f("#vE").textContent = "Escribí el nombre de la visita."; f("#vN").focus(); return; }
    if (!fecha || fecha < hoyL()) { f("#vE").textContent = "Escogé un día de hoy en adelante."; return; }
    if (dSel === "varios" && (!hasta || hasta < fecha)) { f("#vE").textContent = "Escogé hasta qué día puede venir."; return; }
    f("#vE").textContent = ""; f("#vB").disabled = true;
    const v = { nombre: nombre.slice(0, 60), tipo: tSel, placa: f("#vP").value.trim().toUpperCase().slice(0, 10), fecha, hasta, hora: f("#vHo").value || "", nota: f("#vNo").value.trim().slice(0, 150),
      codigo: nuevoCodigo(), casa: ses.casa, resNombre: ses.nombre, resId: ses.id, estado: "autorizada", ingreso: null, salida: null, mov: [], registradaPor: "" };
    try { await Datos.crearDoc("vi", v); aviso(`${v.nombre} autorizado. Seguridad ya lo sabe.`); f("#fVis").reset(); dSel = "hoy"; f("#vF").value = hoyL(); pintarDias(); pase(v); }
    catch { f("#vE").textContent = "No se pudo autorizar. Revisá tu conexión."; }
    f("#vB").disabled = false; });
  const pintar = () => {
    const mias = lista.filter(v => v.resId === ses.id), hoy = hoyL();
    const act = mias.filter(v => viHasta(v) >= hoy && v.estado !== "cancelada").sort((a, b) => a.fecha.localeCompare(b.fecha) || (a.hora || "").localeCompare(b.hora || ""));
    const pas = mias.filter(v => !act.includes(v)).sort((a, b) => b.creado - a.creado).slice(0, 15);
    const acc = v => v.estado === "autorizada" ? `<span style="display:flex;gap:4px"><button class="btn sm" type="button" data-vcod="${esc(v.id)}">Código</button><button class="btn sm" type="button" data-vcan="${esc(v.id)}">${conf === v.id ? "¿Seguro?" : "Cancelar"}</button></span>` : "";
    f("#vMis").innerHTML = (act.length ? `<h3 class="dia-t" style="margin-top:4px">Hoy y próximas</h3>` + act.map(v => filaVisita(v, { verCasa: false, acciones: acc(v) })).join("") : `<p class="vacio">No tenés visitas autorizadas para hoy ni para los próximos días.</p>`)
      + (pas.length ? `<h3 class="dia-t">Anteriores</h3>` + pas.map(v => filaVisita(v, { verCasa: false })).join("") : "");
  };
  cont.addEventListener("click", async e => {
    const t = e.target.closest("[data-vt]"); if (t) { tSel = t.dataset.vt; f("#vTipos").querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", String(x === t))); return; }
    const d = e.target.closest("[data-vd]"); if (d) { dSel = d.dataset.vd; pintarDias(); return; }
    const c = e.target.closest("[data-vcod]"); if (c) { const v = lista.find(x => x.id === c.dataset.vcod); if (v) pase(v); return; }
    const x = e.target.closest("[data-vcan]"); if (!x) return; const id = x.dataset.vcan;
    if (conf !== id) { conf = id; pintar(); setTimeout(() => { if (conf === id) { conf = null; pintar(); } }, 4000); return; }
    conf = null; try { await Datos.cambiarDoc("vi", id, { estado: "cancelada" }); aviso("Visita cancelada. Seguridad ya no la va a dejar pasar."); } catch { aviso("No se pudo cancelar."); } });
  Datos.escucharCol("vi", l => {
    if (antes) l.filter(v => v.resId === ses.id && antes.get(v.id) && antes.get(v.id) !== v.estado).forEach(v => {
      if (v.estado === "adentro") aviso(`${v.nombre} ya ingresó al condominio`); else if (v.estado === "salio") aviso(`${v.nombre} salió del condominio`); });
    antes = new Map(l.map(v => [v.id, v.estado])); lista = l; pintar(); }, () => { f("#vMis").innerHTML = `<p class="vacio">No se pudo conectar. Revisá tu conexión.</p>`; }).catch(() => {});
  setInterval(pintar, 60000);
}
function panelNoticiasRes(cont, abierta){
  let lista = null;
  cont.innerHTML = `<section class="caja"><h2>Noticias del condominio</h2><p class="nota" style="margin-top:-4px">Avisos, eventos y mantenimientos que publica la administración.</p><div id="ntL" style="margin-top:12px"><p class="vacio">Cargando…</p></div></section>`;
  const marcar = () => { lsSet("condo-nt-visto", Date.now()); const b = $("#nNt"); if (b) b.hidden = true; };
  const pintar = () => { $("#ntL", cont).innerHTML = noticiasHTML(lista || []);
    const visto = lsGet("condo-nt-visto", 0), n = (lista || []).filter(x => x.creado > visto).length, b = $("#nNt");
    if (abierta()) marcar(); else if (b) { b.hidden = !n; b.textContent = n; } };
  Datos.escucharCol("nt", l => { if (lista) { const nuevas = l.filter(x => !lista.some(y => y.id === x.id)); if (nuevas.length) aviso(`Nueva noticia: ${nuevas[0].titulo}`); }
    lista = l; pintar(); }, () => { $("#ntL", cont).innerHTML = `<p class="vacio">No se pudo conectar. Revisá tu conexión.</p>`; }).catch(() => {});
  setInterval(() => lista && pintar(), 60000);
  return marcar;
}
function panelEmpRes(ses, cont){
  let lista = [], cat = "", foto = "", conf = null;
  cont.innerHTML = `<section class="caja"><h2>Emprendimientos de vecinos</h2><p class="nota" style="margin-top:-4px">Apoyá lo local: productos y servicios de residentes del condominio, aprobados por la administración.</p><div id="eCat"></div></section>
    <section class="caja"><h2>¿Tenés un emprendimiento?</h2><p class="nota" style="margin-top:-4px">Envialo y la administración lo revisa antes de publicarlo, para que la sección no se llene de spam.</p>
      <button class="btn pri" type="button" id="eAbrir" style="margin-top:10px">Publicar mi emprendimiento</button>
      <form id="fEmp" hidden novalidate>
        <div class="campo"><label for="eN">Nombre del emprendimiento</label><input id="eN" maxlength="60" placeholder="Ej.: Repostería Doña Patri"></div>
        <div class="fila2"><div class="campo"><label for="eC">Categoría</label><select id="eC">${EMP_CAT.map(([k, ic, n]) => `<option value="${k}">${n}</option>`).join("")}</select></div>
          <div class="campo"><label for="eT">WhatsApp</label><input id="eT" inputmode="tel" maxlength="12" placeholder="Ej.: 8888 7777"></div></div>
        <div class="campo"><label for="eD">¿Qué ofrecés?</label><textarea id="eD" maxlength="400" placeholder="Ej.: Queques y bocadillos por encargo. Pedidos con 2 días de anticipación."></textarea></div>
        <div class="campo"><label>Foto o logo (opcional)</label><div class="foto-in"><label class="btn sm" style="cursor:pointer">Agregar foto<input type="file" id="eF" accept="image/*" hidden></label><span id="eFv"></span></div></div>
        <p class="err" id="eE"></p><button class="btn pri bloque" type="submit" id="eB">Enviar a la administración</button></form></section>
    <section class="caja"><h2>Mis solicitudes</h2><div class="lista" id="eMis"></div></section>`;
  $("#eAbrir", cont).onclick = () => { $("#fEmp", cont).hidden = false; $("#eAbrir", cont).hidden = true; $("#eN", cont).focus(); };
  $("#eF", cont).addEventListener("change", async e => { const f = e.target.files[0]; if (!f) return;
    try { foto = await comprimir(f, 700); $("#eFv", cont).innerHTML = `<img src="${foto}" alt="Foto adjunta"> <button class="btn sm" type="button" id="eFq">Quitar</button>`; $("#eFq", cont).onclick = () => { foto = ""; $("#eFv", cont).innerHTML = ""; }; } catch { aviso("No se pudo leer la foto."); } });
  $("#fEmp", cont).addEventListener("submit", async e => { e.preventDefault();
    const nombre = $("#eN", cont).value.trim(), desc = $("#eD", cont).value.trim(), tel = Datos.soloDigitos($("#eT", cont).value);
    if (nombre.length < 3) { $("#eE", cont).textContent = "Escribí el nombre del emprendimiento."; return; }
    if (desc.length < 10) { $("#eE", cont).textContent = "Contá un poco más de lo que ofrecés."; return; }
    if (tel.length < 8) { $("#eE", cont).textContent = "Escribí un número de WhatsApp."; return; }
    $("#eE", cont).textContent = ""; $("#eB", cont).disabled = true;
    try { await Datos.crearDoc("em", { nombre: nombre.slice(0, 60), categoria: $("#eC", cont).value, descripcion: desc.slice(0, 400), tel: tel.slice(0, 12), foto, casa: ses.casa, resNombre: ses.nombre, resId: ses.id, estado: "pendiente", motivo: "" });
      aviso("Enviado. La administración lo va a revisar."); $("#fEmp", cont).reset(); foto = ""; $("#eFv", cont).innerHTML = ""; $("#fEmp", cont).hidden = true; $("#eAbrir", cont).hidden = false;
    } catch { $("#eE", cont).textContent = "No se pudo enviar. Revisá tu conexión."; }
    $("#eB", cont).disabled = false; });
  const pintar = () => {
    $("#eCat", cont).innerHTML = catalogoEmp(lista, cat);
    const mias = lista.filter(e => e.resId === ses.id);
    $("#eMis", cont).innerHTML = mias.length ? mias.map(e => { const [cl, t] = EST_EMP[e.estado] || EST_EMP.pendiente, [, ic] = empCat(e.categoria);
      return `<div class="caso" style="cursor:default"><span class="ic">${ic}</span><span><b>${esc(e.nombre)}</b><span class="meta">${e.estado === "pendiente" ? "Enviado " + hace(e.creado) + " · esperando aprobación" : e.estado === "aprobado" ? "Ya lo ven todos los residentes" : "Motivo: " + esc(e.motivo || "sin detalle")}</span></span>
        <span class="der"><span class="est ${cl}">${t}</span><button class="btn sm" type="button" data-equitar="${esc(e.id)}">${conf === e.id ? "¿Seguro?" : "Quitar"}</button></span></div>`; }).join("")
      : `<p class="vacio">Todavía no has enviado ningún emprendimiento.</p>`;
  };
  cont.addEventListener("click", async e => {
    const c = e.target.closest("[data-ecat]"); if (c) { cat = c.dataset.ecat; pintar(); return; }
    const q = e.target.closest("[data-equitar]"); if (!q) return; const id = q.dataset.equitar;
    if (conf !== id) { conf = id; pintar(); setTimeout(() => { if (conf === id) { conf = null; pintar(); } }, 4000); return; }
    conf = null; try { await Datos.borrarDoc("em", id); aviso("Emprendimiento quitado"); } catch { aviso("No se pudo quitar."); } });
  let antes = null;
  Datos.escucharCol("em", l => {
    if (antes) l.filter(e => e.resId === ses.id && antes.get(e.id) === "pendiente" && e.estado !== "pendiente").forEach(e => aviso(e.estado === "aprobado" ? `¡Tu emprendimiento "${e.nombre}" ya está publicado!` : `Tu emprendimiento "${e.nombre}" no fue aprobado.`));
    antes = new Map(l.map(e => [e.id, e.estado])); lista = l; pintar(); }, () => { $("#eCat", cont).innerHTML = `<p class="vacio">No se pudo conectar. Revisá tu conexión.</p>`; }).catch(() => {});
}
function loginResidente(){
  app.innerHTML = `${encIngreso("Residentes")}
    <main class="wrap"><form class="caja login" id="fLogin" novalidate><div class="ico">${I.home}</div><h2 style="margin-top:6px">Ingresá para reportar</h2>
      <div class="campo"><label for="lu">Cédula o usuario</label><input id="lu" autocomplete="username" autocapitalize="none" placeholder="Ej.: 1 1111 1111"></div>
      <div class="campo"><label for="lc">Contraseña</label><input id="lc" type="password" autocomplete="current-password"></div>
      <p class="err" id="le"></p><button class="btn pri bloque" type="submit" id="lb">Entrar</button>
      <p class="nota">¿No tenés contraseña? La administración te manda un link para crearla.</p>
      <div class="demo-claves"><b>Demo:</b> usuario <b>ricardo</b> · contraseña <b>demo1234</b> (José Ricardo Montoya, casa 18)</div></form></main>`;
  $("#fLogin").addEventListener("submit", async e => { e.preventDefault();
    const txt = $("#lu").value.trim().toLowerCase(), cl = $("#lc").value, esRicardo = txt === RICARDO.usuario;
    const ced = esRicardo ? RICARDO.cedula : Datos.soloDigitos(txt);
    if (ced.length < 7) { $("#le").textContent = "Escribí tu cédula."; return; }
    $("#lb").disabled = true; $("#le").textContent = "";
    try { let r = await Datos.ingresar(ced, cl);
      if (!r && ced === RICARDO.cedula && cl === RICARDO.clave) { await Datos.asegurarResidente(RICARDO); r = await Datos.ingresar(ced, cl); }
      if (!r) { $("#le").textContent = "Cédula o contraseña incorrectas, o tu cuenta no está activa."; $("#lb").disabled = false; return; }
      lsSet("condo-ses-residente", { id: r.id, nombre: r.nombre, casa: r.casa }); residente();
    } catch { $("#le").textContent = "No se pudo ingresar. Revisá tu conexión."; $("#lb").disabled = false; } });
}
async function activar(id){
  app.innerHTML = `${encIngreso("Residentes")}<main class="wrap"><div class="caja login"><p class="nota">Cargando…</p></div></main>`;
  let r = null; try { r = await Datos.obtenerResidente(id); } catch {}
  const box = $(".login");
  if (!r) { box.innerHTML = `<div class="ico">${I.alert}</div><h2>Este link no es válido</h2><p class="nota">Pedile a la administración que te lo envíe de nuevo.</p>`; return; }
  box.outerHTML = `<form class="caja login" id="fAct" novalidate><div class="ico">${I.user}</div><h2 style="margin-top:6px">Hola, ${esc(r.nombre.split(" ")[0])}</h2>
    <p class="nota">Casa ${esc(r.casa)} · ${esc(nombreCondo())}. ${r.conClave ? "Ya tenías contraseña: si creás una nueva, también te sirve." : "Creá tu contraseña para reportar problemas del condominio."}</p>
    <div class="campo"><label for="ac">Confirmá tu cédula</label><input id="ac" inputmode="numeric" autocomplete="username"></div>
    <div class="campo"><label for="ap">Contraseña nueva</label><input id="ap" type="password" autocomplete="new-password" minlength="4"></div>
    <div class="campo"><label for="ap2">Repetila</label><input id="ap2" type="password" autocomplete="new-password"></div>
    <p class="err" id="ae"></p><button class="btn pri bloque" type="submit" id="ab">Crear contraseña y entrar</button></form>`;
  $("#fAct").addEventListener("submit", async e => { e.preventDefault();
    const ced = $("#ac").value, p = $("#ap").value, p2 = $("#ap2").value;
    if (p.length < 4) { $("#ae").textContent = "La contraseña debe tener al menos 4 caracteres."; return; }
    if (p !== p2) { $("#ae").textContent = "Las contraseñas no coinciden."; return; }
    $("#ab").disabled = true; $("#ae").textContent = "";
    try { const rr = await Datos.crearClave(id, ced, p); lsSet("condo-ses-residente", { id, nombre: rr.nombre, casa: rr.casa }); history.replaceState(null, "", location.pathname + location.search); aviso("¡Listo! Ya podés reportar."); residente(); }
    catch (x) { $("#ae").textContent = x.message === "cedula" ? "Esa cédula no coincide con la registrada." : "No se pudo guardar. Revisá tu conexión."; $("#ab").disabled = false; } });
}

/* ===================== PANEL DE SEGURIDAD (monitoreo) ===================== */
function seguridad(){
  if (!lsGet("condo-ses-seguridad", null)) return loginUsuario("seguridad", "Seguridad · Monitoreo", I.shield, seguridad);
  let casos = [], vista = "pend", conocidos = null, sonido = false, oficial = lsGet("condo-oficial", OFICIALES[0]), reservas = [], conocidasR = null, noticias = [], emprend = [], eCat = "", conocidasN = null, visitas = [], conocidasV = null, vq = "";
  app.innerHTML = `${encabezado("Seguridad · Monitoreo", `<select id="ofi" class="btn sm" aria-label="Oficial de turno">${OFICIALES.map(o => `<option ${o === oficial ? "selected" : ""}>${o}</option>`).join("")}</select>`)}
    <main class="wrap">
      <div class="contadores"><div class="r"><b id="cN">0</b><span>Nuevos</span></div><div class="a"><b id="cA">0</b><span>En atención</span></div><div class="v"><b id="cC">0</b><span>Cerrados hoy</span></div></div>
      <button class="btn bloque" type="button" id="alertas" style="margin-top:10px">Activar sonido y alertas de reportes nuevos</button>
      <div class="tabs" id="vistas"><button type="button" data-v="pend" aria-pressed="true">Pendientes</button><button type="button" data-v="hoy" aria-pressed="false">Cerrados hoy</button><button type="button" data-v="todos" aria-pressed="false">Últimos 50</button><button type="button" data-v="vis" aria-pressed="false">Visitas<span class="n" id="cV" hidden>0</span></button><button type="button" data-v="ran" aria-pressed="false">Ranchos<span class="n" id="cR" hidden>0</span></button><button type="button" data-v="not" aria-pressed="false">Noticias</button><button type="button" data-v="emp" aria-pressed="false">Emprendimientos</button></div>
      <div class="lista" id="lista"></div></main>`;
  $("#ofi").addEventListener("change", e => { oficial = e.target.value; lsSet("condo-oficial", oficial); });
  $("#alertas").addEventListener("click", async () => { sonido = true; pitar(); try { if ("Notification" in window) await Notification.requestPermission(); } catch {}
    $("#alertas").textContent = "Alertas activadas: suena cuando entra un reporte"; $("#alertas").disabled = true; });
  $("#vistas").addEventListener("click", e => { const b = e.target.closest("[data-v]"); if (!b) return; vista = b.dataset.v; document.querySelectorAll("#vistas button").forEach(x => x.setAttribute("aria-pressed", String(x === b))); pintar(); });
  $("#lista").addEventListener("input", e => { if (e.target.id === "vq") { vq = e.target.value; const p = e.target.selectionStart; pintar(); const i = $("#vq"); if (i) { i.focus(); i.setSelectionRange(p, p); } } });
  $("#lista").addEventListener("click", async e => {
    const vi = e.target.closest("[data-vin]"), vo = e.target.closest("[data-vout]");
    if (vi || vo) { const v = visitas.find(x => x.id === (vi || vo).dataset[vi ? "vin" : "vout"]); if (!v) return; const t = Date.now();
      try { await Datos.cambiarDoc("vi", v.id, vi ? { estado: "adentro", ingreso: t, salida: null, mov: [...(v.mov || []), { t, tipo: "in", of: oficial }].slice(-80) } : { estado: "salio", salida: t, mov: [...(v.mov || []), { t, tipo: "out", of: oficial }].slice(-80) });
        aviso(vi ? `Entrada de ${v.nombre} registrada (casa ${v.casa})` : `Salida de ${v.nombre} registrada`); } catch { aviso("No se pudo guardar. Revisá la conexión."); } return; }
    if (e.target.closest("#vSin")) { sinAnunciar(); return; } });
  $("#lista").addEventListener("click", e => { const k = e.target.closest("[data-ecat]"); if (k) { eCat = k.dataset.ecat; pintar(); return; } const b = e.target.closest("[data-caso]"); if (b) abrir(b.dataset.caso); });
  let ctx = null;
  function pitar(){ try { ctx = ctx || new (window.AudioContext || window.webkitAudioContext)(); [0, .25].forEach(d => { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = 880; o.connect(g); g.connect(ctx.destination); g.gain.setValueAtTime(.25, ctx.currentTime + d); g.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + d + .2); o.start(ctx.currentTime + d); o.stop(ctx.currentTime + d + .22); }); } catch {} }
  const inicioHoy = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); };
  const prio = { alta: 0, media: 1, baja: 2 };
  function pintar(){
    const nuevos = casos.filter(c => c.estado === "nuevo"), aten = casos.filter(c => c.estado === "en_atencion"), hoy = casos.filter(c => c.estado === "cerrado" && c.cerrado >= inicioHoy());
    $("#cN").textContent = nuevos.length; $("#cA").textContent = aten.length; $("#cC").textContent = hoy.length;
    const pend = [...nuevos.sort((a, b) => prio[a.prioridad] - prio[b.prioridad] || a.creado - b.creado), ...aten.sort((a, b) => a.creado - b.creado)];
    const hoyF = hoyL(), deHoy = reservas.filter(r => r.estado === "activa" && r.fecha === hoyF).length;
    $("#cR").hidden = !deHoy; $("#cR").textContent = deHoy; $("#cR").style.background = "var(--verde)";
    const esperadas = visitas.filter(viPuedeEntrar).length; $("#cV").hidden = !esperadas; $("#cV").textContent = esperadas; $("#cV").style.background = "var(--ambar)";
    if (vista === "vis") { $("#lista").innerHTML = visitasSeg(); return; }
    if (vista === "ran") { $("#lista").innerHTML = ranchosSeg(); return; }
    if (vista === "not") { $("#lista").innerHTML = noticiasHTML(noticias); return; }
    if (vista === "emp") { $("#lista").innerHTML = `<p class="nota" style="margin:6px 0 0">Emprendimientos de residentes aprobados por la administración.</p>` + catalogoEmp(emprend, eCat); return; }
    const l = vista === "pend" ? pend : vista === "hoy" ? hoy : casos.slice(0, 50);
    $("#lista").innerHTML = l.length ? l.map(c => filaCaso(c)).join("") : `<p class="vacio">${vista === "pend" ? "No hay reportes pendientes." : "No hay casos."}</p>`;
    document.title = (nuevos.length ? `(${nuevos.length}) ` : "") + "Seguridad · " + nombreCondo();
  }
  function visitasSeg(){
    const q = vq.trim().toLowerCase(), hoy = hoyL(), ini = (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); })();
    const busca = v => !q || `${v.codigo} ${v.nombre} ${v.placa} casa ${v.casa} ${v.resNombre}`.toLowerCase().includes(q);
    const esp = visitas.filter(v => viPuedeEntrar(v) && busca(v)).sort((a, b) => (a.hora || "99").localeCompare(b.hora || "99"));
    const den = visitas.filter(v => v.estado === "adentro" && busca(v)).sort((a, b) => a.ingreso - b.ingreso);
    const sal = visitas.filter(v => v.estado === "salio" && v.salida >= ini && !viPuedeEntrar(v) && busca(v)).sort((a, b) => b.salida - a.salida);
    const man = visitas.filter(v => v.estado === "autorizada" && v.fecha > hoy && busca(v)).sort((a, b) => a.fecha.localeCompare(b.fecha)).slice(0, 10);
    const btnIn = v => `<button class="btn sm pri" type="button" data-vin="${esc(v.id)}">Entró</button>`, btnOut = v => `<button class="btn sm" type="button" data-vout="${esc(v.id)}">Salió</button>`;
    return `<div class="visbus"><input id="vq" type="search" placeholder="Buscar por código, nombre, placa o casa" value="${esc(vq)}" autocomplete="off" inputmode="search"><button class="btn sm" type="button" id="vSin">Visita sin anunciar</button></div>
      <h3 class="dia-t">Esperadas hoy (${esp.length})</h3>${esp.map(v => filaVisita(v, { acciones: btnIn(v) })).join("") || `<p class="vacio">${q ? "No hay ninguna autorizada con esos datos. Si no está, llamá a la casa." : "No hay más visitas esperadas hoy."}</p>`}
      <h3 class="dia-t">Adentro ahora (${den.length})</h3>${den.map(v => filaVisita(v, { acciones: btnOut(v) })).join("") || `<p class="vacio">No hay visitas adentro.</p>`}
      ${sal.length ? `<h3 class="dia-t">Salieron hoy (${sal.length})</h3>${sal.map(v => filaVisita(v)).join("")}` : ""}
      ${man.length && !q ? `<h3 class="dia-t">Próximos días</h3>${man.map(v => filaVisita(v)).join("")}` : ""}`;
  }
  function sinAnunciar(){
    hoja(`<div class="hoja-cab"><h3>Visita sin anunciar</h3><button class="x" type="button" data-cerrar aria-label="Cerrar">×</button></div>
      <p class="nota">Para quien llega sin autorización. Llamá o escribile a la casa y, si el residente dice que sí, registrala aquí. Queda en la bitácora.</p>
      <div class="ops" id="sTipos">${VI_TIPOS.map(([k, ic, n], i) => `<button type="button" data-st="${k}" aria-pressed="${i === 0}">${ic} ${n}</button>`).join("")}</div>
      <div class="fila2"><div class="campo"><label for="sN">Nombre</label><input id="sN" maxlength="60"></div><div class="campo"><label for="sC">Casa</label><input id="sC" maxlength="10" inputmode="numeric"></div></div>
      <div class="fila2"><div class="campo"><label for="sP">Placa (opcional)</label><input id="sP" maxlength="10" autocapitalize="characters"></div><div class="campo"><label for="sNo">Nota</label><input id="sNo" maxlength="150" value="Se llamó a la casa y autorizó"></div></div>
      <p class="err" id="sE"></p><button class="btn pri bloque" type="button" id="sOk" style="margin-top:8px">Registrar entrada</button>`, (h, cerrar) => {
      let st = "visita"; $("#sTipos", h).onclick = e => { const b = e.target.closest("[data-st]"); if (!b) return; st = b.dataset.st; h.querySelectorAll("#sTipos button").forEach(x => x.setAttribute("aria-pressed", String(x === b))); };
      $("#sOk", h).onclick = async () => { const nombre = $("#sN", h).value.trim(), casa = $("#sC", h).value.trim();
        if (nombre.length < 2) { $("#sE", h).textContent = "Escribí el nombre."; return; } if (!casa) { $("#sE", h).textContent = "Escribí la casa a la que va."; return; }
        const t = Date.now(), r = lista_res(casa);
        try { await Datos.crearDoc("vi", { nombre: nombre.slice(0, 60), tipo: st, placa: $("#sP", h).value.trim().toUpperCase().slice(0, 10), fecha: hoyL(), hasta: hoyL(), hora: "", nota: $("#sNo", h).value.trim().slice(0, 150), codigo: "",
            casa: casa.slice(0, 10), resNombre: r ? r.nombre : "", resId: r ? r.id : "", estado: "adentro", ingreso: t, salida: null, mov: [{ t, tipo: "in", of: oficial }], registradaPor: oficial });
          aviso(`Entrada de ${nombre} registrada (casa ${casa})`); cerrar(); } catch { $("#sE", h).textContent = "No se pudo guardar. Revisá la conexión."; } };
      setTimeout(() => $("#sN", h).focus(), 100); });
  }
  let residentesSeg = []; const lista_res = casa => residentesSeg.find(r => String(r.casa) === String(casa) && r.activo);
  Datos.escucharResidentes(l => { residentesSeg = l; }).catch(() => {});
  function ranchosSeg(){
    const ahora = minAhora(); let h = `<p class="nota" style="margin:6px 0 0">Reservas de los ranchos para hoy y los próximos 7 días. Te avisa cuando un residente reserva o cancela.</p>`;
    for (let i = 0; i < 8; i++) { const d = new Date(); d.setDate(d.getDate() + i); const f = isoL(d);
      const l = reservas.filter(r => r.fecha === f).sort((x, y) => x.ini - y.ini || x.rancho - y.rancho); if (!l.length) continue;
      h += `<h3 class="dia-t">${diaTxt(f, true)}</h3>` + l.map(r => { const uso = r.estado === "activa" && i === 0 && r.ini <= ahora && ahora < r.fin;
        return `<div class="caso${uso ? " uso" : ""}" style="cursor:default;${r.estado === "cancelada" ? "opacity:.55" : ""}"><span class="ic">${I.tent}</span>
          <span><b>${rancho(r.rancho).nombre} · ${horario(r)}</b><span class="meta">Casa ${esc(r.casa)} · ${esc(r.nombre)}${r.nota ? " · " + esc(r.nota) : ""}</span></span>
          <span class="der">${r.estado === "cancelada" ? `<span class="est nuevo">Cancelada</span>` : uso ? `<span class="est en_atencion">En uso ahora</span>` : `<span class="est cerrado">Reservado</span>`}</span></div>`; }).join(""); }
    return h.includes("dia-t") ? h : h + `<p class="vacio">No hay reservas en los próximos 7 días.</p>`;
  }
  function abrir(id){
    const c = casos.find(x => x.id === id); if (!c) return;
    let res = "", prob = false;
    hoja(detalleHTML(c, { esquina: c.escalado ? "" : `<button class="btn sm esc-btn" type="button" id="escalar">Escalar a administración</button>` })
      + `<div class="caja esc-form" id="escForm" hidden><h2 style="font-size:17px">Escalar a administración</h2><p class="nota" style="margin-top:-4px">El caso le llega a la administración para que lo valide con la casa afectada.</p>
        <div class="campo"><label for="escN">¿Por qué se escala?</label><textarea id="escN" maxlength="300" placeholder="Ej.: Es la cuarta vez que se reporta a la casa 27 por ruido. Se necesita que la administración hable con el residente."></textarea></div>
        <p class="err" id="escE"></p><button class="btn rojo bloque" type="button" id="escOk">Enviar a administración</button></div>`
      + (c.estado === "nuevo" ? `<button class="btn pri bloque" type="button" id="tomar" style="margin-top:16px">Voy en camino</button>`
      : c.estado === "en_atencion" ? `<div class="caja"><h2 style="font-size:17px">Cerrar el caso</h2>
        <div class="campo"><label>¿Cómo terminó?</label><div class="ops" id="resu">${RESULTADOS.map(([k, l]) => `<button type="button" data-r="${k}" aria-pressed="false">${l}</button>`).join("")}</div></div>
        <div class="campo"><label for="cres">¿Qué se hizo?</label><textarea id="cres" maxlength="300" placeholder="Ej.: Se habló con los residentes de la casa 27 y bajaron el volumen."></textarea></div>
        <label style="display:flex;gap:8px;align-items:center;margin-top:10px;font-weight:700"><input type="checkbox" id="cprob" style="width:20px;height:20px"> Hubo problemas al atenderlo</label>
        <div class="campo" id="cpw" hidden><label for="cpn">¿Qué pasó?</label><input id="cpn" maxlength="150" placeholder="Ej.: No abrieron la puerta, se tuvo que volver."></div>
        <div class="campo"><label for="cnota">Nota sin cerrar (opcional)</label><div style="display:flex;gap:6px"><input id="cnota" maxlength="150" placeholder="Ej.: Llegué, sigo verificando"><button class="btn sm" type="button" id="bnota">Agregar</button></div></div>
        <p class="err" id="cerr"></p><button class="btn pri bloque" type="button" id="bcerrar" style="margin-top:6px">Cerrar caso</button></div>` : ""), (h, cerrar) => {
      $("#escalar", h)?.addEventListener("click", () => { const f = $("#escForm", h); f.hidden = false; f.scrollIntoView({ behavior: "smooth", block: "center" }); setTimeout(() => $("#escN", h).focus(), 250); });
      $("#escOk", h)?.addEventListener("click", async () => { const t = $("#escN", h).value.trim();
        if (t.length < 5) { $("#escE", h).textContent = "Explicá brevemente por qué se escala."; return; }
        try { await Datos.actualizar(c.id, { escalado: "pendiente", escaladoNota: t.slice(0, 300), escaladoPor: oficial, escaladoT: true }, { quien: oficial, txt: "Escalado a administración: " + t.slice(0, 300) });
          aviso(`Caso #${c.num} enviado a la administración`); cerrar(); } catch { aviso("No se pudo escalar. Revisá la conexión."); } });
      $("#tomar", h)?.addEventListener("click", async () => { try { await Datos.actualizar(c.id, { estado: "en_atencion", atendido: true, agente: oficial }, { quien: oficial, txt: "Va en camino" }); aviso(`Caso #${c.num}: vas en camino`); cerrar(); setTimeout(() => abrir(c.id), 400); } catch { aviso("No se pudo actualizar."); } });
      $("#resu", h)?.addEventListener("click", e => { const b = e.target.closest("[data-r]"); if (!b) return; res = b.dataset.r; h.querySelectorAll("#resu button").forEach(x => x.setAttribute("aria-pressed", String(x === b))); });
      $("#cprob", h)?.addEventListener("change", e => { prob = e.target.checked; $("#cpw", h).hidden = !prob; });
      $("#bnota", h)?.addEventListener("click", async () => { const t = $("#cnota", h).value.trim(); if (!t) return; try { await Datos.actualizar(c.id, {}, { quien: oficial, txt: "Nota: " + t }); aviso("Nota agregada"); cerrar(); setTimeout(() => abrir(c.id), 400); } catch { aviso("No se pudo guardar."); } });
      $("#bcerrar", h)?.addEventListener("click", async () => {
        const txt = $("#cres", h).value.trim();
        if (!res) { $("#cerr", h).textContent = "Escogé cómo terminó."; return; }
        if (txt.length < 3) { $("#cerr", h).textContent = "Escribí qué se hizo."; $("#cres", h).focus(); return; }
        const extra = res === "escalado" && !c.escalado ? { escalado: "pendiente", escaladoNota: txt, escaladoPor: oficial, escaladoT: true } : {};
        try { await Datos.actualizar(c.id, { estado: "cerrado", cerrado: true, agente: c.agente || oficial, resultado: res, resolucion: txt, problema: prob, problemaNota: prob ? $("#cpn", h).value.trim() : "", ...extra }, { quien: oficial, txt: `Cerrado: ${resultado(res)}` });
          aviso(`Caso #${c.num} cerrado`); cerrar(); } catch { aviso("No se pudo cerrar. Revisá la conexión."); }
      });
    });
  }
  Datos.escuchar(async lista => {
    if (await asegurarEjemplo(lista)) return;
    if (conocidos) { const nuevos = lista.filter(c => c.estado === "nuevo" && !conocidos.has(c.id));
      if (nuevos.length) { const c = nuevos[0]; aviso(`Nuevo reporte #${c.num}: ${tipo(c.tipo)[2]} · ${donde(c)}`); if (sonido) pitar(); if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
        try { if (document.hidden && Notification.permission === "granted") new Notification(`Nuevo reporte #${c.num}`, { body: `${tipo(c.tipo)[2]} · ${donde(c)}` }); } catch {} } }
    conocidos = new Set(lista.map(c => c.id)); casos = lista; pintar();
  }, () => { $("#lista").innerHTML = `<p class="vacio">No se pudo conectar. Revisá la conexión.</p>`; }).catch(() => {});
  Datos.escucharReservas(l => {
    if (conocidasR) { const cam = l.filter(r => conocidasR.get(r.id) !== r.estado);
      cam.forEach(r => { const t = `${rancho(r.rancho).nombre} · ${diaTxt(r.fecha)} · ${horario(r)} · Casa ${r.casa}`;
        aviso(r.estado === "cancelada" ? `Reserva cancelada: ${t}` : `Nueva reserva: ${t}`); if (sonido) pitar();
        try { if (document.hidden && Notification.permission === "granted") new Notification(r.estado === "cancelada" ? "Reserva de rancho cancelada" : "Nueva reserva de rancho", { body: t }); } catch {} }); }
    conocidasR = new Map(l.map(r => [r.id, r.estado])); reservas = l; pintar(); }).catch(() => {});
  Datos.escucharCol("nt", l => { if (conocidasN) { const n = l.find(x => !conocidasN.has(x.id)); if (n) aviso(`Nueva noticia: ${n.titulo}`); } conocidasN = new Set(l.map(x => x.id)); noticias = l; if (vista === "not") pintar(); }).catch(() => {});
  Datos.escucharCol("em", l => { emprend = l; if (vista === "emp") pintar(); }).catch(() => {});
  Datos.escucharCol("vi", l => {
    if (conocidasV) { const n = l.filter(v => !conocidasV.has(v.id) && v.estado === "autorizada");
      n.forEach(v => { const t = `${v.nombre} → Casa ${v.casa} · ${viCuando(v)}${v.hora ? " · ~" + h24a12(v.hora) : ""}`; aviso(`Visita autorizada: ${t}`); if (sonido) pitar();
        try { if (document.hidden && Notification.permission === "granted") new Notification("Nueva visita autorizada", { body: t }); } catch {} });
      l.filter(v => conocidasV.get(v.id) === "autorizada" && v.estado === "cancelada").forEach(v => aviso(`Visita cancelada: ${v.nombre} (casa ${v.casa})`)); }
    conocidasV = new Map(l.map(v => [v.id, v.estado])); visitas = l; if (document.activeElement?.id !== "vq" || vista !== "vis") pintar(); else { const i = $("#vq"), p = i.selectionStart; pintar(); const j = $("#vq"); j.focus(); j.setSelectionRange(p, p); } }).catch(() => {});
  setInterval(() => { if (document.activeElement?.id !== "vq") pintar(); }, 30000);
}

/* ===================== PANEL DE ADMINISTRACIÓN ===================== */
function admin(){
  if (!lsGet("condo-ses-admin", null)) return loginUsuario("admin", "Administración", I.chart, admin);
  let noticias = [], emprend = [], ntEdit = null, ntTipoSel = "aviso", ntFoto = "", ntConf = null, emConf = null;
  let visitas = [], vFil = { periodo: 7, q: "" };
  let ultimoLink = null, casos = [], residentes = [], reservas = [], rFil = { rancho: 0, cuando: "prox" }, rConf = null, tab = lsGet("condo-admin-tab", "est"), periodo = 30, filtro = { estado: "", tipo: "", q: "" };
  app.innerHTML = `${encabezado("Administración")}
    <main class="wrap">
      <div class="tabs" id="tabs">${[["est","Estadísticas"],["rep","Reportes"],["esc","Escalados<span class=\"n\" id=\"nEsc\" hidden></span>"],["not","Noticias"],["emp","Emprendimientos<span class=\"n\" id=\"nEmp\" hidden></span>"],["vis","Visitas"],["ran","Ranchos"],["res","Residentes"],["aj","Ajustes"]].map(([k, l]) => `<button type="button" data-t="${k}" aria-pressed="${k === tab}">${l}</button>`).join("")}</div>
      <div id="cuerpo"></div></main>`;
  $("#tabs").addEventListener("click", e => { const b = e.target.closest("[data-t]"); if (!b) return; tab = b.dataset.t; lsSet("condo-admin-tab", tab); document.querySelectorAll("#tabs button").forEach(x => x.setAttribute("aria-pressed", String(x === b))); pintar(); });
  const cuerpo = $("#cuerpo");
  cuerpo.addEventListener("click", e => {
    const p = e.target.closest("[data-p]"); if (p) { periodo = +p.dataset.p; pintar(); return; }
    const c = e.target.closest("[data-caso]"); if (c) { abrirCaso(c.dataset.caso); return; }
    const ne = e.target.closest("[data-ntedit]"); if (ne) { editarNoticia(ne.dataset.ntedit); return; }
    const nf = e.target.closest("[data-ntfijar]"); if (nf) { const n = noticias.find(x => x.id === nf.dataset.ntfijar); if (n) Datos.cambiarDoc("nt", n.id, { fijada: !n.fijada }).then(() => aviso(n.fijada ? "Noticia desfijada" : "Noticia fijada arriba")).catch(() => aviso("No se pudo cambiar.")); return; }
    const nb = e.target.closest("[data-ntborrar]"); if (nb) { const id = nb.dataset.ntborrar;
      if (ntConf !== id) { ntConf = id; pintarNt(); setTimeout(() => { if (ntConf === id) { ntConf = null; pintarNt(); } }, 4000); return; }
      ntConf = null; Datos.borrarDoc("nt", id).then(() => aviso("Noticia borrada")).catch(() => aviso("No se pudo borrar.")); return; }
    const ea = e.target.closest("[data-emapr]"); if (ea) { const x = emprend.find(y => y.id === ea.dataset.emapr); if (x) Datos.cambiarDoc("em", x.id, { estado: "aprobado", motivo: "", revisado: true }).then(() => aviso(`"${x.nombre}" publicado`)).catch(() => aviso("No se pudo aprobar.")); return; }
    const er = e.target.closest("[data-emrech]"); if (er) { rechazarEmp(er.dataset.emrech); return; }
    const eq = e.target.closest("[data-emquitar]"); if (eq) { const id = eq.dataset.emquitar;
      if (emConf !== id) { emConf = id; pintarEm(); setTimeout(() => { if (emConf === id) { emConf = null; pintarEm(); } }, 4000); return; }
      emConf = null; Datos.cambiarDoc("em", id, { estado: "rechazado", motivo: "Quitado por la administración", revisado: true }).then(() => aviso("Publicación quitada")).catch(() => aviso("No se pudo quitar.")); return; }
  });
  /* ---- noticias ---- */
  function noticiasV(){
    return `<section class="caja" id="ntForm"><h2 id="ntFT">Publicar una noticia</h2><p class="nota" style="margin-top:-4px">La ven al instante los residentes y seguridad, con aviso en la app.</p>
      <form id="fNt" novalidate><div class="campo"><label>Tipo</label><div class="ops" id="ntTipos">${NT_TIPOS.map(([k, ic, n]) => `<button type="button" data-ntt="${k}" aria-pressed="${k === ntTipoSel}">${ic} ${n}</button>`).join("")}</div></div>
        <div class="campo"><label for="ntT">Título</label><input id="ntT" maxlength="90" placeholder="Ej.: Corte de agua el jueves"></div>
        <div class="campo"><label for="ntF">Fecha de lo que va a pasar (opcional)</label><input id="ntF" type="date"></div>
        <div class="campo"><label for="ntX">Detalle</label><textarea id="ntX" maxlength="1500" style="min-height:120px" placeholder="Ej.: El AyA va a cortar el agua de 8:00 a. m. a 2:00 p. m. Les recomendamos guardar agua."></textarea></div>
        <div class="campo"><label>Foto (opcional)</label><div class="foto-in"><label class="btn sm" style="cursor:pointer">Agregar foto<input type="file" id="ntP" accept="image/*" hidden></label><span id="ntPv"></span></div></div>
        <label style="display:flex;gap:8px;align-items:center;margin-top:12px;font-weight:700"><input type="checkbox" id="ntFij" style="width:20px;height:20px"> Fijar arriba (para avisos importantes)</label>
        <p class="err" id="ntE"></p><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn pri" type="submit" id="ntB">Publicar noticia</button><button class="btn" type="button" id="ntCan" hidden>Cancelar edición</button></div></form></section>
      <section class="caja"><h2>Publicadas (<span id="ntN">0</span>)</h2><div id="ntLista" style="margin-top:12px"></div></section>`;
  }
  function pintarNt(){
    const l = $("#ntLista"); if (!l) return; $("#ntN").textContent = noticias.length;
    l.innerHTML = noticiasHTML(noticias, n => `<div class="nt-acc"><button class="btn sm" type="button" data-ntedit="${esc(n.id)}">Editar</button><button class="btn sm" type="button" data-ntfijar="${esc(n.id)}">${n.fijada ? "Desfijar" : "Fijar"}</button><button class="btn sm" type="button" data-ntborrar="${esc(n.id)}">${ntConf === n.id ? "¿Seguro? Tocá otra vez" : "Borrar"}</button></div>`);
  }
  function fotoNt(){ $("#ntPv").innerHTML = ntFoto ? `<img src="${esc(ntFoto)}" alt="Foto"> <button class="btn sm" type="button" id="ntPq">Quitar</button>` : ""; const q = $("#ntPq"); if (q) q.onclick = () => { ntFoto = ""; fotoNt(); }; }
  function limpiarNt(){ ntEdit = null; ntFoto = ""; ntTipoSel = "aviso"; const f = $("#fNt"); if (!f) return; f.reset(); fotoNt(); $("#ntFT").textContent = "Publicar una noticia"; $("#ntB").textContent = "Publicar noticia"; $("#ntCan").hidden = true;
    document.querySelectorAll("#ntTipos button").forEach(x => x.setAttribute("aria-pressed", String(x.dataset.ntt === ntTipoSel))); }
  function editarNoticia(id){
    const n = noticias.find(x => x.id === id); if (!n) return;
    ntEdit = id; ntTipoSel = n.tipo; ntFoto = n.foto || "";
    $("#ntT").value = n.titulo; $("#ntF").value = n.fecha || ""; $("#ntX").value = n.texto; $("#ntFij").checked = !!n.fijada; fotoNt();
    document.querySelectorAll("#ntTipos button").forEach(x => x.setAttribute("aria-pressed", String(x.dataset.ntt === ntTipoSel)));
    $("#ntFT").textContent = "Editar noticia"; $("#ntB").textContent = "Guardar cambios"; $("#ntCan").hidden = false;
    $("#ntForm").scrollIntoView({ behavior: "smooth", block: "start" }); setTimeout(() => $("#ntT").focus(), 300);
  }
  function conectarNt(){
    $("#ntTipos").onclick = e => { const b = e.target.closest("[data-ntt]"); if (!b) return; ntTipoSel = b.dataset.ntt; document.querySelectorAll("#ntTipos button").forEach(x => x.setAttribute("aria-pressed", String(x === b))); };
    $("#ntP").onchange = async e => { const f = e.target.files[0]; if (!f) return; try { ntFoto = await comprimir(f, 1100); fotoNt(); } catch { aviso("No se pudo leer la foto."); } };
    $("#ntCan").onclick = limpiarNt;
    $("#fNt").onsubmit = async e => { e.preventDefault();
      const titulo = $("#ntT").value.trim(), texto = $("#ntX").value.trim();
      if (titulo.length < 4) { $("#ntE").textContent = "Escribí un título."; $("#ntT").focus(); return; }
      if (texto.length < 5) { $("#ntE").textContent = "Escribí el detalle de la noticia."; $("#ntX").focus(); return; }
      $("#ntE").textContent = ""; $("#ntB").disabled = true;
      const datos = { titulo: titulo.slice(0, 90), texto: texto.slice(0, 1500), tipo: ntTipoSel, fecha: $("#ntF").value || "", foto: ntFoto, fijada: $("#ntFij").checked };
      try { if (ntEdit) { await Datos.cambiarDoc("nt", ntEdit, { ...datos, editado: true }); aviso("Noticia actualizada"); } else { await Datos.crearDoc("nt", datos); aviso("Noticia publicada"); } limpiarNt(); }
      catch { $("#ntE").textContent = "No se pudo guardar. Revisá la conexión."; }
      $("#ntB").disabled = false; };
    pintarNt();
  }
  /* ---- emprendimientos ---- */
  function emprendV(){
    return `<section class="caja"><h2>Solicitudes por aprobar (<span id="emNP">0</span>)</h2><p class="nota" style="margin-top:-4px">Los residentes envían su emprendimiento y solo se publica cuando lo aprobás. Así se evita el spam.</p><div id="emPend"></div></section>
      <section class="caja"><h2>Publicados (<span id="emNA">0</span>)</h2><p class="nota" style="margin-top:-4px">Los ven los residentes y seguridad.</p><div id="emAprob"></div></section>
      <section class="caja"><h2>No aprobados</h2><div class="lista" id="emRech"></div></section>`;
  }
  function pintarEm(){
    const n = emprend.filter(e => e.estado === "pendiente"), b = $("#nEmp"); if (b) { b.hidden = !n.length; b.textContent = n.length; }
    if (!$("#emPend")) return;
    const ap = emprend.filter(e => e.estado === "aprobado"), re = emprend.filter(e => e.estado === "rechazado");
    $("#emNP").textContent = n.length; $("#emNA").textContent = ap.length;
    $("#emPend").innerHTML = n.length ? `<div class="emps">${n.map(e => tarjetaEmp(e, `<span class="pend-t">Enviado ${hace(e.creado)}</span><button class="btn sm pri" type="button" data-emapr="${esc(e.id)}">Aprobar</button><button class="btn sm" type="button" data-emrech="${esc(e.id)}">Rechazar</button>`)).join("")}</div>` : `<p class="vacio">No hay solicitudes pendientes.</p>`;
    $("#emAprob").innerHTML = ap.length ? `<div class="emps">${ap.map(e => tarjetaEmp(e, `<button class="btn sm" type="button" data-emquitar="${esc(e.id)}">${emConf === e.id ? "¿Seguro?" : "Quitar"}</button>`)).join("")}</div>` : `<p class="vacio">Todavía no hay emprendimientos publicados.</p>`;
    $("#emRech").innerHTML = re.length ? re.map(e => `<div class="caso" style="cursor:default"><span class="ic">${empCat(e.categoria)[1]}</span><span><b>${esc(e.nombre)}</b><span class="meta">Casa ${esc(e.casa)} · ${esc(e.resNombre)} · ${esc(e.motivo || "Sin motivo")}</span></span>
      <span class="der"><button class="btn sm" type="button" data-emapr="${esc(e.id)}">Aprobar</button></span></div>`).join("") : `<p class="vacio">Ninguno.</p>`;
  }
  function rechazarEmp(id){
    const x = emprend.find(y => y.id === id); if (!x) return;
    hoja(`<h2 style="font-size:19px">Rechazar "${esc(x.nombre)}"</h2><p class="nota">El residente de la casa ${esc(x.casa)} va a ver el motivo en su app.</p>
      <div class="campo"><label for="emM">Motivo</label><textarea id="emM" maxlength="150" placeholder="Ej.: No se permiten ventas de ese tipo dentro del condominio."></textarea></div>
      <div style="display:flex;gap:8px;margin-top:12px"><button class="btn rojo" type="button" id="emMok">Rechazar</button><button class="btn" type="button" data-cerrar>Cancelar</button></div>`, (h, cerrar) => {
      $("#emMok", h).onclick = async () => { try { await Datos.cambiarDoc("em", id, { estado: "rechazado", motivo: $("#emM", h).value.trim().slice(0, 150), revisado: true }); aviso("Solicitud rechazada"); cerrar(); } catch { aviso("No se pudo guardar."); } };
      setTimeout(() => $("#emM", h).focus(), 100); });
  }
  const waCasa = (casa, txt) => { const r = residentes.find(x => String(x.casa) === String(casa) && x.tel); if (!r) return "";
    const t = r.tel.length === 8 ? "506" + r.tel : r.tel; return `<a class="btn sm" style="background:#25d366;border-color:#25d366;color:#062b14" target="_blank" rel="noopener" href="https://wa.me/${t}?text=${encodeURIComponent(txt)}">WhatsApp casa ${esc(casa)}</a>`; };
  function abrirCaso(id){
    const c = casos.find(x => x.id === id); if (!c) return;
    const msg = `Hola, le escribe la administración de ${nombreCondo()} sobre el reporte #${c.num}.`;
    hoja(detalleHTML(c) + `<div class="caja"><h2 style="font-size:17px">Comentario de la administración</h2>
      <p class="nota" style="margin-top:-4px">Queda en el historial del caso: lo ven seguridad y el residente que reportó.</p>
      ${c.escalado === "pendiente" ? `<div class="res-box" style="background:var(--panel2)">Para validar: reportó la <b>casa ${esc(c.casa)}</b>${c.contraCasa ? ` · afectación de la <b>casa ${esc(c.contraCasa)}</b>` : ""}.
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">${waCasa(c.casa, msg)}${c.contraCasa ? waCasa(c.contraCasa, msg) : ""}</div></div>` : ""}
      <div class="campo"><label for="aCom">Comentario o respuesta</label><textarea id="aCom" maxlength="300" placeholder="Ej.: Ya hablamos con el residente de la casa ${esc(c.contraCasa || "27")} y se le envió una advertencia por escrito."></textarea></div>
      <p class="err" id="aErr"></p>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px"><button class="btn pri" type="button" id="aComOk">Agregar comentario</button>${c.escalado === "pendiente" ? `<button class="btn" type="button" id="aRes">Comentar y marcar resuelto</button>` : ""}</div></div>`, (h, cerrar) => {
      const enviar = async resolver => { const t = $("#aCom", h).value.trim();
        if (t.length < 3) { $("#aErr", h).textContent = "Escribí el comentario."; $("#aCom", h).focus(); return; }
        try { await Datos.actualizar(c.id, { adminNota: t.slice(0, 300), ...(resolver ? { escalado: "resuelto" } : {}) }, { quien: "Administración", txt: (resolver ? "Resuelto por administración: " : "") + t.slice(0, 300) });
          aviso(resolver ? `Caso #${c.num} resuelto` : "Comentario agregado"); cerrar(); setTimeout(() => abrirCaso(c.id), 350); } catch { aviso("No se pudo guardar. Revisá la conexión."); } };
      $("#aComOk", h).onclick = () => enviar(false); const r = $("#aRes", h); if (r) r.onclick = () => enviar(true);
    });
  }
  function escalados(){
    const p = casos.filter(c => c.escalado === "pendiente").sort((a, b) => (a.escaladoT || 0) - (b.escaladoT || 0));
    const r = casos.filter(c => c.escalado === "resuelto").sort((a, b) => (b.escaladoT || 0) - (a.escaladoT || 0)).slice(0, 20);
    const fila = c => { const [, ic, nom] = tipo(c.tipo); return `<button type="button" class="caso${c.escalado === "pendiente" ? " alta" : ""}" data-caso="${esc(c.id)}"><span class="ic">${ic}</span>
      <span><b>${esc(nom)} · ${esc(donde(c)) || "Sin lugar"}</b><span class="meta">#${c.num} · Reportó casa ${esc(c.casa)} · ${esc(c.escaladoNota || c.descripcion)}</span></span>
      <span class="der"><span class="est ${c.escalado === "pendiente" ? "esc" : "cerrado"}">${c.escalado === "pendiente" ? "Pendiente" : "Resuelto"}</span><span class="tiempo">${esc(c.escaladoPor || "")} · ${c.escaladoT ? hace(c.escaladoT) : ""}</span></span></button>`; };
    return `<section class="caja"><h2>Escalados por seguridad (${p.length})</h2><p class="nota" style="margin-top:-4px">Casos que seguridad pasó a la administración para validarlos con la casa afectada. Abrí uno para comentar o marcarlo resuelto.</p>
      <div class="lista">${p.map(fila).join("") || `<p class="vacio">No hay casos escalados pendientes.</p>`}</div></section>
      <section class="caja"><h2>Resueltos recientemente</h2><div class="lista">${r.map(fila).join("") || `<p class="vacio">Todavía no hay.</p>`}</div></section>`;
  }
  function visitasV(){
    const hoy = hoyL(), desde = vFil.periodo ? (() => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - (vFil.periodo - 1)); return d.getTime(); })() : 0;
    const mes = Date.now() - 30 * 864e5, entradas = visitas.flatMap(v => (v.mov || []).filter(m => m.tipo === "in" && m.t >= mes));
    const q = vFil.q.trim().toLowerCase();
    const l = visitas.filter(v => (v.ingreso || v.creado) >= desde || (vFil.periodo === 1 && viPuedeEntrar(v)))
      .filter(v => !q || `${v.codigo} ${v.nombre} ${v.placa} ${v.casa} ${v.resNombre} ${v.registradaPor}`.toLowerCase().includes(q))
      .sort((a, b) => (b.ingreso || b.creado) - (a.ingreso || a.creado));
    const porCasa = contar(visitas.filter(v => (v.mov || []).some(m => m.tipo === "in" && m.t >= mes)), v => `Casa ${v.casa}`).slice(0, 6);
    return `<div class="kpis">
        <div><span>Esperadas hoy</span><b>${visitas.filter(viPuedeEntrar).length}</b><small>autorizadas que no han entrado</small></div>
        <div><span>Adentro ahora</span><b>${visitas.filter(v => v.estado === "adentro").length}</b><small>visitas dentro del condominio</small></div>
        <div><span>Entradas (30 días)</span><b>${entradas.length}</b><small>${visitas.filter(v => v.registradaPor && v.creado >= mes).length} sin anunciar</small></div></div>
      <div class="graficos"><section class="caja"><h2>¿Quién viene?</h2>${barras(contar(visitas.filter(v => (v.ingreso || v.creado) >= mes), v => viTipo(v.tipo)[2]))}</section>
        <section class="caja"><h2>Casas con más visitas</h2>${barras(porCasa, { top: 1 })}</section></div>
      <section class="caja"><h2>Bitácora de visitas</h2><p class="nota" style="margin-top:-4px">Quién autorizó, a qué hora entró y salió, y qué oficial lo registró.</p>
        <div class="filtros"><select id="vfP" aria-label="Período">${[[1,"Hoy"],[7,"Últimos 7 días"],[30,"Últimos 30 días"],[0,"Todo"]].map(([p, t]) => `<option value="${p}" ${vFil.periodo === p ? "selected" : ""}>${t}</option>`).join("")}</select>
          <input id="vfQ" type="search" placeholder="Buscar nombre, placa, casa…" value="${esc(vFil.q)}"><button class="btn sm" type="button" id="vCsv">Descargar Excel (CSV)</button></div>
        <div class="tabla-wrap"><table><tr><th>Visita</th><th>Tipo</th><th>Placa</th><th>Casa</th><th>Autorizó</th><th>Día</th><th>Entró</th><th>Salió</th><th>Estado</th></tr>
          ${l.slice(0, 300).map(v => { const ins = (v.mov || []).filter(m => m.tipo === "in"); return `<tr><td><b>${esc(v.nombre)}</b>${v.nota ? `<br><small class="nota">${esc(v.nota)}</small>` : ""}</td><td>${viTipo(v.tipo)[1]} ${esc(viTipo(v.tipo)[2])}</td><td>${esc(v.placa || "—")}</td><td>${esc(v.casa)}</td>
            <td>${v.registradaPor ? `Sin anunciar<br><small class="nota">${esc(v.registradaPor)}</small>` : esc(v.resNombre || "—")}</td><td>${esc(viCuando(v))}</td>
            <td>${v.ingreso ? `${fecha(v.ingreso)}${ins.length ? `<br><small class="nota">${esc(ins[ins.length - 1].of)}${ins.length > 1 ? ` · ${ins.length} entradas` : ""}</small>` : ""}` : "—"}</td><td>${v.salida && v.estado === "salio" ? fecha(v.salida) : "—"}</td><td>${viEstHTML(v)}</td></tr>`; }).join("")}</table></div>
        <p class="nota">${l.length} visita${l.length === 1 ? "" : "s"}.</p></section>`;
  }
  function ranchosV(){
    const hoyF = hoyL(), mes = reservas.filter(r => r.estado === "activa" && r.fecha.slice(0, 7) === hoyF.slice(0, 7));
    const l = reservas.filter(r => (!rFil.rancho || r.rancho === rFil.rancho) && (rFil.cuando === "prox" ? r.fecha >= hoyF : r.fecha < hoyF))
      .sort((a, b) => rFil.cuando === "prox" ? (a.fecha + a.ini).localeCompare(b.fecha + b.ini) : (b.fecha + b.ini).localeCompare(a.fecha + a.ini));
    return `<div class="kpis">${RANCHOS.map(R => { const m = mes.filter(r => r.rancho === R.n); return `<div><span>${R.nombre}</span><b>${m.length}</b><small>reserva${m.length === 1 ? "" : "s"} este mes · ${m.reduce((t, r) => t + (r.fin - r.ini) / 60, 0)} h</small></div>`; }).join("")}</div>
      <section class="caja"><h2>Hoy</h2>${resumenDia(reservas, hoyF, { verNombre: true })}</section>
      <section class="caja"><h2>Reservas por rancho</h2>
        <div class="filtros"><select id="rfR" aria-label="Rancho"><option value="0">Todos los ranchos</option>${RANCHOS.map(R => `<option value="${R.n}" ${rFil.rancho === R.n ? "selected" : ""}>${R.nombre}</option>`).join("")}</select>
          <select id="rfC" aria-label="Cuándo"><option value="prox" ${rFil.cuando === "prox" ? "selected" : ""}>Próximas</option><option value="pas" ${rFil.cuando === "pas" ? "selected" : ""}>Pasadas</option></select></div>
        <div class="tabla-wrap"><table><tr><th>Día</th><th>Rancho</th><th>Hora</th><th>Casa</th><th>Residente</th><th>Para</th><th>Estado</th><th></th></tr>
          ${l.map(r => `<tr><td>${diaTxt(r.fecha)}</td><td>${rancho(r.rancho).nombre}</td><td>${horario(r)}</td><td>${esc(r.casa)}</td><td>${esc(r.nombre)}</td><td>${esc(r.nota || "—")}</td>
            <td><span class="est ${r.estado === "activa" ? "cerrado" : "nuevo"}">${r.estado === "activa" ? "Reservado" : "Cancelada"}</span>${r.estado === "cancelada" && r.canceladoPor ? `<br><small class="nota">por ${esc(r.canceladoPor)}</small>` : ""}</td>
            <td>${r.estado === "activa" && r.fecha >= hoyF ? `<button class="btn sm" type="button" data-rcan="${esc(r.id)}">${rConf === r.id ? "¿Seguro?" : "Cancelar"}</button>` : ""}</td></tr>`).join("")}</table></div>
        <p class="nota">${l.length} reserva${l.length === 1 ? "" : "s"}.</p></section>`;
  }
  function barras(pares, { top = 0 } = {}){
    const max = Math.max(1, ...pares.map(p => p[1]));
    return pares.length ? `<div class="barras">${pares.map(([l, n], i) => `<div class="barra${i < top ? " top" : ""}"><span title="${esc(l)}">${esc(l)}</span><i style="width:${Math.max(2, n / max * 100)}%"></i><b>${n}</b></div>`).join("")}</div>` : `<p class="nota">Sin datos en este período.</p>`;
  }
  const contar = (lista, f) => { const m = new Map(); lista.forEach(c => { const k = f(c); if (k) m.set(k, (m.get(k) || 0) + 1); }); return [...m].sort((a, b) => b[1] - a[1]); };
  const prom = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : null;
  function estadisticas(){
    const desde = periodo ? Date.now() - periodo * 864e5 : 0, l = casos.filter(c => c.creado >= desde);
    const cer = l.filter(c => c.estado === "cerrado"), abiertos = casos.filter(c => c.estado !== "cerrado");
    const tResp = prom(l.filter(c => c.atendido).map(c => min(c.creado, c.atendido))), tCierre = prom(cer.map(c => min(c.creado, c.cerrado)));
    const conProb = cer.filter(c => c.problema).length, cal = l.filter(c => c.calificacion).map(c => c.calificacion);
    const horas = Array(24).fill(0); l.forEach(c => horas[new Date(c.creado).getHours()]++); const hMax = Math.max(1, ...horas), pico = horas.indexOf(Math.max(...horas));
    const DS = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
    const oficiales = OFICIALES.map(o => { const m = cer.filter(c => c.agente === o); return [o, m.length, prom(m.filter(c => c.atendido).map(c => min(c.creado, c.atendido)))]; }).filter(x => x[1]);
    return `<div class="periodo">${[[7,"Últimos 7 días"],[30,"Últimos 30 días"],[0,"Todo"]].map(([p, t]) => `<button class="btn sm${p === periodo ? " pri" : ""}" type="button" data-p="${p}">${t}</button>`).join("")}</div>
      <div class="kpis">
        <div><span>Reportes</span><b>${l.length}</b><small>${abiertos.length} abiertos ahora</small></div>
        <div><span>Cerrados</span><b>${cer.length}</b><small>${l.length ? Math.round(cer.length / l.length * 100) : 0}% del período</small></div>
        <div><span>Tiempo de respuesta</span><b>${dur(tResp)}</b><small>Del reporte a "voy en camino"</small></div>
        <div><span>Tiempo de cierre</span><b>${dur(tCierre)}</b><small>Del reporte al cierre</small></div>
        <div><span>Cerrados con problemas</span><b>${conProb}</b><small>${cer.length ? Math.round(conProb / cer.length * 100) : 0}% de los cerrados</small></div>
        <div><span>Satisfacción</span><b>${cal.length ? (prom(cal)).toFixed(1) + " ★" : "—"}</b><small>${cal.length} calificaciones</small></div></div>
      <div class="graficos">
        <section class="caja"><h2>¿Qué se reporta más?</h2>${barras(contar(l, c => tipo(c.tipo)[2]), { top: 1 })}</section>
        <section class="caja"><h2>¿Dónde?</h2>${barras(contar(l, c => c.lugar === "Una casa" ? "Casas" : c.lugar).slice(0, 8))}</section>
        <section class="caja"><h2>¿A qué hora?</h2><div class="horas" aria-label="Reportes por hora del día">${horas.map((n, i) => `<i class="${i === pico && n ? "pico" : ""}" style="height:${n / hMax * 100}%" title="${i}:00 · ${n} reportes"></i>`).join("")}</div>
          <div class="horas-et"><span>12 a. m.</span><span>6 a. m.</span><span>12 p. m.</span><span>6 p. m.</span></div>
          <p class="nota">Hora con más reportes: <b>${pico}:00 a ${pico + 1}:00</b>.</p></section>
        <section class="caja"><h2>¿Qué día?</h2>${barras(DS.map((d, i) => [d, l.filter(c => new Date(c.creado).getDay() === i).length]))}</section>
        <section class="caja"><h2>Casas con más reportes en su contra</h2>${barras(contar(l, c => c.contraCasa ? `Casa ${c.contraCasa}` : "").slice(0, 6), { top: 1 })}
          <p class="nota">Sirve para detectar reincidencias y hablar con esos residentes.</p></section>
        <section class="caja"><h2>¿Cómo se cerraron?</h2>${barras(contar(cer, c => resultado(c.resultado)))}</section>
        <section class="caja" style="grid-column:1/-1"><h2>Oficiales de seguridad</h2>${oficiales.length ? `<div class="tabla-wrap"><table style="min-width:0"><tr><th>Oficial</th><th>Casos cerrados</th><th>Respuesta promedio</th></tr>${oficiales.map(([o, n, t]) => `<tr><td>${esc(o)}</td><td>${n}</td><td>${dur(t)}</td></tr>`).join("")}</table></div>` : `<p class="nota">Sin datos.</p>`}</section>
      </div>`;
  }
  function reportes(){
    const q = filtro.q.trim().toLowerCase();
    const l = casos.filter(c => (!filtro.estado || c.estado === filtro.estado) && (!filtro.tipo || c.tipo === filtro.tipo) && (!q || `${c.num} ${c.casa} ${c.nombre} ${donde(c)} ${c.descripcion} ${c.agente}`.toLowerCase().includes(q)));
    return `<section class="caja"><h2>Todos los reportes</h2><p class="nota" style="margin-top:-4px">Los casos los atiende y cierra seguridad. Tocá uno para ver su historial o dejar un comentario de la administración.</p>
      <div class="filtros"><select id="fe" aria-label="Estado"><option value="">Todos los estados</option>${Object.entries(ESTADOS).map(([k, v]) => `<option value="${k}" ${filtro.estado === k ? "selected" : ""}>${v}</option>`).join("")}</select>
        <select id="ft" aria-label="Tipo"><option value="">Todos los tipos</option>${TIPOS.map(([k, ic, n]) => `<option value="${k}" ${filtro.tipo === k ? "selected" : ""}>${n}</option>`).join("")}</select>
        <input id="fq" type="search" placeholder="Buscar casa, nombre, texto…" value="${esc(filtro.q)}"><button class="btn sm" type="button" id="csv">Descargar Excel (CSV)</button></div>
      <div class="tabla-wrap"><table><tr><th>#</th><th>Fecha</th><th>Tipo</th><th>Dónde</th><th>Reportó</th><th>Estado</th><th>Oficial</th><th>Cierre</th></tr>
        ${l.slice(0, 300).map(c => `<tr class="clic" data-caso="${esc(c.id)}"><td>${c.num}</td><td>${fecha(c.creado)}</td><td>${tipo(c.tipo)[1]} ${esc(tipo(c.tipo)[2])}</td><td>${esc(donde(c))}</td><td>Casa ${esc(c.casa)}</td>
          <td><span class="est ${c.estado}">${ESTADOS[c.estado]}</span></td><td>${esc(c.agente || "—")}</td><td>${c.estado === "cerrado" ? esc(resultado(c.resultado)) + (c.problema ? "" : "") : "—"}</td></tr>`).join("")}</table></div>
      <p class="nota">${l.length} reporte${l.length === 1 ? "" : "s"}. Tocá uno para ver el detalle y su historial.</p></section>`;
  }
  function residentesV(){
    return `<section class="caja"><h2>Agregar residente</h2><p class="nota" style="margin-top:-4px">Al guardarlo te sale un link para enviarle. Con ese link crea su contraseña y después entra con su cédula.</p>
      <form id="fRes" novalidate><div class="campo"><label for="nn">Nombre completo</label><input id="nn" maxlength="60" placeholder="Ej.: José Ricardo Montoya"></div>
        <div class="fila2"><div class="campo"><label for="nc">Cédula</label><input id="nc" inputmode="numeric" maxlength="15" placeholder="Ej.: 1111111"></div>
          <div class="campo"><label for="nk">Casa / filial</label><input id="nk" maxlength="10" placeholder="Ej.: 18"></div></div>
        <div class="campo"><label for="nt">Celular (opcional, para mandarle el link)</label><input id="nt" inputmode="tel" maxlength="12" placeholder="Ej.: 8888 7777"></div>
        <p class="err" id="ne"></p><button class="btn pri" type="submit" id="nb">Guardar y crear link</button></form><div id="nuevoLink"></div></section>
      <section class="caja"><h2>Residentes (${residentes.length})</h2>
        <div class="lista">${residentes.map(r => `<div class="caso" style="grid-template-columns:auto minmax(0,1fr) auto;cursor:default"><span class="ic">${I.home}</span>
          <span><b>${esc(r.nombre)}</b><span class="meta">Casa ${esc(r.casa)} · Cédula ****${esc(r.ced4)}</span></span>
          <span class="der"><span class="est ${!r.activo ? "nuevo" : r.conClave ? "cerrado" : "en_atencion"}">${!r.activo ? "Desactivado" : r.conClave ? "Activo" : "Sin contraseña"}</span>
            <span style="display:flex;gap:4px"><button class="btn sm" type="button" data-link="${esc(r.id)}">Link</button><button class="btn sm" type="button" data-act="${esc(r.id)}">${r.activo ? "Desactivar" : "Activar"}</button></span></span></div>`).join("") || `<p class="vacio">Todavía no hay residentes.</p>`}</div></section>`;
  }
  const linkRes = id => new URL("residente.html" + location.search + "#activar=" + id, location.href).href;
  function mostrarLink(r, cont){
    ultimoLink = r;
    const l = linkRes(r.id), tel = Datos.soloDigitos(r.tel), msg = `Hola ${r.nombre.split(" ")[0]}, este es tu acceso para reportar problemas en ${nombreCondo()}. Abrí el link, confirmá tu cédula y creá tu contraseña:\n${l}`;
    cont.innerHTML = `<div class="res-box" style="margin-top:14px"><b>Link de ${esc(r.nombre)}</b><br><span style="word-break:break-all;font-size:13.5px">${esc(l)}</span>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px"><button class="btn sm" type="button" id="cpl">Copiar link</button>
        <a class="btn sm" style="background:#25d366;border-color:#25d366;color:#062b14" target="_blank" rel="noopener" href="https://wa.me/${tel.length === 8 ? "506" + tel : tel}?text=${encodeURIComponent(msg)}">Enviar por WhatsApp</a>
        <a class="btn sm" target="_blank" rel="noopener" href="${esc(l)}">Abrir</a></div></div>`;
    $("#cpl", cont).onclick = async () => { try { await navigator.clipboard.writeText(l); aviso("Link copiado"); } catch { aviso(l); } };
  }
  function ajustes(){
    return `<section class="caja"><h2>Abrir los otros paneles</h2><p class="nota" style="margin-top:-4px">Como administrador también podés ver lo que ven seguridad y los residentes.</p>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px"><a class="btn" href="seguridad.html${location.search}" target="_blank" rel="noopener">Panel de seguridad</a><a class="btn" href="residente.html${location.search}" target="_blank" rel="noopener">Panel de residentes</a></div></section>
      <section class="caja"><h2>Nombre del condominio</h2><div class="campo"><input id="aN" maxlength="50" value="${esc(nombreCondo())}"></div><button class="btn pri" type="button" id="aNg" style="margin-top:10px">Guardar</button>
        <p class="nota">En la demo el nombre se guarda en este celular.</p></section>
      <section class="caja"><h2>Datos de prueba</h2><p class="nota" style="margin-top:-4px">Borra todos los reportes, residentes, reservas, visitas, noticias y emprendimientos y vuelve a cargar un mes de ejemplo.</p><button class="btn rojo" type="button" id="aR" style="margin-top:10px">Reiniciar datos de ejemplo</button></section>`;
  }
  function pintar(){
    const sc = scrollY;
    const nE = casos.filter(c => c.escalado === "pendiente").length, bE = $("#nEsc"); if (bE) { bE.hidden = !nE; bE.textContent = nE; }
    cuerpo.innerHTML = tab === "est" ? estadisticas() : tab === "rep" ? reportes() : tab === "esc" ? escalados() : tab === "not" ? noticiasV() : tab === "emp" ? emprendV() : tab === "ran" ? ranchosV() : tab === "vis" ? visitasV() : tab === "res" ? residentesV() : ajustes();
    if (tab === "not") { ntEdit = null; ntFoto = ""; ntTipoSel = "aviso"; conectarNt(); }
    pintarEm();
    if (tab === "ran") {
      $("#rfR").onchange = e => { rFil.rancho = +e.target.value; pintar(); }; $("#rfC").onchange = e => { rFil.cuando = e.target.value; pintar(); };
      cuerpo.querySelectorAll("[data-rcan]").forEach(b => b.onclick = async () => { const id = b.dataset.rcan;
        if (rConf !== id) { rConf = id; pintar(); setTimeout(() => { if (rConf === id) { rConf = null; if (tab === "ran") pintar(); } }, 4000); return; }
        rConf = null; try { await Datos.cancelarReserva(reservas.find(r => r.id === id), "Administración"); aviso("Reserva cancelada"); } catch { aviso("No se pudo cancelar."); } });
    }
    if (tab === "vis") {
      $("#vfP").onchange = e => { vFil.periodo = +e.target.value; pintar(); };
      $("#vfQ").oninput = e => { vFil.q = e.target.value; const p = e.target.selectionStart; pintar(); const i = $("#vfQ"); i.focus(); i.setSelectionRange(p, p); };
      $("#vCsv").onclick = () => { const filas = [["Visita","Tipo","Placa","Casa","Autorizó","Desde","Hasta","Hora aprox.","Código","Entró","Salió","Oficial entrada","Oficial salida","Estado","Nota"],
        ...visitas.sort((a, b) => (b.ingreso || b.creado) - (a.ingreso || a.creado)).map(v => { const ins = (v.mov || []).filter(m => m.tipo === "in"), outs = (v.mov || []).filter(m => m.tipo === "out");
          return [v.nombre, viTipo(v.tipo)[2], v.placa, v.casa, v.registradaPor ? "Sin anunciar (" + v.registradaPor + ")" : v.resNombre, v.fecha, viHasta(v), v.hora, v.codigo, v.ingreso ? fecha(v.ingreso) : "", v.salida && v.estado === "salio" ? fecha(v.salida) : "",
            ins.length ? ins[ins.length - 1].of : "", outs.length ? outs[outs.length - 1].of : "", (EST_VI[viEstado(v)] || ["", ""])[1], v.nota]; })];
        const csv = "\ufeff" + filas.map(f => f.map(x => `"${String(x ?? "").replace(/"/g, '""')}"`).join(";")).join("\n");
        const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" })); a.download = "bitacora-visitas.csv"; a.click(); };
    }
    if (tab === "rep") {
      $("#fe").onchange = e => { filtro.estado = e.target.value; pintar(); }; $("#ft").onchange = e => { filtro.tipo = e.target.value; pintar(); };
      $("#fq").oninput = e => { filtro.q = e.target.value; const p = e.target.selectionStart; pintar(); const i = $("#fq"); i.focus(); i.setSelectionRange(p, p); };
      $("#csv").onclick = () => { const filas = [["#","Fecha","Tipo","Lugar","Contra casa","Detalle","Reportó","Casa","Estado","Oficial","Respuesta (min)","Cierre (min)","Resultado","Qué se hizo","Problemas","Calificación"],
        ...casos.map(c => [c.num, fecha(c.creado), tipo(c.tipo)[2], c.lugar, c.contraCasa, c.descripcion, c.nombre, c.casa, ESTADOS[c.estado], c.agente, c.atendido ? min(c.creado, c.atendido) : "", c.cerrado ? min(c.creado, c.cerrado) : "", c.resultado ? resultado(c.resultado) : "", c.resolucion, c.problema ? (c.problemaNota || "Sí") : "", c.calificacion || ""])];
        const csv = "\ufeff" + filas.map(f => f.map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(";")).join("\n");
        const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" })); a.download = "reportes-condominio.csv"; a.click(); };
    }
    if (tab === "res") {
      $("#fRes").addEventListener("submit", async e => { e.preventDefault();
        const nombre = $("#nn").value.trim(), ced = Datos.soloDigitos($("#nc").value), casa = $("#nk").value.trim(), tel = $("#nt").value;
        if (nombre.length < 3) { $("#ne").textContent = "Escribí el nombre completo."; return; }
        if (ced.length < 7) { $("#ne").textContent = "Escribí la cédula completa."; return; }
        if (!casa) { $("#ne").textContent = "Escribí la casa o filial."; return; }
        $("#nb").disabled = true; $("#ne").textContent = "";
        try { const id = await Datos.crearResidente({ nombre, cedula: ced, casa, tel }); aviso(`${nombre} agregado`); const cont = $("#nuevoLink"); $("#fRes").reset(); mostrarLink({ id, nombre, tel }, cont); }
        catch (x) { $("#ne").textContent = x.message === "ya-existe" ? "Ya hay un residente con esa cédula." : "No se pudo guardar. Revisá la conexión."; }
        $("#nb").disabled = false; });
      cuerpo.querySelectorAll("[data-link]").forEach(b => b.onclick = () => { const r = residentes.find(x => x.id === b.dataset.link); if (r) { const cont = $("#nuevoLink"); mostrarLink(r, cont); cont.scrollIntoView({ behavior: "smooth", block: "center" }); } });
      cuerpo.querySelectorAll("[data-act]").forEach(b => b.onclick = async () => { const r = residentes.find(x => x.id === b.dataset.act); if (!r) return;
        try { await Datos.cambiarResidente(r.id, { activo: !r.activo }); aviso(r.activo ? `${r.nombre} desactivado: ya no puede ingresar` : `${r.nombre} activado`); } catch { aviso("No se pudo cambiar."); } });
    }
    if (tab === "aj") {
      $("#aNg").onclick = () => { lsSet("condo-nombre", $("#aN").value.trim() || "Condominio Puerto España"); aviso("Nombre guardado"); admin(); };
      let seguro = false;
      $("#aR").onclick = async () => { if (!seguro) { seguro = true; $("#aR").textContent = "Tocá otra vez para confirmar"; setTimeout(() => { seguro = false; const b = $("#aR"); if (b) b.textContent = "Reiniciar datos de ejemplo"; }, 4000); return; }
        $("#aR").disabled = true; try { await Datos.borrarTodo(); const e = generarEjemplo(); await Datos.sembrar(e.casos, e.residentes, e.reservas, e.noticias, e.emprend, e.visitas); aviso("Datos de ejemplo cargados"); } catch { aviso("No se pudo reiniciar."); } $("#aR").disabled = false; };
    }
    if (!["fq", "vfQ"].includes(document.activeElement?.id)) scrollTo(0, sc);
  }
  Datos.escuchar(async lista => { if (await asegurarEjemplo(lista)) return; casos = lista; if (!["res", "not", "emp"].includes(tab)) pintar(); }, () => { cuerpo.innerHTML = `<p class="vacio">No se pudo conectar. Revisá la conexión.</p>`; }).catch(() => {});
  Datos.escucharReservas(l => { reservas = l; if (tab === "ran") pintar(); }).catch(() => {});
  Datos.escucharCol("vi", l => { visitas = l; if (tab === "vis" && document.activeElement?.id !== "vfQ") pintar(); }).catch(() => {});
  Datos.escucharCol("nt", l => { noticias = l; pintarNt(); }).catch(() => {});
  let emAntes = null;
  Datos.escucharCol("em", l => { if (emAntes) { const n = l.find(e => e.estado === "pendiente" && !emAntes.has(e.id)); if (n) aviso(`Nueva solicitud de emprendimiento: ${n.nombre} (casa ${n.casa})`); }
    emAntes = new Set(l.map(e => e.id)); emprend = l; pintarEm(); }).catch(() => {});
  Datos.escucharResidentes(l => { const nuevo = residentes.length !== l.length || JSON.stringify(residentes.map(r => [r.id, r.activo, r.conClave])) !== JSON.stringify(l.map(r => [r.id, r.activo, r.conClave])); residentes = l; if (tab === "res" && nuevo) { pintar(); if (ultimoLink) mostrarLink(ultimoLink, $("#nuevoLink")); } }).catch(() => {});
  pintar();
}

/* ===================== ARRANQUE ===================== */
document.title = ({ residente: "Reportes", seguridad: "Seguridad", admin: "Administración" })[MODO] + " · " + nombreCondo();
// Versiones de los datos de ejemplo: 2 ranchos y escalados, 3 noticias y emprendimientos, 4 visitas (cada una se carga una sola vez para todos).
async function actualizarEjemplo(){
  try { const v = await Datos.version(); if (v >= 4) return; await Datos.ponerVersion(4);
    if (v < 2) { await Datos.borrarTodo(); const e = generarEjemplo(); await Datos.sembrar(e.casos, e.residentes, e.reservas, e.noticias, e.emprend, e.visitas); }
    else { const x = extrasEjemplo(); await Datos.sembrarExtras(v < 3 ? x.noticias : [], v < 3 ? x.emprend : [], x.visitas); } } catch (x) { console.warn(x); }
}
actualizarEjemplo().finally(() => {
  if (MODO === "residente") { residente(); Datos.escuchar(l => asegurarEjemplo(l)).catch(() => {}); }
  else if (MODO === "seguridad") seguridad();
  else admin();
});
})();
