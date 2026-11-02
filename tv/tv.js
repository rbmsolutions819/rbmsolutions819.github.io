// RBM TV: utilidades compartidas para manejar las páginas con el control remoto (flechas y OK).
(() => {
  try { localStorage.setItem("rbm-no-contar", "1"); } catch {}   // lo que se abre desde el televisor no cuenta como visita
  const visible = e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && !e.closest("[hidden]") && getComputedStyle(e).visibility !== "hidden"; };
  const enfocables = () => { const capa = [...document.querySelectorAll("[data-capa]")].filter(c => !c.hidden).pop();
    return [...(capa || document).querySelectorAll("[data-foco]")].filter(e => !e.disabled && visible(e) && (!capa || capa.contains(e)) && (capa || !e.closest("[data-capa]"))); };
  function mover(dir){
    const els = enfocables(), cur = document.activeElement;
    if (!els.length) return;
    if (!els.includes(cur)) { (els.find(e => e.dataset.inicio !== undefined) || els[0]).focus(); return; }
    const r = cur.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    let mejor = null, md = Infinity;
    for (const e of els) { if (e === cur) continue;
      const q = e.getBoundingClientRect(), x = q.left + q.width / 2, y = q.top + q.height / 2, dx = x - cx, dy = y - cy;
      const ok = dir === "r" ? dx > 4 && q.left >= r.left + 4 : dir === "l" ? dx < -4 && q.right <= r.right - 4 : dir === "d" ? dy > 4 && q.top >= r.top + 4 : dy < -4 && q.bottom <= r.bottom - 4;
      if (!ok) continue;
      const h = dir === "r" || dir === "l", p = h ? Math.abs(dx) : Math.abs(dy), s = h ? Math.abs(dy) : Math.abs(dx), d = p + s * 2.2;
      if (d < md) { md = d; mejor = e; } }
    if (mejor) { mejor.focus({ preventScroll: true }); mejor.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
      if (mejor.getBoundingClientRect().top < innerHeight * .12) scrollBy({ top: -innerHeight * .15, behavior: "smooth" }); }
  }
  const teclado = () => { try { window.RBMTV && window.RBMTV.teclado(); } catch {} };
  addEventListener("keydown", e => {
    if (e.key === "Enter" && e.target?.matches?.("input,textarea") && !e.target.value) { e.preventDefault(); teclado(); return; }
    const k = { ArrowRight: "r", ArrowLeft: "l", ArrowDown: "d", ArrowUp: "u" }[e.key];
    if (!k) return;
    const t = e.target;
    if (t && t.matches && t.matches("input,textarea") && (k === "l" || k === "r") && t.value) return;   // mover el cursor dentro del texto
    e.preventDefault(); mover(k);
  });
  window.TV = { mover, teclado, foco(){ const els = enfocables(); (els.find(e => e.dataset.inicio !== undefined) || els[0])?.focus(); }, enApp: /RBMTV/.test(navigator.userAgent) };
})();
