"use client";

import { useEffect, useLayoutEffect, useRef, type CSSProperties } from "react";

/** useLayoutEffect en el navegador (mide antes de pintar); useEffect en el servidor para no avisar. */
const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

type Tag = "h1" | "h2" | "h3" | "h4" | "p" | "span" | "div";

interface FitTextProps {
  text: string;
  as?: Tag;
  /** Tamaño más pequeño al que puede bajar, en px. */
  min: number;
  /** Tamaño ideal cuando el texto cabe holgado, en px. */
  max: number;
  /** Líneas permitidas. Si ni al tamaño mínimo cabe, se recorta con «…». */
  lines?: number;
  lineHeight?: number;
  className?: string;
}

/* Un solo ResizeObserver para todos los títulos: con decenas de tarjetas
   es más barato que uno por título. */
const callbacks = new WeakMap<Element, () => void>();
let observer: ResizeObserver | null = null;

function watch(el: Element, run: () => void): () => void {
  if (typeof ResizeObserver === "undefined") return () => {};
  if (!observer) {
    observer = new ResizeObserver((entries) => {
      // Se difiere un fotograma: cambiar el tamaño de letra cambia la altura y
      // evita el aviso «ResizeObserver loop» del navegador.
      window.requestAnimationFrame(() => {
        for (const entry of entries) callbacks.get(entry.target)?.();
      });
    });
  }
  callbacks.set(el, run);
  observer.observe(el);
  return () => {
    observer?.unobserve(el);
    callbacks.delete(el);
  };
}

/**
 * Texto que se ajusta solo a su contenedor.
 *
 * Busca (búsqueda binaria) el tamaño de letra más grande, entre `min` y `max`,
 * con el que el texto cabe en `lines` líneas. Así un nombre corto como
 * «COMBO DE OLLAS» se ve grande y uno de 50 letras se reduce lo justo, sin
 * importar el ancho de la pantalla: se recalcula al cambiar el tamaño de la
 * tarjeta, al cambiar el texto y cuando termina de cargar la tipografía.
 */
export default function FitText({
  text,
  as = "span",
  min,
  max,
  lines = 2,
  lineHeight = 1.2,
  className = "",
}: FitTextProps) {
  const ref = useRef<HTMLDivElement>(null);
  const lastWidth = useRef(-1);
  const Tag = as as unknown as "div";

  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const fits = (size: number, allowed = lines) => {
      el.style.fontSize = `${size}px`;
      return el.scrollHeight <= Math.ceil(size * lineHeight * allowed) + 1;
    };

    const fit = (force: boolean) => {
      const width = el.clientWidth;
      if (width === 0) return; // oculto: no hay nada que medir
      if (!force && width === lastWidth.current) return;
      lastWidth.current = width;
      el.removeAttribute("data-clamp");

      let best = min;
      if (fits(max)) {
        best = max;
      } else {
        let lo = min;
        let hi = max;
        while (hi - lo > 0.4) {
          const mid = (lo + hi) / 2;
          if (fits(mid)) {
            best = mid;
            lo = mid;
          } else {
            hi = mid;
          }
        }
      }
      el.style.fontSize = `${best}px`;
      if (!fits(best)) {
        // Pantalla muy estrecha: se concede una línea más al tamaño mínimo antes de recortar.
        el.style.fontSize = `${min}px`;
        if (!fits(min, lines + 1)) {
          // Último recurso: se recorta con «…».
          el.style.setProperty("--fit-lines", String(lines + 1));
          el.setAttribute("data-clamp", "");
        }
      }
    };

    fit(true);
    const stop = watch(el, () => fit(false));

    let cancelled = false;
    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
    fonts?.ready.then(() => {
      if (!cancelled) fit(true);
    });

    return () => {
      cancelled = true;
      stop();
    };
  }, [text, min, max, lines, lineHeight]);

  return (
    <Tag
      ref={ref}
      className={`fit-text ${className}`}
      style={{ fontSize: max, lineHeight, "--fit-lines": lines } as CSSProperties}
    >
      {text}
    </Tag>
  );
}
