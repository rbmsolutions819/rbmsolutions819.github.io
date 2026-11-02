/* RBM Solutions · capa 3.0 para las demos.
   Se configura con window.RBM3 = { nombre, mono, lema, c1, c2, fondo, tinta, font, fx, colores, hero, cards, cinta, ... } antes de cargar este archivo. */
(() => {
  "use strict";
  const C = Object.assign({ nombre: document.title.split("·")[0].trim(), mono: "", lema: "", c1: "#8cc4ff", c2: "#ff6b9a", fondo: "#0b0b10", tinta: "#ffffff",
    font: "system-ui,sans-serif", fx: "oro", colores: null, hero: "header, .hero", cards: "", cinta: [], cintaDespues: null, tilt: true, intro: true, mezcla: "screen", densidad: 1, arriba: true, parallax: true }, window.RBM3 || {});
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const QUIETO = matchMedia("(prefers-reduced-motion: reduce)").matches, FINO = matchMedia("(pointer: fine)").matches;
  const raiz = document.documentElement.style;
  [["--r3-c1", C.c1], ["--r3-c2", C.c2], ["--r3-fondo", C.fondo], ["--r3-tinta", C.tinta], ["--r3-font", C.font], ["--r3-mezcla", C.mezcla]].forEach(([k, v]) => raiz.setProperty(k, v));
  if (C.cinta1) raiz.setProperty("--r3-cinta1", C.cinta1); if (C.cinta2) raiz.setProperty("--r3-cinta2", C.cinta2); if (C.cintaT) raiz.setProperty("--r3-cinta-t", C.cintaT);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  /* ---- 1. Entrada con la marca (una vez por visita) ---- */
  const llave = "r3-intro-" + location.pathname;
  let ya = false; try { ya = sessionStorage.getItem(llave) === "1"; sessionStorage.setItem(llave, "1"); } catch {}
  if (C.intro && !ya && !QUIETO) {
    const el = document.createElement("div"); el.className = "r3-intro"; el.setAttribute("aria-hidden", "true");
    const mono = C.mono || C.nombre.replace(/[^A-Za-zÁÉÍÓÚÑáéíóúñ]/g, "").slice(0, 1).toUpperCase();
    el.innerHTML = `<div><svg class="r3-mono" viewBox="0 0 140 140"><circle cx="70" cy="70" r="64"/><text x="70" y="88" text-anchor="middle">${esc(mono)}</text></svg>
      <div class="r3-nombre">${[...C.nombre].map((ch, i) => `<span style="animation-delay:${(.45 + i * .04).toFixed(2)}s">${ch === " " ? "&nbsp;" : esc(ch)}</span>`).join("")}</div>
      ${C.lema ? `<div class="r3-lema">${esc(C.lema)}</div>` : ""}<div class="r3-barra"><i></i></div></div>`;
    (document.body || document.documentElement).append(el);
    const fin = () => { if (el.classList.contains("fuera")) return; el.classList.add("fuera"); setTimeout(() => el.remove(), 1000); };
    el.addEventListener("click", fin); setTimeout(fin, 2100);
  }

  const listo = f => document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", f) : f();
  listo(() => {
    /* ---- 2. Barra de avance ---- */
    const barra = document.createElement("div"); barra.className = "r3-progreso"; barra.setAttribute("aria-hidden", "true"); document.body.append(barra);
    let arriba = null;
    if (C.arriba) { arriba = document.createElement("button"); arriba.type = "button"; arriba.className = "r3-arriba"; arriba.setAttribute("aria-label", "Volver arriba");
      arriba.innerHTML = `<svg class="anillo" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="22"/></svg><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>`;
      arriba.addEventListener("click", () => scrollTo({ top: 0, behavior: QUIETO ? "auto" : "smooth" })); document.body.append(arriba); }
    const hero = C.hero ? $(C.hero) : null;
    const heroIn = hero && C.parallax && !QUIETO ? (C.heroIn ? $(C.heroIn, hero) : null) : null;
    let pend = false;
    const alBajar = () => { pend = false; const h = document.documentElement, m = h.scrollHeight - h.clientHeight, f = m > 0 ? scrollY / m : 0;
      barra.style.transform = `scaleX(${f})`;
      if (arriba) { arriba.classList.toggle("on", scrollY > innerHeight * 1.2); arriba.style.setProperty("--r3-av", (138 - 138 * f).toFixed(1)); }
      if (heroIn) { const r = hero.getBoundingClientRect(); if (r.bottom > 0) { const k = Math.min(1, Math.max(0, -r.top / r.height)); heroIn.style.transform = `translateY(${k * 80}px)`; heroIn.style.opacity = String(1 - k * 1.1); } } };
    addEventListener("scroll", () => { if (!pend) { pend = true; requestAnimationFrame(alBajar); } }, { passive: true }); alBajar();
    if (heroIn) heroIn.classList.add("r3-hero-in");

    /* ---- 3. Cinta con frases del negocio ---- */
    if (C.cinta && C.cinta.length) { const ref = C.cintaDespues ? $(C.cintaDespues) : hero;
      if (ref) { const c = document.createElement("div"); c.className = "r3-cinta"; c.setAttribute("aria-hidden", "true");
        const fr = C.cinta.map(t => `<span>${esc(t)}</span>`).join(""); c.innerHTML = `<div>${fr}${fr}${fr}${fr}</div>`; ref.after(c);
        requestAnimationFrame(() => c.firstChild.style.setProperty("--r3-vel", Math.max(30, c.firstChild.scrollWidth / 2 / 40) + "s")); } }

    /* ---- 4. Partículas del negocio en la portada ---- */
    if (hero && C.fx !== "nada" && !QUIETO) particulas(hero);

    /* ---- 5. Aparecer al bajar, luz e imágenes que se enfocan ---- */
    const io = "IntersectionObserver" in window ? new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("r3-vis"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -6% 0px", threshold: .05 }) : null;
    const sel = [C.cards, "main h2", "section h2"].filter(Boolean).join(",");
    const visto = new WeakSet();
    const preparar = root => {
      if (!io) return;
      const grupos = new Map();
      $$(sel, root).forEach(el => { if (visto.has(el) || el.closest(".r3-intro") || (hero && hero.contains(el))) return; visto.add(el);
        const r = el.getBoundingClientRect(); if (r.top < innerHeight && r.bottom > 0) return;   // lo que ya se ve no se esconde
        const p = el.parentElement, n = grupos.get(p) || 0; grupos.set(p, n + 1);
        el.style.setProperty("--r3-d", (n % 6) * 70 + "ms"); el.classList.add("r3-rv"); io.observe(el); });
      if (C.cards) $$(C.cards, root).forEach(el => { if (el.classList.contains("r3-luz") || el.dataset.r3l) return; el.dataset.r3l = "1"; const cs = getComputedStyle(el);
        if (cs.position !== "absolute" && cs.position !== "fixed" && getComputedStyle(el, "::after").content === "none") el.classList.add("r3-luz"); });
      $$("img", root).forEach(img => { if (img.dataset.r3 || img.closest(".r3-intro") || (hero && hero.contains(img))) return; img.dataset.r3 = "1";
        if (img.complete && img.naturalWidth) return; img.classList.add("r3-img"); const ok = () => img.classList.add("r3-ok"); img.addEventListener("load", ok, { once: true }); img.addEventListener("error", ok, { once: true }); setTimeout(ok, 4000); });
    };
    if (!QUIETO) { preparar(document);
      let t; new MutationObserver(() => { clearTimeout(t); t = setTimeout(() => preparar(document), 60); }).observe(document.body, { childList: true, subtree: true }); }

    /* ---- 6. Tarjetas que se inclinan y luz que sigue el mouse ---- */
    if (C.cards && FINO && !QUIETO) {
      document.addEventListener("pointermove", e => { const c = e.target.closest?.(C.cards); if (!c) return; const r = c.getBoundingClientRect();
        c.style.setProperty("--r3-mx", (e.clientX - r.left) + "px"); c.style.setProperty("--r3-my", (e.clientY - r.top) + "px");
        if (C.tilt) { const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5; c.style.transform = `perspective(800px) rotateX(${(-y * 6).toFixed(2)}deg) rotateY(${(x * 8).toFixed(2)}deg) translateY(-3px)`; c.style.transition = "transform .12s ease-out"; } }, { passive: true });
      if (C.tilt) document.addEventListener("pointerout", e => { const c = e.target.closest?.(C.cards); if (c && !c.contains(e.relatedTarget)) { c.style.transform = ""; c.style.transition = "transform .5s cubic-bezier(.2,.7,.2,1)"; } });
    }
    if (FINO && !QUIETO) { const cu = document.createElement("div"); cu.className = "r3-cursor"; cu.setAttribute("aria-hidden", "true"); document.body.append(cu);
      let mx = 0, my = 0, cx = 0, cy = 0, on = false, corre = false;
      const ani = () => { cx += (mx - cx) * .14; cy += (my - cy) * .14; cu.style.transform = `translate(${cx}px,${cy}px)`; if (Math.abs(mx - cx) + Math.abs(my - cy) > .5) requestAnimationFrame(ani); else corre = false; };
      addEventListener("pointermove", e => { mx = e.clientX; my = e.clientY; if (!on) { on = true; cu.classList.add("on"); cx = mx; cy = my; } if (!corre) { corre = true; requestAnimationFrame(ani); } }, { passive: true });
      document.addEventListener("pointerleave", () => { on = false; cu.classList.remove("on"); });
      // botones de la portada que se acercan al mouse
      if (hero) $$("a,button", hero).forEach(b => { if (b.offsetWidth > 360) return; b.addEventListener("pointermove", e => { const r = b.getBoundingClientRect(); b.style.translate = `${((e.clientX - r.left - r.width / 2) * .15).toFixed(1)}px ${((e.clientY - r.top - r.height / 2) * .25).toFixed(1)}px`; });
        b.addEventListener("pointerleave", () => b.style.translate = ""); });
    }

    /* ---- Enlaces entre páginas de la misma demo 3.0 ---- */
    if (C.links) document.addEventListener("click", e => { const a = e.target.closest?.("a[href]"); if (!a) return; const u = new URL(a.href, location.href);
      const k = Object.keys(C.links).find(n => u.pathname.endsWith("/" + n)); if (k) { e.preventDefault(); location.href = u.pathname.replace(new RegExp(k.replace(".", "\\.") + "$"), C.links[k]) + u.search + u.hash; } }, true);

    /* ---- 7. Onda al tocar cualquier botón ---- */
    if (!QUIETO) document.addEventListener("pointerdown", e => { const b = e.target.closest?.("button,a,[role=button],label"); if (!b || b.closest(".r3-intro")) return;
      const o = document.createElement("i"); o.className = "r3-onda"; o.style.left = e.clientX + "px"; o.style.top = e.clientY + "px"; document.body.append(o);
      o.animate([{ transform: "scale(.4)", opacity: .9 }, { transform: "scale(4.5)", opacity: 0 }], { duration: 550, easing: "cubic-bezier(.2,.7,.2,1)" }).onfinish = () => o.remove(); }, { passive: true });
  });

  /* ---- Partículas: cada negocio con su ambiente ---- */
  function particulas(host) {
    if (getComputedStyle(host).position === "static") host.style.position = "relative";
    const cv = document.createElement("canvas"); cv.className = "r3-fx"; cv.setAttribute("aria-hidden", "true"); host.append(cv);
    const x = cv.getContext("2d"), tipo = C.fx;
    const COL = C.colores || [C.c1, C.c2];
    let W = 0, H = 0, ps = [], on = true, t = 0;
    const azar = (a, b) => a + Math.random() * (b - a), col = () => COL[Math.floor(Math.random() * COL.length)];
    const baja = ["petalos", "hojas", "confeti", "nieve"].includes(tipo);
    const nueva = ini => { const p = { x: azar(0, W), y: ini ? azar(0, H) : (baja ? -20 : H + 20), c: col(), a: azar(0, 6.3), r: azar(0, 6.3), vr: azar(-.02, .02), f: azar(0, 6.3) };
      switch (tipo) {
        case "petalos": Object.assign(p, { s: azar(5, 10), vy: azar(.35, .9), vx: azar(-.3, .3) }); break;
        case "hojas": Object.assign(p, { s: azar(6, 11), vy: azar(.3, .8), vx: azar(-.4, .4) }); break;
        case "confeti": Object.assign(p, { s: azar(4, 8), vy: azar(.6, 1.4), vx: azar(-.5, .5), vr: azar(-.1, .1) }); break;
        case "nieve": Object.assign(p, { s: azar(1, 3), vy: azar(.2, .6), vx: azar(-.2, .2) }); break;
        case "burbujas": Object.assign(p, { s: azar(3, 9), vy: -azar(.3, .9), vx: 0 }); break;
        case "brasas": Object.assign(p, { s: azar(1, 2.6), vy: -azar(.4, 1.2), vx: azar(-.2, .2) }); break;
        case "bokeh": Object.assign(p, { s: azar(18, 60), vy: -azar(.05, .25), vx: azar(-.15, .15) }); break;
        case "estrellas": Object.assign(p, { s: azar(.6, 1.8), vy: 0, vx: 0 }); break;
        case "datos": Object.assign(p, { s: azar(1.2, 2.2), vy: azar(-.3, .3), vx: azar(-.3, .3) }); break;
        default: Object.assign(p, { s: azar(.8, 2.2), vy: -azar(.15, .55), vx: 0 }); }  // oro
      return p; };
    const tam = () => { const dpr = Math.min(2, devicePixelRatio || 1); W = host.clientWidth; H = host.clientHeight; cv.width = W * dpr; cv.height = H * dpr; x.setTransform(dpr, 0, 0, dpr, 0, 0);
      const base = { petalos: 26, hojas: 22, confeti: 40, nieve: 60, burbujas: 30, brasas: 50, bokeh: 14, estrellas: 90, datos: 46, oro: 60 }[tipo] || 50;
      ps = Array.from({ length: Math.round(base * C.densidad * Math.min(1.4, Math.max(.5, W / 1000))) }, () => nueva(true)); };
    const dibujar = p => { x.save(); x.translate(p.x, p.y); x.rotate(p.r); x.fillStyle = p.c; x.strokeStyle = p.c;
      const tw = .45 + .55 * Math.abs(Math.sin(p.f));
      switch (tipo) {
        case "petalos": x.globalAlpha = .75; x.scale(1, Math.abs(Math.sin(p.f)) * .6 + .4); x.beginPath(); x.ellipse(0, 0, p.s, p.s * .55, 0, 0, 7); x.fill(); break;
        case "hojas": x.globalAlpha = .7; x.beginPath(); x.moveTo(0, -p.s); x.quadraticCurveTo(p.s * .8, 0, 0, p.s); x.quadraticCurveTo(-p.s * .8, 0, 0, -p.s); x.fill(); break;
        case "confeti": x.globalAlpha = .85; x.scale(1, Math.sin(p.f)); x.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); break;
        case "burbujas": x.globalAlpha = .55; x.lineWidth = 1.2; x.beginPath(); x.arc(0, 0, p.s, 0, 7); x.stroke(); x.globalAlpha = .5; x.beginPath(); x.arc(-p.s * .35, -p.s * .35, p.s * .22, 0, 7); x.fillStyle = "#fff"; x.fill(); break;
        case "bokeh": { const g = x.createRadialGradient(0, 0, 0, 0, 0, p.s); g.addColorStop(0, p.c); g.addColorStop(1, "transparent"); x.globalAlpha = .16 * tw; x.fillStyle = g; x.beginPath(); x.arc(0, 0, p.s, 0, 7); x.fill(); break; }
        case "datos": x.globalAlpha = .7; x.beginPath(); x.arc(0, 0, p.s, 0, 7); x.fill(); break;
        default: x.globalAlpha = tw * (tipo === "estrellas" ? .8 : .9); x.shadowColor = p.c; x.shadowBlur = tipo === "estrellas" ? 4 : 10; x.beginPath(); x.arc(0, 0, p.s, 0, 7); x.fill();
          if (tipo === "oro" && p.s > 1.8) { x.globalAlpha *= .6; x.fillRect(-p.s * 3, -.4, p.s * 6, .8); x.fillRect(-.4, -p.s * 3, .8, p.s * 6); } }
      x.restore(); };
    const paso = () => { if (on && !document.hidden) { t++; x.clearRect(0, 0, W, H);
        if (tipo === "datos") { x.lineWidth = .6; for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++) { const a = ps[i], b = ps[j], d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < 110) { x.globalAlpha = (1 - d / 110) * .35; x.strokeStyle = a.c; x.beginPath(); x.moveTo(a.x, a.y); x.lineTo(b.x, b.y); x.stroke(); } } x.globalAlpha = 1; }
        ps.forEach((p, k) => { p.f += .03; p.r += p.vr; p.x += p.vx + (baja ? Math.sin(p.f) * .4 : tipo === "oro" || tipo === "brasas" ? Math.sin(p.f) * .25 : 0); p.y += p.vy;
          if (tipo === "datos") { if (p.x < 0 || p.x > W) p.vx *= -1; if (p.y < 0 || p.y > H) p.vy *= -1; }
          if (p.y > H + 30 || p.y < -30 || p.x < -40 || p.x > W + 40) ps[k] = nueva(false); dibujar(p); }); }
      requestAnimationFrame(paso); };
    tam(); addEventListener("resize", tam); if (window.ResizeObserver) new ResizeObserver(tam).observe(host);
    if ("IntersectionObserver" in window) new IntersectionObserver(([e]) => on = e.isIntersecting).observe(host);
    paso();
  }
})();
