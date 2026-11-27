"use client";

import { useState, type ImgHTMLAttributes, type Ref } from "react";
import { GRID_WIDTHS, canOptimize, optimizedSrcSet, optimizedUrl } from "@/lib/img";

interface PhotoProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "srcSet" | "sizes" | "onError"> {
  /** URL de la foto original. */
  src: string;
  /** Ancho aproximado en pantalla (atributo `sizes`): así el navegador elige la copia justa. */
  sizes: string;
  /** Anchos de copia a ofrecer. */
  widths?: number[];
  ref?: Ref<HTMLImageElement>;
  /** Se llama solo si falla incluso la foto original. */
  onFail?: () => void;
}

/**
 * Foto optimizada con red de seguridad: si el optimizador no puede con una
 * imagen (host no permitido, imagen caída, límite de uso…), se carga la
 * original en su lugar, de modo que nunca se rompe una foto de la tienda.
 */
export default function Photo({ src, sizes, widths = GRID_WIDTHS, ref, onFail, alt = "", ...rest }: PhotoProps) {
  // Se recuerda *qué* URL falló, así que si el catálogo cambia la foto vuelve a probarse optimizada.
  const [failedFor, setFailedFor] = useState<string | null>(null);
  const original = failedFor === src || !canOptimize(src);
  const base = widths[Math.min(1, widths.length - 1)];

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={ref}
      alt={alt}
      {...rest}
      src={original ? src : optimizedUrl(src, base)}
      srcSet={original ? undefined : optimizedSrcSet(src, widths)}
      sizes={original ? undefined : sizes}
      onError={() => {
        if (!original) setFailedFor(src);
        else onFail?.();
      }}
    />
  );
}
