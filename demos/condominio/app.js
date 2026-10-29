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

/* ===================== CATÁLOGOS ===================== */
// [clave, ícono, nombre, prioridad]
const TIPOS = [
  ["ruido","🔊","Ruido o bulla","alta"], ["mascotas","🐶","Mascotas","media"], ["parqueo","🚗","Parqueo","media"],
  ["basura","🗑️","Basura","baja"], ["sucio","🧹","Área común sucia","baja"], ["dano","🔨","Daño o vandalismo","media"],
  ["averia","💡","Avería (luz, agua, portón)","media"], ["velocidad","🏎️","Exceso de velocidad","media"],
  ["seguridad","🚨","Seguridad o sospechoso","alta"], ["otro","📝","Otro","baja"]];
const tipo = k => TIPOS.find(t => t[0] === k) || TIPOS[TIPOS.length - 1];
const LUGARES = ["Una casa","Parque infantil","Rancho / BBQ","Piscina","Gimnasio","Salón de eventos","Parqueo de visitas","Calle interna","Portón / entrada","Zona de basura","Otro"];
const RESULTADOS = [["resuelto","✅ Resuelto"],["llamado","🗣️ Se llamó la atención"],["no_encontrado","🔍 No se encontró el problema"],["falsa","⚪ Falsa alarma"],["escalado","📋 Pasado a administración"]];
const resultado = k => (RESULTADOS.find(r => r[0] === k) || [k, k])[1];
const ESTADOS = { nuevo: "Nuevo", en_atencion: "En atención", cerrado: "Cerrado" };
const OFICIALES = ["Oficial Mora", "Oficial Rojas", "Oficial Vargas"];
const USUARIOS = { seguridad: { usuario: "seguridad", clave: "demo1234", otros: [] }, admin: { usuario: "administrador", clave: "demo1234", otros: ["administracion", "admin"] } };
const RICARDO = { nombre: "José Ricardo Montoya", cedula: "1111111", casa: "18", clave: "demo1234", usuario: "ricardo" };
const nombreCondo = () => lsGet("condo-nombre", "Condominio Vista Verde");

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
function encabezado(rol, extra = ""){
  return `<header class="top"><div class="wrap"><div class="logo" aria-hidden="true">🏘️</div>
    <div><h1>${esc(nombreCondo())}</h1><small>${rol}</small></div>
    <div class="der">${extra}<button class="btn sm" type="button" data-salir>Salir</button></div></div></header>`;
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
    casos.push({ tipo: t, lugar, contraCasa: contra, donde: "", descripcion: de(TXT[t]), foto: "", casa: rep.casa, nombre: rep.nombre, resId: "ej-" + rep.cedula, prioridad: tipo(t)[3],
      estado: "cerrado", agente: ag, resultado: res, resolucion: RESOL[res], problema: prob, problemaNota: prob ? de(PROB) : "", calificacion: cal ? +cal : null, comentarioRes: "",
      creado, atendido: aten, cerrado: cerr,
      historial: [{ t: creado, quien: `${rep.nombre} (casa ${rep.casa})`, txt: "Reporte enviado" }, { t: aten, quien: ag, txt: "Va en camino" }, { t: cerr, quien: ag, txt: `Cerrado: ${resultado(res)}` }] });
  }
  // dos casos abiertos ahora mismo
  const r1 = residentes[0], r2 = residentes[4];
  casos.push({ tipo: "ruido", lugar: "Una casa", contraCasa: "27", donde: "", descripcion: "Música muy alta y gritos en la terraza.", foto: "", casa: r1.casa, nombre: r1.nombre, resId: "ej-" + r1.cedula, prioridad: "alta",
    estado: "nuevo", agente: "", resultado: "", resolucion: "", problema: false, problemaNota: "", calificacion: null, comentarioRes: "", creado: ahora - 6 * 60000, atendido: null, cerrado: null,
    historial: [{ t: ahora - 6 * 60000, quien: `${r1.nombre} (casa ${r1.casa})`, txt: "Reporte enviado" }] });
  casos.push({ tipo: "sucio", lugar: "Rancho / BBQ", contraCasa: "", donde: "Rancho 2", descripcion: "Dejaron la parrilla sucia y basura en la mesa.", foto: "", casa: r2.casa, nombre: r2.nombre, resId: "ej-" + r2.cedula, prioridad: "baja",
    estado: "en_atencion", agente: "Oficial Mora", resultado: "", resolucion: "", problema: false, problemaNota: "", calificacion: null, comentarioRes: "", creado: ahora - 28 * 60000, atendido: ahora - 14 * 60000, cerrado: null,
    historial: [{ t: ahora - 28 * 60000, quien: `${r2.nombre} (casa ${r2.casa})`, txt: "Reporte enviado" }, { t: ahora - 14 * 60000, quien: "Oficial Mora", txt: "Va en camino" }] });
  return { casos, residentes };
}
let sembrando = false;
async function asegurarEjemplo(casos){
  if (casos.length || sembrando || lsGet("condo-sembrado-vacio", false)) return false;
  sembrando = true;
  try { const e = generarEjemplo(); await Datos.sembrar(e.casos, e.residentes); return true; } catch (x) { console.warn(x); return false; } finally { sembrando = false; }
}

/* ===================== DETALLE DE UN CASO ===================== */
function detalleHTML(c, { verReportante = true } = {}){
  const [, ic, nom] = tipo(c.tipo);
  return `<div class="hoja-cab"><div><span class="est ${c.estado}">${ESTADOS[c.estado]}</span><h3 style="margin-top:6px">${ic} ${esc(nom)} · #${c.num}</h3></div><button class="x" type="button" data-cerrar aria-label="Cerrar">×</button></div>
    <dl class="datos"><dt>Dónde</dt><dd>${esc(donde(c)) || "—"}</dd>
      ${verReportante ? `<dt>Reportó</dt><dd>${esc(c.nombre || "Residente")} · Casa ${esc(c.casa)}</dd>` : ""}
      <dt>Hora</dt><dd>${fecha(c.creado)} (${hace(c.creado)})</dd>
      <dt>Prioridad</dt><dd>${c.prioridad === "alta" ? "🔴 Alta" : c.prioridad === "media" ? "🟠 Media" : "🟢 Baja"}</dd>
      ${c.agente ? `<dt>Atiende</dt><dd>${esc(c.agente)}</dd>` : ""}
      ${c.atendido ? `<dt>Respuesta</dt><dd>${dur(min(c.creado, c.atendido))} desde el reporte</dd>` : ""}</dl>
    <p style="margin:12px 0 0;font-size:15.5px">${esc(c.descripcion)}</p>
    ${c.foto ? `<img class="foto-caso" src="${esc(c.foto)}" alt="Foto del reporte">` : ""}
    ${c.estado === "cerrado" ? `<div class="res-box${c.problema ? " prob" : ""}"><b>${esc(resultado(c.resultado))}</b>${c.resolucion ? `<br>${esc(c.resolucion)}` : ""}
      ${c.problema ? `<br><b>⚠️ Hubo problemas:</b> ${esc(c.problemaNota || "Sí")}` : ""}<br><small>Cerrado ${fecha(c.cerrado)} · ${dur(min(c.creado, c.cerrado))} en total</small>
      ${c.calificacion ? `<br><small>Calificación del residente: ${"★".repeat(c.calificacion)}${"☆".repeat(5 - c.calificacion)}${c.comentarioRes ? ` · “${esc(c.comentarioRes)}”` : ""}</small>` : ""}</div>` : ""}
    <h3 style="font-size:15px;margin-top:16px">Historial</h3>
    <ul class="linea-t">${(c.historial || []).map(h => `<li>${esc(h.txt)}<small>${esc(h.quien)} · ${fecha(h.t)}</small></li>`).join("")}</ul>`;
}
const filaCaso = (c, { verReportante = true } = {}) => { const [, ic, nom] = tipo(c.tipo), tarde = c.estado !== "cerrado" && min(c.creado, Date.now()) > 15;
  return `<button type="button" class="caso ${c.estado}${c.prioridad === "alta" && c.estado !== "cerrado" ? " alta" : ""}" data-caso="${esc(c.id)}">
    <span class="ic" aria-hidden="true">${ic}</span>
    <span><b>${esc(nom)} · ${esc(donde(c)) || "Sin lugar"}</b><span class="meta">#${c.num}${verReportante ? ` · Casa ${esc(c.casa)}` : ""} · ${esc(c.descripcion)}</span></span>
    <span class="der"><span class="est ${c.estado}">${ESTADOS[c.estado]}</span><span class="tiempo${tarde ? " tarde" : ""}">${hace(c.creado)}</span></span></button>`; };

/* ===================== INGRESO DE SEGURIDAD Y ADMINISTRACIÓN ===================== */
function loginUsuario(rol, titulo, ico, alEntrar){
  app.innerHTML = `${encabezado(titulo).replace(/<button class="btn sm" type="button" data-salir>Salir<\/button>/, "")}
    <main class="wrap"><form class="caja login" id="fLogin" novalidate><div class="ico">${ico}</div><h2 style="margin-top:6px">${titulo}</h2>
      <div class="campo"><label for="lu">Usuario</label><input id="lu" autocomplete="username" autocapitalize="none"></div>
      <div class="campo"><label for="lc">Contraseña</label><input id="lc" type="password" autocomplete="current-password"></div>
      <p class="err" id="le"></p><button class="btn pri bloque" type="submit">Entrar</button>
      <div class="demo-claves">🔑 <b>Demo:</b> usuario <b>${USUARIOS[rol].usuario}</b> · contraseña <b>${USUARIOS[rol].clave}</b></div></form></main>`;
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
  app.innerHTML = `${encabezado(`Casa ${esc(ses.casa)} · ${esc(ses.nombre)}`)}
    <main class="wrap">
      <section class="caja"><h2>Reportar un problema</h2><p class="nota" style="margin-top:-4px">Tu reporte le llega al instante al oficial de seguridad. Solo lo ven seguridad y la administración.</p>
        <div class="tipos" id="tipos" style="margin-top:12px">${TIPOS.map(([k, ic, n]) => `<button type="button" data-tipo="${k}" aria-pressed="false"><i aria-hidden="true">${ic}</i>${n}</button>`).join("")}</div>
        <form id="fRep" hidden novalidate>
          <div class="fila2"><div class="campo"><label for="rl">¿Dónde?</label><select id="rl">${LUGARES.map(l => `<option>${l}</option>`).join("")}</select></div>
            <div class="campo" id="rcw"><label for="rc">Número de casa</label><input id="rc" inputmode="numeric" maxlength="6" placeholder="Ej.: 27"></div>
            <div class="campo" id="rdw" hidden><label for="rd">¿Dónde exactamente?</label><input id="rd" maxlength="60" placeholder="Ej.: Rancho 2"></div></div>
          <div class="campo"><label for="rx">¿Qué está pasando?</label><textarea id="rx" maxlength="400" placeholder="Contanos con detalle"></textarea></div>
          <div class="campo"><label>Foto (opcional)</label><div class="foto-in"><label class="btn sm" style="cursor:pointer">📷 Agregar foto<input type="file" id="rf" accept="image/*" hidden></label><span id="rfv"></span></div></div>
          <p class="err" id="re"></p><button class="btn pri bloque" type="submit" id="rb">Enviar reporte</button>
        </form></section>
      <section class="caja"><h2>Mis reportes</h2><div class="lista" id="mis"></div></section>
    </main>`;
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
      aviso(`✅ Reporte #${r.num} enviado a seguridad`); sel = null; foto = ""; $("#fRep").reset(); $("#fRep").hidden = true; $("#rfv").innerHTML = "";
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
    lista.filter(c => c.resId === ses.id).forEach(c => { const a = antes[c.id];
      if (a && a !== c.estado) aviso(c.estado === "en_atencion" ? `🚶 ${c.agente || "Seguridad"} va en camino (#${c.num})` : c.estado === "cerrado" ? `✅ Tu reporte #${c.num} se cerró: ${resultado(c.resultado)}` : "");
      antes[c.id] = c.estado; });
    pintar();
  }, () => { $("#mis").innerHTML = `<p class="vacio">No se pudo conectar. Revisá tu conexión.</p>`; }).catch(() => {});
  setInterval(pintar, 60000);
}
function loginResidente(){
  app.innerHTML = `${encabezado("Residentes").replace(/<button class="btn sm" type="button" data-salir>Salir<\/button>/, "")}
    <main class="wrap"><form class="caja login" id="fLogin" novalidate><div class="ico">🏠</div><h2 style="margin-top:6px">Ingresá para reportar</h2>
      <div class="campo"><label for="lu">Cédula o usuario</label><input id="lu" autocomplete="username" autocapitalize="none" placeholder="Ej.: 1 1111 1111"></div>
      <div class="campo"><label for="lc">Contraseña</label><input id="lc" type="password" autocomplete="current-password"></div>
      <p class="err" id="le"></p><button class="btn pri bloque" type="submit" id="lb">Entrar</button>
      <p class="nota">¿No tenés contraseña? La administración te manda un link para crearla.</p>
      <div class="demo-claves">🔑 <b>Demo:</b> usuario <b>ricardo</b> · contraseña <b>demo1234</b> (José Ricardo Montoya, casa 18)</div></form></main>`;
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
  app.innerHTML = `${encabezado("Residentes").replace(/<button class="btn sm" type="button" data-salir>Salir<\/button>/, "")}<main class="wrap"><div class="caja login"><p class="nota">Cargando…</p></div></main>`;
  let r = null; try { r = await Datos.obtenerResidente(id); } catch {}
  const box = $(".login");
  if (!r) { box.innerHTML = `<div class="ico">⚠️</div><h2>Este link no es válido</h2><p class="nota">Pedile a la administración que te lo envíe de nuevo.</p>`; return; }
  box.outerHTML = `<form class="caja login" id="fAct" novalidate><div class="ico">👋</div><h2 style="margin-top:6px">Hola, ${esc(r.nombre.split(" ")[0])}</h2>
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
  if (!lsGet("condo-ses-seguridad", null)) return loginUsuario("seguridad", "Seguridad · Monitoreo", "🛡️", seguridad);
  let casos = [], vista = "pend", conocidos = null, sonido = false, oficial = lsGet("condo-oficial", OFICIALES[0]);
  app.innerHTML = `${encabezado("🛡️ Seguridad · Monitoreo", `<select id="ofi" class="btn sm" aria-label="Oficial de turno">${OFICIALES.map(o => `<option ${o === oficial ? "selected" : ""}>${o}</option>`).join("")}</select>`)}
    <main class="wrap">
      <div class="contadores"><div class="r"><b id="cN">0</b><span>Nuevos</span></div><div class="a"><b id="cA">0</b><span>En atención</span></div><div class="v"><b id="cC">0</b><span>Cerrados hoy</span></div></div>
      <button class="btn bloque" type="button" id="alertas" style="margin-top:10px">🔔 Activar sonido y alertas de reportes nuevos</button>
      <div class="tabs" id="vistas"><button type="button" data-v="pend" aria-pressed="true">Pendientes</button><button type="button" data-v="hoy" aria-pressed="false">Cerrados hoy</button><button type="button" data-v="todos" aria-pressed="false">Últimos 50</button></div>
      <div class="lista" id="lista"></div></main>`;
  $("#ofi").addEventListener("change", e => { oficial = e.target.value; lsSet("condo-oficial", oficial); });
  $("#alertas").addEventListener("click", async () => { sonido = true; pitar(); try { if ("Notification" in window) await Notification.requestPermission(); } catch {}
    $("#alertas").textContent = "🔔 Alertas activadas: suena cuando entra un reporte"; $("#alertas").disabled = true; });
  $("#vistas").addEventListener("click", e => { const b = e.target.closest("[data-v]"); if (!b) return; vista = b.dataset.v; document.querySelectorAll("#vistas button").forEach(x => x.setAttribute("aria-pressed", String(x === b))); pintar(); });
  $("#lista").addEventListener("click", e => { const b = e.target.closest("[data-caso]"); if (b) abrir(b.dataset.caso); });
  let ctx = null;
  function pitar(){ try { ctx = ctx || new (window.AudioContext || window.webkitAudioContext)(); [0, .25].forEach(d => { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = 880; o.connect(g); g.connect(ctx.destination); g.gain.setValueAtTime(.25, ctx.currentTime + d); g.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + d + .2); o.start(ctx.currentTime + d); o.stop(ctx.currentTime + d + .22); }); } catch {} }
  const inicioHoy = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); };
  const prio = { alta: 0, media: 1, baja: 2 };
  function pintar(){
    const nuevos = casos.filter(c => c.estado === "nuevo"), aten = casos.filter(c => c.estado === "en_atencion"), hoy = casos.filter(c => c.estado === "cerrado" && c.cerrado >= inicioHoy());
    $("#cN").textContent = nuevos.length; $("#cA").textContent = aten.length; $("#cC").textContent = hoy.length;
    const pend = [...nuevos.sort((a, b) => prio[a.prioridad] - prio[b.prioridad] || a.creado - b.creado), ...aten.sort((a, b) => a.creado - b.creado)];
    const l = vista === "pend" ? pend : vista === "hoy" ? hoy : casos.slice(0, 50);
    $("#lista").innerHTML = l.length ? l.map(c => filaCaso(c)).join("") : `<p class="vacio">${vista === "pend" ? "✅ No hay reportes pendientes." : "No hay casos."}</p>`;
    document.title = (nuevos.length ? `(${nuevos.length}) ` : "") + "Seguridad · " + nombreCondo();
  }
  function abrir(id){
    const c = casos.find(x => x.id === id); if (!c) return;
    let res = "", prob = false;
    hoja(detalleHTML(c) + (c.estado === "nuevo" ? `<button class="btn pri bloque" type="button" id="tomar" style="margin-top:16px">🚶 Voy en camino</button>`
      : c.estado === "en_atencion" ? `<div class="caja"><h2 style="font-size:17px">Cerrar el caso</h2>
        <div class="campo"><label>¿Cómo terminó?</label><div class="ops" id="resu">${RESULTADOS.map(([k, l]) => `<button type="button" data-r="${k}" aria-pressed="false">${l}</button>`).join("")}</div></div>
        <div class="campo"><label for="cres">¿Qué se hizo?</label><textarea id="cres" maxlength="300" placeholder="Ej.: Se habló con los residentes de la casa 27 y bajaron el volumen."></textarea></div>
        <label style="display:flex;gap:8px;align-items:center;margin-top:10px;font-weight:700"><input type="checkbox" id="cprob" style="width:20px;height:20px"> Hubo problemas al atenderlo</label>
        <div class="campo" id="cpw" hidden><label for="cpn">¿Qué pasó?</label><input id="cpn" maxlength="150" placeholder="Ej.: No abrieron la puerta, se tuvo que volver."></div>
        <div class="campo"><label for="cnota">Nota sin cerrar (opcional)</label><div style="display:flex;gap:6px"><input id="cnota" maxlength="150" placeholder="Ej.: Llegué, sigo verificando"><button class="btn sm" type="button" id="bnota">Agregar</button></div></div>
        <p class="err" id="cerr"></p><button class="btn pri bloque" type="button" id="bcerrar" style="margin-top:6px">Cerrar caso</button></div>` : ""), (h, cerrar) => {
      $("#tomar", h)?.addEventListener("click", async () => { try { await Datos.actualizar(c.id, { estado: "en_atencion", atendido: true, agente: oficial }, { quien: oficial, txt: "Va en camino" }); aviso(`Caso #${c.num}: vas en camino`); cerrar(); setTimeout(() => abrir(c.id), 400); } catch { aviso("No se pudo actualizar."); } });
      $("#resu", h)?.addEventListener("click", e => { const b = e.target.closest("[data-r]"); if (!b) return; res = b.dataset.r; h.querySelectorAll("#resu button").forEach(x => x.setAttribute("aria-pressed", String(x === b))); });
      $("#cprob", h)?.addEventListener("change", e => { prob = e.target.checked; $("#cpw", h).hidden = !prob; });
      $("#bnota", h)?.addEventListener("click", async () => { const t = $("#cnota", h).value.trim(); if (!t) return; try { await Datos.actualizar(c.id, {}, { quien: oficial, txt: "Nota: " + t }); aviso("Nota agregada"); cerrar(); setTimeout(() => abrir(c.id), 400); } catch { aviso("No se pudo guardar."); } });
      $("#bcerrar", h)?.addEventListener("click", async () => {
        const txt = $("#cres", h).value.trim();
        if (!res) { $("#cerr", h).textContent = "Escogé cómo terminó."; return; }
        if (txt.length < 3) { $("#cerr", h).textContent = "Escribí qué se hizo."; $("#cres", h).focus(); return; }
        try { await Datos.actualizar(c.id, { estado: "cerrado", cerrado: true, agente: c.agente || oficial, resultado: res, resolucion: txt, problema: prob, problemaNota: prob ? $("#cpn", h).value.trim() : "" }, { quien: oficial, txt: `Cerrado: ${resultado(res)}` });
          aviso(`✅ Caso #${c.num} cerrado`); cerrar(); } catch { aviso("No se pudo cerrar. Revisá la conexión."); }
      });
    });
  }
  Datos.escuchar(async lista => {
    if (await asegurarEjemplo(lista)) return;
    if (conocidos) { const nuevos = lista.filter(c => c.estado === "nuevo" && !conocidos.has(c.id));
      if (nuevos.length) { const c = nuevos[0]; aviso(`🔔 Nuevo reporte #${c.num}: ${tipo(c.tipo)[2]} · ${donde(c)}`); if (sonido) pitar(); if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
        try { if (document.hidden && Notification.permission === "granted") new Notification(`Nuevo reporte #${c.num}`, { body: `${tipo(c.tipo)[2]} · ${donde(c)}` }); } catch {} } }
    conocidos = new Set(lista.map(c => c.id)); casos = lista; pintar();
  }, () => { $("#lista").innerHTML = `<p class="vacio">No se pudo conectar. Revisá la conexión.</p>`; }).catch(() => {});
  setInterval(pintar, 30000);
}

/* ===================== PANEL DE ADMINISTRACIÓN ===================== */
function admin(){
  if (!lsGet("condo-ses-admin", null)) return loginUsuario("admin", "Administración", "📊", admin);
  let ultimoLink = null, casos = [], residentes = [], tab = lsGet("condo-admin-tab", "est"), periodo = 30, filtro = { estado: "", tipo: "", q: "" };
  app.innerHTML = `${encabezado("📊 Administración")}
    <main class="wrap">
      <div class="tabs" id="tabs">${[["est","📊 Estadísticas"],["rep","📋 Reportes"],["res","👥 Residentes"],["aj","⚙️ Ajustes"]].map(([k, l]) => `<button type="button" data-t="${k}" aria-pressed="${k === tab}">${l}</button>`).join("")}</div>
      <div id="cuerpo"></div></main>`;
  $("#tabs").addEventListener("click", e => { const b = e.target.closest("[data-t]"); if (!b) return; tab = b.dataset.t; lsSet("condo-admin-tab", tab); document.querySelectorAll("#tabs button").forEach(x => x.setAttribute("aria-pressed", String(x === b))); pintar(); });
  const cuerpo = $("#cuerpo");
  cuerpo.addEventListener("click", e => {
    const p = e.target.closest("[data-p]"); if (p) { periodo = +p.dataset.p; pintar(); return; }
    const c = e.target.closest("[data-caso]"); if (c) { const k = casos.find(x => x.id === c.dataset.caso); if (k) hoja(detalleHTML(k) + `<p class="nota" style="margin-top:14px">👁️ Vista de solo lectura: el caso lo atiende seguridad.</p>`); return; }
  });
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
        <section class="caja"><h2>¿Qué se reporta más?</h2>${barras(contar(l, c => `${tipo(c.tipo)[1]} ${tipo(c.tipo)[2]}`), { top: 1 })}</section>
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
    return `<section class="caja"><h2>Todos los reportes</h2><p class="nota" style="margin-top:-4px">👁️ Solo lectura: los casos los atiende y cierra seguridad.</p>
      <div class="filtros"><select id="fe" aria-label="Estado"><option value="">Todos los estados</option>${Object.entries(ESTADOS).map(([k, v]) => `<option value="${k}" ${filtro.estado === k ? "selected" : ""}>${v}</option>`).join("")}</select>
        <select id="ft" aria-label="Tipo"><option value="">Todos los tipos</option>${TIPOS.map(([k, ic, n]) => `<option value="${k}" ${filtro.tipo === k ? "selected" : ""}>${ic} ${n}</option>`).join("")}</select>
        <input id="fq" type="search" placeholder="Buscar casa, nombre, texto…" value="${esc(filtro.q)}"><button class="btn sm" type="button" id="csv">⬇️ Descargar Excel (CSV)</button></div>
      <div class="tabla-wrap"><table><tr><th>#</th><th>Fecha</th><th>Tipo</th><th>Dónde</th><th>Reportó</th><th>Estado</th><th>Oficial</th><th>Cierre</th></tr>
        ${l.slice(0, 300).map(c => `<tr class="clic" data-caso="${esc(c.id)}"><td>${c.num}</td><td>${fecha(c.creado)}</td><td>${tipo(c.tipo)[1]} ${esc(tipo(c.tipo)[2])}</td><td>${esc(donde(c))}</td><td>Casa ${esc(c.casa)}</td>
          <td><span class="est ${c.estado}">${ESTADOS[c.estado]}</span></td><td>${esc(c.agente || "—")}</td><td>${c.estado === "cerrado" ? esc(resultado(c.resultado)) + (c.problema ? " ⚠️" : "") : "—"}</td></tr>`).join("")}</table></div>
      <p class="nota">${l.length} reporte${l.length === 1 ? "" : "s"}. Tocá uno para ver el detalle y su historial.</p></section>`;
  }
  function residentesV(){
    return `<section class="caja"><h2>➕ Agregar residente</h2><p class="nota" style="margin-top:-4px">Al guardarlo te sale un link para enviarle. Con ese link crea su contraseña y después entra con su cédula.</p>
      <form id="fRes" novalidate><div class="campo"><label for="nn">Nombre completo</label><input id="nn" maxlength="60" placeholder="Ej.: José Ricardo Montoya"></div>
        <div class="fila2"><div class="campo"><label for="nc">Cédula</label><input id="nc" inputmode="numeric" maxlength="15" placeholder="Ej.: 1111111"></div>
          <div class="campo"><label for="nk">Casa / filial</label><input id="nk" maxlength="10" placeholder="Ej.: 18"></div></div>
        <div class="campo"><label for="nt">Celular (opcional, para mandarle el link)</label><input id="nt" inputmode="tel" maxlength="12" placeholder="Ej.: 8888 7777"></div>
        <p class="err" id="ne"></p><button class="btn pri" type="submit" id="nb">Guardar y crear link</button></form><div id="nuevoLink"></div></section>
      <section class="caja"><h2>👥 Residentes (${residentes.length})</h2>
        <div class="lista">${residentes.map(r => `<div class="caso" style="grid-template-columns:auto minmax(0,1fr) auto;cursor:default"><span class="ic">🏠</span>
          <span><b>${esc(r.nombre)}</b><span class="meta">Casa ${esc(r.casa)} · Cédula ****${esc(r.ced4)}</span></span>
          <span class="der"><span class="est ${!r.activo ? "nuevo" : r.conClave ? "cerrado" : "en_atencion"}">${!r.activo ? "Desactivado" : r.conClave ? "Activo" : "Sin contraseña"}</span>
            <span style="display:flex;gap:4px"><button class="btn sm" type="button" data-link="${esc(r.id)}">🔗 Link</button><button class="btn sm" type="button" data-act="${esc(r.id)}">${r.activo ? "Desactivar" : "Activar"}</button></span></span></div>`).join("") || `<p class="vacio">Todavía no hay residentes.</p>`}</div></section>`;
  }
  const linkRes = id => new URL("residente.html" + location.search + "#activar=" + id, location.href).href;
  function mostrarLink(r, cont){
    ultimoLink = r;
    const l = linkRes(r.id), tel = Datos.soloDigitos(r.tel), msg = `Hola ${r.nombre.split(" ")[0]} 👋, este es tu acceso para reportar problemas en ${nombreCondo()}. Abrí el link, confirmá tu cédula y creá tu contraseña:\n${l}`;
    cont.innerHTML = `<div class="res-box" style="margin-top:14px"><b>✅ Link de ${esc(r.nombre)}</b><br><span style="word-break:break-all;font-size:13.5px">${esc(l)}</span>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px"><button class="btn sm" type="button" id="cpl">📋 Copiar link</button>
        <a class="btn sm" style="background:#25d366;border-color:#25d366;color:#062b14" target="_blank" rel="noopener" href="https://wa.me/${tel.length === 8 ? "506" + tel : tel}?text=${encodeURIComponent(msg)}">Enviar por WhatsApp</a>
        <a class="btn sm" target="_blank" rel="noopener" href="${esc(l)}">Abrir</a></div></div>`;
    $("#cpl", cont).onclick = async () => { try { await navigator.clipboard.writeText(l); aviso("Link copiado"); } catch { aviso(l); } };
  }
  function ajustes(){
    return `<section class="caja"><h2>Abrir los otros paneles</h2><p class="nota" style="margin-top:-4px">Como administrador también podés ver lo que ven seguridad y los residentes.</p>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px"><a class="btn" href="seguridad.html${location.search}" target="_blank" rel="noopener">🛡️ Panel de seguridad</a><a class="btn" href="residente.html${location.search}" target="_blank" rel="noopener">🏠 Panel de residentes</a></div></section>
      <section class="caja"><h2>Nombre del condominio</h2><div class="campo"><input id="aN" maxlength="50" value="${esc(nombreCondo())}"></div><button class="btn pri" type="button" id="aNg" style="margin-top:10px">Guardar</button>
        <p class="nota">En la demo el nombre se guarda en este celular.</p></section>
      <section class="caja"><h2>Datos de prueba</h2><p class="nota" style="margin-top:-4px">Borra todos los reportes y residentes y vuelve a cargar un mes de ejemplo.</p><button class="btn rojo" type="button" id="aR" style="margin-top:10px">Reiniciar datos de ejemplo</button></section>`;
  }
  function pintar(){
    const sc = scrollY;
    cuerpo.innerHTML = tab === "est" ? estadisticas() : tab === "rep" ? reportes() : tab === "res" ? residentesV() : ajustes();
    if (tab === "rep") {
      $("#fe").onchange = e => { filtro.estado = e.target.value; pintar(); }; $("#ft").onchange = e => { filtro.tipo = e.target.value; pintar(); };
      $("#fq").oninput = e => { filtro.q = e.target.value; const p = e.target.selectionStart; pintar(); const i = $("#fq"); i.focus(); i.setSelectionRange(p, p); };
      $("#csv").onclick = () => { const filas = [["#","Fecha","Tipo","Lugar","Contra casa","Detalle","Reportó","Casa","Estado","Oficial","Respuesta (min)","Cierre (min)","Resultado","Qué se hizo","Problemas","Calificación"],
        ...casos.map(c => [c.num, fecha(c.creado), tipo(c.tipo)[2], c.lugar, c.contraCasa, c.descripcion, c.nombre, c.casa, ESTADOS[c.estado], c.agente, c.atendido ? min(c.creado, c.atendido) : "", c.cerrado ? min(c.creado, c.cerrado) : "", c.resultado ? resultado(c.resultado).replace(/^\S+ /, "") : "", c.resolucion, c.problema ? (c.problemaNota || "Sí") : "", c.calificacion || ""])];
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
        try { const id = await Datos.crearResidente({ nombre, cedula: ced, casa, tel }); aviso(`✅ ${nombre} agregado`); const cont = $("#nuevoLink"); $("#fRes").reset(); mostrarLink({ id, nombre, tel }, cont); }
        catch (x) { $("#ne").textContent = x.message === "ya-existe" ? "Ya hay un residente con esa cédula." : "No se pudo guardar. Revisá la conexión."; }
        $("#nb").disabled = false; });
      cuerpo.querySelectorAll("[data-link]").forEach(b => b.onclick = () => { const r = residentes.find(x => x.id === b.dataset.link); if (r) { const cont = $("#nuevoLink"); mostrarLink(r, cont); cont.scrollIntoView({ behavior: "smooth", block: "center" }); } });
      cuerpo.querySelectorAll("[data-act]").forEach(b => b.onclick = async () => { const r = residentes.find(x => x.id === b.dataset.act); if (!r) return;
        try { await Datos.cambiarResidente(r.id, { activo: !r.activo }); aviso(r.activo ? `${r.nombre} desactivado: ya no puede ingresar` : `${r.nombre} activado`); } catch { aviso("No se pudo cambiar."); } });
    }
    if (tab === "aj") {
      $("#aNg").onclick = () => { lsSet("condo-nombre", $("#aN").value.trim() || "Condominio Vista Verde"); aviso("Nombre guardado"); admin(); };
      let seguro = false;
      $("#aR").onclick = async () => { if (!seguro) { seguro = true; $("#aR").textContent = "Tocá otra vez para confirmar"; setTimeout(() => { seguro = false; const b = $("#aR"); if (b) b.textContent = "Reiniciar datos de ejemplo"; }, 4000); return; }
        $("#aR").disabled = true; try { await Datos.borrarTodo(); const e = generarEjemplo(); await Datos.sembrar(e.casos, e.residentes); aviso("Datos de ejemplo cargados"); } catch { aviso("No se pudo reiniciar."); } $("#aR").disabled = false; };
    }
    if (tab !== "rep" || document.activeElement?.id !== "fq") scrollTo(0, sc);
  }
  Datos.escuchar(async lista => { if (await asegurarEjemplo(lista)) return; casos = lista; if (tab !== "res") pintar(); }, () => { cuerpo.innerHTML = `<p class="vacio">No se pudo conectar. Revisá la conexión.</p>`; }).catch(() => {});
  Datos.escucharResidentes(l => { const nuevo = residentes.length !== l.length || JSON.stringify(residentes.map(r => [r.id, r.activo, r.conClave])) !== JSON.stringify(l.map(r => [r.id, r.activo, r.conClave])); residentes = l; if (tab === "res" && nuevo) { pintar(); if (ultimoLink) mostrarLink(ultimoLink, $("#nuevoLink")); } }).catch(() => {});
  pintar();
}

/* ===================== ARRANQUE ===================== */
document.title = ({ residente: "Reportes", seguridad: "Seguridad", admin: "Administración" })[MODO] + " · " + nombreCondo();
if (MODO === "residente") { residente(); Datos.escuchar(l => asegurarEjemplo(l)).catch(() => {}); }
else if (MODO === "seguridad") seguridad();
else admin();
})();
