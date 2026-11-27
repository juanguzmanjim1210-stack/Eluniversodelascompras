"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Category, Product, ProductVariant } from "@/lib/types";
import FitText from "./FitText";
import Lightbox from "./Lightbox";
import Photo from "./Photo";
import RichText from "./RichText";
import { CartIcon, CheckIcon, ChevronLeft, ChevronRight, CloseIcon, ImageIcon, TagIcon, ZoomIcon } from "./Icons";
import { formatMoney, getDiscount, variantLabel } from "@/lib/format";
import { THUMB_WIDTHS, preloadPhoto } from "@/lib/img";

/** Copias ligeras de la foto principal: se ven al instante mientras baja la original. */
const PREVIEW_WIDTHS = [640, 828, 1080];
const PREVIEW_SIZES = "(min-width: 768px) 512px, 100vw";

interface ProductModalProps {
  product: Product;
  categories: Category[];
  currency: string;
  onClose: () => void;
  onAdd: (product: Product, variant: ProductVariant | null, source?: HTMLElement | null) => void;
}

export default function ProductModal({ product, categories, currency, onClose, onAdd }: ProductModalProps) {
  const urls = useMemo(() => product.images.map((i) => i.url), [product.images]);
  const count = urls.length;

  const [index, setIndex] = useState(0);
  const [auto, setAuto] = useState(true);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [variantId, setVariantId] = useState<string | null>(product.variants[0]?.id ?? null);
  const [added, setAdded] = useState(false);
  const [loadedUrl, setLoadedUrl] = useState<string | null>(null); // la ORIGINAL ya bajó
  const [lowUrl, setLowUrl] = useState<string | null>(null); // la copia ligera ya bajó
  const mainRef = useRef<HTMLDivElement>(null);
  const touchX = useRef<number | null>(null);

  // La opción elegida se conserva por id: si el catálogo se refresca mientras
  // el cliente decide, no se le vuelve a la primera opción.
  const variant = product.variants.find((v) => v.id === variantId) ?? product.variants[0] ?? null;
  const price = variant && parseFloat(variant.price) > 0 ? parseFloat(variant.price) : parseFloat(product.basePrice);
  const discount = getDiscount(product);
  const outOfStock = !product.active;
  const categoryName = categories.find((c) => c.id === product.categoryId)?.name ?? null;
  const ready = count > 0 && loadedUrl === urls[index];
  const lowReady = count > 0 && lowUrl === urls[index];

  const go = useCallback(
    (delta: number, manual = true) => {
      if (count < 2) return;
      if (manual) setAuto(false);
      setIndex((i) => (i + delta + count) % count);
    },
    [count]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (lightbox !== null) return;
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, onClose, go]);

  // Cambio automático de foto cada 6 s hasta que el cliente interactúa (igual que antes),
  // pero solo cuando la foto actual ya terminó de cargar: así no se acumulan descargas.
  useEffect(() => {
    if (count < 2 || !auto || lightbox !== null || !ready) return;
    const t = window.setInterval(() => go(1, false), 6000);
    return () => window.clearInterval(t);
  }, [count, auto, lightbox, ready, go]);

  // Precarga la copia ligera de la anterior y la siguiente: el cambio de foto es instantáneo
  // y no se gastan MB en originales que quizá nadie llegue a ver.
  useEffect(() => {
    if (count < 2) return;
    for (const d of [1, -1]) preloadPhoto(urls[(index + d + count) % count], PREVIEW_WIDTHS, PREVIEW_SIZES);
  }, [index, urls, count]);

  useEffect(() => {
    if (!added) return;
    const t = window.setTimeout(() => setAdded(false), 2200);
    return () => window.clearTimeout(t);
  }, [added]);

  const handleAdd = () => {
    if (outOfStock || added) return;
    setAdded(true);
    onAdd(product, variant, mainRef.current);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center md:p-6" role="dialog" aria-modal="true" aria-label={product.name.trim()}>
      <div className="modal-backdrop absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

      <div className="modal-panel relative flex max-h-[94dvh] w-full flex-col overflow-y-auto overscroll-contain rounded-t-[1.75rem] bg-white shadow-2xl md:h-[min(88dvh,720px)] md:max-h-none md:max-w-5xl md:flex-row md:overflow-hidden md:rounded-3xl">
        {/* Barra superior (solo móvil): asa + cerrar */}
        <div className="sticky top-0 z-30 flex h-12 shrink-0 items-center justify-center bg-white/90 backdrop-blur md:hidden">
          <span className="h-1.5 w-10 rounded-full bg-slate-300" aria-hidden="true" />
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="btn absolute right-2 top-1.5 h-9 w-9 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="btn absolute right-4 top-4 z-30 hidden h-11 w-11 rounded-full bg-white/90 text-slate-700 shadow-lg hover:bg-white md:inline-flex"
        >
          <CloseIcon className="h-5 w-5" />
        </button>

        {/* ═════ Galería ═════ */}
        <div className="shrink-0 bg-slate-50 md:flex md:w-1/2 md:flex-col md:overflow-hidden">
          <div
            ref={mainRef}
            className="group/gallery relative aspect-square w-full touch-pan-y select-none overflow-hidden bg-slate-100 md:aspect-auto md:min-h-[320px] md:flex-1"
            onTouchStart={(e) => { touchX.current = e.changedTouches[0]?.clientX ?? null; }}
            onTouchEnd={(e) => {
              if (touchX.current === null) return;
              const dx = (e.changedTouches[0]?.clientX ?? touchX.current) - touchX.current;
              touchX.current = null;
              if (Math.abs(dx) >= 40) go(dx > 0 ? -1 : 1);
            }}
          >
            {count > 0 ? (
              <>
                {!lowReady && !ready && <span className="skeleton absolute inset-0" />}
                {/* Fondo difuminado con la misma foto (copia diminuta): la imagen nunca se recorta y no quedan barras vacías. */}
                <Photo src={urls[index]} sizes="128px" widths={THUMB_WIDTHS} alt="" aria-hidden="true" draggable={false} className="absolute inset-0 h-full w-full scale-125 object-cover opacity-50 blur-2xl" />
                <button type="button" onClick={() => setLightbox(index)} aria-label="Ampliar imagen" className="absolute inset-0 cursor-zoom-in">
                  {/* 1) Copia ligera: aparece casi al instante. */}
                  <Photo
                    key={"lo" + urls[index]}
                    src={urls[index]}
                    sizes={PREVIEW_SIZES}
                    widths={PREVIEW_WIDTHS}
                    alt={product.name.trim()}
                    draggable={false}
                    fetchPriority="high"
                    onLoad={() => setLowUrl(urls[index])}
                    className={`absolute inset-0 h-full w-full object-contain ${outOfStock ? "grayscale" : ""}`}
                  />
                  {/* 2) Foto ORIGINAL a máxima resolución: se funde encima en cuanto termina de bajar. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    key={urls[index]}
                    src={urls[index]}
                    alt=""
                    draggable={false}
                    onLoad={() => setLoadedUrl(urls[index])}
                    className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-500 ${ready ? "opacity-100" : "opacity-0"} ${outOfStock ? "grayscale" : ""}`}
                  />
                </button>
                {lowReady && !ready && (
                  <span className="pointer-events-none absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">
                    <span aria-hidden="true" className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" /> Cargando HD
                  </span>
                )}

                {count > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => go(-1)}
                      aria-label="Foto anterior"
                      className="btn absolute left-3 top-1/2 h-10 w-10 -translate-y-1/2 rounded-full bg-white/90 text-slate-800 shadow-lg hover:bg-white md:opacity-0 md:group-hover/gallery:opacity-100"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => go(1)}
                      aria-label="Foto siguiente"
                      className="btn absolute right-3 top-1/2 h-10 w-10 -translate-y-1/2 rounded-full bg-white/90 text-slate-800 shadow-lg hover:bg-white md:opacity-0 md:group-hover/gallery:opacity-100"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}

                <span className="pointer-events-none absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
                  <ZoomIcon className="h-3.5 w-3.5" /> Toca para ampliar
                </span>
                {count > 1 && (
                  <span className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-black/55 px-2.5 py-1 text-xs font-bold tabular-nums text-white backdrop-blur">
                    {index + 1}/{count}
                  </span>
                )}
              </>
            ) : (
              <span className="absolute inset-0 flex items-center justify-center text-slate-300">
                <ImageIcon className="h-16 w-16" />
              </span>
            )}

            <span className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
              {outOfStock && <span className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-bold text-white shadow-lg">AGOTADO</span>}
              {product.badge && !outOfStock && (
                <span className="rounded-lg px-3 py-1.5 text-sm font-extrabold text-white shadow-lg" style={{ backgroundColor: product.badgeColor || "#f59e0b" }}>
                  {product.badge}
                </span>
              )}
            </span>
          </div>

          {/* Miniaturas: copias diminutas (unos KB cada una), no compiten con la foto principal */}
          {count > 1 && (
            <div className="no-scrollbar flex shrink-0 gap-2 overflow-x-auto p-3">
              {urls.map((url, i) => (
                <button
                  key={url + i}
                  type="button"
                  onClick={() => { setAuto(false); setIndex(i); }}
                  aria-label={`Ver foto ${i + 1}`}
                  aria-current={i === index}
                  className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 bg-white transition-all duration-200 ${i === index ? "border-brand scale-100 opacity-100 shadow-md" : "scale-95 border-transparent opacity-60 hover:scale-100 hover:opacity-100"}`}
                >
                  <Photo src={url} sizes="64px" widths={THUMB_WIDTHS} alt="" loading="lazy" decoding="async" fetchPriority="low" draggable={false} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ═════ Información ═════ */}
        <div className="flex flex-col md:min-h-0 md:w-1/2 md:overflow-y-auto">
          <div className="flex-1 space-y-5 p-5 md:p-8">
            <div className="flex flex-wrap items-center gap-2 md:pr-12">
              {categoryName && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1 text-xs font-bold text-brand">
                  <TagIcon className="h-3.5 w-3.5" /> {categoryName}
                </span>
              )}
              {outOfStock && <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-600">❌ Agotado</span>}
            </div>

            {/* Nombre: se reduce lo necesario para que quepa completo, sea corto o largo */}
            <FitText as="h2" text={product.name.trim()} min={18} max={30} lines={4} className="font-extrabold text-slate-900" />

            <div>
              <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
                <span className="text-3xl font-extrabold tracking-tight text-brand sm:text-4xl">{formatMoney(currency, price)}</span>
                {discount && <span className="pb-1 text-lg font-medium text-slate-400 line-through">{formatMoney(currency, discount.compare)}</span>}
                {discount && <span className="mb-1.5 rounded-lg bg-rose-500 px-2 py-0.5 text-sm font-extrabold text-white">-{discount.pct}%</span>}
              </div>
              {discount && <p className="mt-1 text-sm font-semibold text-emerald-600">Ahorras {formatMoney(currency, discount.saving)}</p>}
            </div>

            {product.description?.trim() && (
              <RichText text={product.description} className="text-[15px] leading-relaxed text-slate-600 sm:text-base" />
            )}

            {product.features.length > 0 && (
              <dl className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-100 text-sm">
                {product.features.map((f) => (
                  <div key={f.id} className="grid grid-cols-5 gap-3 px-4 py-2.5 odd:bg-slate-50/70">
                    <dt className="col-span-2 font-semibold text-slate-500">{f.key}</dt>
                    <dd className="col-span-3 break-words text-slate-800">{f.value}</dd>
                  </div>
                ))}
              </dl>
            )}

            {product.variants.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Opciones disponibles</p>
                <div className="grid grid-cols-2 gap-2">
                  {product.variants.map((v) => {
                    const selected = variant?.id === v.id;
                    const out = v.stock <= 0;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setVariantId(v.id)}
                        aria-pressed={selected}
                        className={`btn relative flex-col items-start justify-start gap-0 rounded-2xl border-2 p-3 text-left ${selected ? "border-brand bg-brand-soft" : "border-slate-200 bg-white hover:border-slate-300"} ${out ? "opacity-50" : ""}`}
                      >
                        <span className="block w-full break-words pr-5 text-sm font-bold leading-snug text-slate-900">{variantLabel(v)}</span>
                        <span className="mt-1 block text-xs font-semibold text-brand">
                          {formatMoney(currency, parseFloat(v.price) > 0 ? v.price : product.basePrice)}
                        </span>
                        <span className={`mt-0.5 block text-[11px] font-medium ${out ? "text-rose-500" : "text-slate-500"}`}>
                          {out ? "Agotado" : `Stock ${v.stock}`}
                        </span>
                        <span
                          className={`absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full bg-brand text-white transition-all duration-300 ${selected ? "scale-100 opacity-100" : "scale-0 opacity-0"}`}
                          style={{ transitionTimingFunction: "var(--ease-spring)" }}
                          aria-hidden="true"
                        >
                          <CheckIcon className="h-3 w-3" strokeWidth={3.5} />
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Barra de compra: siempre visible, aunque la descripción sea larga */}
          <div className="sticky bottom-0 z-20 border-t border-slate-100 bg-white/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur md:p-5">
            {outOfStock ? (
              <button type="button" disabled className="btn w-full rounded-2xl bg-slate-200 py-3.5 text-base font-bold text-slate-500">
                Agotado
              </button>
            ) : (
              <button
                type="button"
                onClick={handleAdd}
                className={`btn btn-shine w-full rounded-2xl py-3.5 text-base font-bold ${added ? "btn-success" : "btn-brand btn-pulse"}`}
              >
                {added ? (
                  <>
                    <CheckIcon className="check-draw h-5 w-5" strokeWidth={3} /> ¡Agregado al carrito!
                  </>
                ) : (
                  <>
                    <CartIcon className="btn-icon h-5 w-5" /> Agregar al carrito · {formatMoney(currency, price)}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {lightbox !== null && count > 0 && (
        <Lightbox images={urls} index={lightbox} alt={product.name.trim()} onIndex={(i) => { setLightbox(i); setIndex(i); }} onClose={() => setLightbox(null)} />
      )}
    </div>
  );
}
