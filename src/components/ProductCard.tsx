"use client";

import { memo, useEffect, useRef, useState, type CSSProperties } from "react";
import type { Product, ProductVariant } from "@/lib/types";
import FitText from "./FitText";
import Photo from "./Photo";
import { CartIcon, CheckIcon, ImageIcon, ZoomIcon } from "./Icons";
import { formatMoney, getDiscount } from "@/lib/format";
import { GRID_SIZES } from "@/lib/img";

interface ProductCardProps {
  product: Product;
  /** Posición en la cuadrícula: escalona la animación de entrada y prioriza las primeras imágenes. */
  index: number;
  currency: string;
  buttonText: string;
  onOpen: (product: Product) => void;
  onAdd: (product: Product, variant: ProductVariant | null, source?: HTMLElement | null) => void;
}

function ProductCardBase({ product, index, currency, buttonText, onOpen, onAdd }: ProductCardProps) {
  const mediaRef = useRef<HTMLButtonElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const timer = useRef<number | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [peek, setPeek] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current); }, []);
  // Si la imagen ya estaba en caché, `onLoad` pudo dispararse antes de enganchar el evento.
  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) setLoaded(true);
  }, []);

  const inactive = !product.active;
  const discount = getDiscount(product);
  const hasVariants = product.variants.length > 0;
  const cover = product.images[0]?.url;
  const second = product.images[1]?.url;

  const handleAdd = () => {
    if (hasVariants) {
      onOpen(product); // hay que elegir color/talla primero
      return;
    }
    setDone(true);
    timer.current = window.setTimeout(() => setDone(false), 1200);
    onAdd(product, null, mediaRef.current);
  };

  return (
    <article
      className="card card-enter group flex flex-col overflow-hidden"
      style={{ "--i": Math.min(index, 12) } as CSSProperties}
    >
      <button
        type="button"
        ref={mediaRef}
        onClick={() => onOpen(product)}
        onPointerEnter={(e) => { if (e.pointerType === "mouse" && second) setPeek(true); }}
        aria-label={`Ver detalles de ${product.name.trim()}`}
        className="relative block aspect-square w-full overflow-hidden bg-slate-100 text-left"
      >
        {cover && !failed ? (
          <>
            {!loaded && <span className="skeleton absolute inset-0" />}
            {/* Copia WebP del ancho justo (con versión retina): nítida al tamaño de la tarjeta y ~95 % más ligera que la original. */}
            <Photo
              ref={imgRef}
              src={cover}
              sizes={GRID_SIZES}
              alt={product.name.trim()}
              loading={index < 4 ? "eager" : "lazy"}
              fetchPriority={index < 2 ? "high" : "auto"}
              decoding="async"
              draggable={false}
              onLoad={() => setLoaded(true)}
              onFail={() => setFailed(true)}
              className={`card-img h-full w-full object-cover ${loaded ? "opacity-100" : "opacity-0"} ${inactive ? "grayscale" : ""}`}
            />
            {/* La segunda foto solo se descarga al pasar el mouse: no gasta datos de quien no la ve. */}
            {peek && second && !inactive && (
              <Photo
                src={second}
                sizes={GRID_SIZES}
                alt=""
                aria-hidden="true"
                decoding="async"
                draggable={false}
                className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              />
            )}
          </>
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-slate-300">
            <ImageIcon className="h-12 w-12" />
          </span>
        )}

        {inactive && <span className="absolute inset-0 bg-white/45" />}

        <span className="absolute left-2 top-2 flex flex-col items-start gap-1.5">
          {discount && !inactive && (
            <span className="rounded-lg bg-rose-500 px-2 py-1 text-xs font-extrabold text-white shadow-lg shadow-rose-500/30 sm:text-sm">
              -{discount.pct}%
            </span>
          )}
          {product.badge && !inactive && (
            <span
              className="rounded-lg px-2 py-1 text-xs font-extrabold text-white shadow-lg sm:text-sm"
              style={{ backgroundColor: product.badgeColor || "#f59e0b" }}
            >
              {product.badge}
            </span>
          )}
        </span>
        {inactive && (
          <span className="absolute right-2 top-2 rounded-lg bg-slate-900 px-2 py-1 text-[11px] font-bold text-white shadow-md sm:text-xs">
            AGOTADO
          </span>
        )}

        <span className="pointer-events-none absolute inset-x-0 bottom-0 hidden translate-y-full items-center justify-center gap-1.5 bg-gradient-to-t from-slate-900/70 to-transparent pb-3 pt-10 text-xs font-bold text-white transition-transform duration-300 group-hover:translate-y-0 md:flex">
          <ZoomIcon className="h-4 w-4" /> Vista rápida
        </span>
      </button>

      <div className="flex flex-1 flex-col p-3 sm:p-4">
        {/* El título se ajusta solo: grande si es corto, más pequeño (hasta 3 líneas) si es largo. */}
        <FitText
          as="h3"
          text={product.name.trim()}
          min={11}
          max={16}
          lines={3}
          className={`font-bold ${inactive ? "text-slate-400" : "text-slate-900"}`}
        />

        <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className={`text-xl font-extrabold tracking-tight sm:text-2xl ${inactive ? "text-slate-400" : "text-brand"}`}>
            {formatMoney(currency, product.basePrice)}
          </span>
          {discount && !inactive && (
            <span className="text-sm font-medium text-slate-400 line-through">{formatMoney(currency, discount.compare)}</span>
          )}
        </div>

        <div className="mt-auto pt-3">
          {inactive ? (
            <button type="button" disabled className="btn w-full rounded-xl bg-slate-200 py-3 text-sm font-bold text-slate-500">
              Agotado
            </button>
          ) : (
            <button
              type="button"
              onClick={handleAdd}
              className={`btn btn-shine w-full rounded-xl py-3 text-sm font-bold sm:text-[15px] ${done ? "btn-success" : "btn-brand"}`}
            >
              {done ? (
                <>
                  <CheckIcon className="check-draw h-5 w-5" strokeWidth={3} /> ¡Agregado!
                </>
              ) : (
                <>
                  <CartIcon className="btn-icon h-[18px] w-[18px] sm:h-5 sm:w-5" /> {buttonText}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

/** memo: con 15 s de refresco y decenas de tarjetas, solo se repinta la que cambió. */
export default memo(ProductCardBase);
