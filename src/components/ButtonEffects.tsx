"use client";

import { useEffect } from "react";

/**
 * Onda (ripple) al tocar cualquier elemento con la clase `.btn`.
 *
 * Usa delegación de eventos: un único listener en el documento sirve a todos
 * los botones, incluso a los que aparecen después (tarjetas, carrito, etc.).
 */
export default function ButtonEffects() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const onDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      const btn = (e.target as Element | null)?.closest?.<HTMLElement>(".btn");
      if (!btn || (btn as HTMLButtonElement).disabled || btn.getAttribute("aria-disabled") === "true") return;

      const rect = btn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 2.4;
      const wave = document.createElement("span");
      wave.className = "ripple";
      wave.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - rect.left - size / 2}px;top:${e.clientY - rect.top - size / 2}px`;
      btn.appendChild(wave);
      wave.addEventListener("animationend", () => wave.remove(), { once: true });
    };

    document.addEventListener("pointerdown", onDown, { passive: true });
    return () => document.removeEventListener("pointerdown", onDown);
  }, []);

  return null;
}
