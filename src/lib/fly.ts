/**
 * Anima una miniatura que «vuela» desde el producto hasta el icono del carrito
 * (el elemento marcado con `data-cart-target`).
 *
 * Usa la Web Animations API sobre transform/opacity, así que corre en la GPU y
 * no obliga a recalcular el diseño de la página. Si el usuario pidió menos
 * movimiento, o el navegador no la soporta, simplemente avisa al instante.
 */
export function flyToCart(source: Element | null | undefined, onLand?: () => void): void {
  if (typeof window === "undefined" || !source) {
    onLand?.();
    return;
  }

  const target = document.querySelector<HTMLElement>("[data-cart-target]");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || !target || typeof Element.prototype.animate !== "function") {
    onLand?.();
    return;
  }

  const img = source instanceof HTMLImageElement ? source : source.querySelector("img");
  const from = (img ?? source).getBoundingClientRect();
  const to = target.getBoundingClientRect();
  if (from.width === 0 || to.width === 0) {
    onLand?.();
    return;
  }

  const size = 72;
  const ghost = document.createElement("div");
  ghost.setAttribute("aria-hidden", "true");
  ghost.style.cssText =
    `position:fixed;left:0;top:0;width:${size}px;height:${size}px;margin:${-size / 2}px 0 0 ${-size / 2}px;` +
    "border-radius:9999px;z-index:90;pointer-events:none;border:3px solid #fff;" +
    "box-shadow:0 14px 32px rgb(15 23 42 / .35);background:#e2e8f0 center/cover no-repeat;will-change:transform,opacity;";
  const src = img instanceof HTMLImageElement ? img.currentSrc || img.src : "";
  if (src) ghost.style.backgroundImage = `url("${src.replace(/"/g, "%22")}")`;
  document.body.appendChild(ghost);

  const x0 = from.left + from.width / 2;
  const y0 = from.top + from.height / 2;
  const x1 = to.left + to.width / 2;
  const y1 = to.top + to.height / 2;
  const lift = Math.max(90, Math.abs(y1 - y0) * 0.25);

  const anim = ghost.animate(
    [
      { transform: `translate(${x0}px, ${y0}px) scale(1.5)`, opacity: 0.95 },
      { transform: `translate(${x0 + (x1 - x0) * 0.45}px, ${Math.min(y0, y1) - lift}px) scale(0.9)`, opacity: 1, offset: 0.5 },
      { transform: `translate(${x1}px, ${y1}px) scale(0.18)`, opacity: 0.2 },
    ],
    { duration: 650, easing: "cubic-bezier(0.45, 0.05, 0.55, 0.95)", fill: "forwards" }
  );

  const done = () => {
    ghost.remove();
    onLand?.();
  };
  anim.onfinish = done;
  anim.oncancel = done;
}
