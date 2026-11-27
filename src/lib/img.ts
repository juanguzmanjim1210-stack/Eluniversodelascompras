/*
  Imágenes optimizadas con el optimizador que ya trae Next (/_next/image).

  Las fotos que sube el administrador pesan varios MB (la media en esta tienda
  es de ~1,9 MB y algunas llegan a 4,5 MB). Una tarjeta de 250 px no necesita
  eso: se pide una copia WebP del ancho justo (con versiones para pantallas
  retina) y el navegador elige la que le corresponde. El detalle del producto y
  el visor ampliado siguen usando la foto ORIGINAL, a máxima resolución.

  Los anchos y la calidad son los que Next permite por defecto
  (deviceSizes / imageSizes y q=75); cualquier otro valor daría error 400.
*/

/** Anchos para tarjetas del catálogo. */
export const GRID_WIDTHS = [384, 640, 828, 1080];
/** Anchos para miniaturas pequeñas (64–80 px de pantalla, ×2 para retina). */
export const THUMB_WIDTHS = [128, 256];

/** Qué ancho ocupa una tarjeta según el número de columnas de la cuadrícula. */
export const GRID_SIZES = "(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw";

/** Solo se optimiza lo que viene de internet; rutas locales o data: se dejan tal cual. */
export function canOptimize(src: string): boolean {
  return /^https:\/\//i.test(src);
}

export function optimizedUrl(src: string, width: number): string {
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=75`;
}

export function optimizedSrcSet(src: string, widths: number[]): string {
  return widths.map((w) => `${optimizedUrl(src, w)} ${w}w`).join(", ");
}

/** Anchos para la copia ligera del visor a pantalla completa. */
export const VIEWER_WIDTHS = [1080, 1920];

/**
 * Precarga la copia ligera de una foto (la que el navegador elegiría con estos
 * `widths` y `sizes`). Se precarga la copia, no la original de varios MB: la
 * original solo se descarga para la foto que de verdad se está mirando.
 */
export function preloadPhoto(src: string, widths: number[], sizes: string): void {
  if (typeof Image === "undefined") return;
  const img = new Image();
  img.decoding = "async";
  if (canOptimize(src)) {
    img.sizes = sizes;
    img.srcset = optimizedSrcSet(src, widths);
    img.src = optimizedUrl(src, widths[Math.min(1, widths.length - 1)]);
  } else {
    img.src = src;
  }
}
