"use client";

import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
import { ChevronLeft, ChevronRight, CloseIcon } from "./Icons";
import Photo from "./Photo";
import { THUMB_WIDTHS, VIEWER_WIDTHS, preloadPhoto } from "@/lib/img";

interface LightboxProps {
  images: string[];
  index: number;
  alt: string;
  onIndex: (index: number) => void;
  onClose: () => void;
}

/**
 * Visor a pantalla completa: muestra la foto a su resolución original
 * (nunca la estira por encima de su tamaño real) y permite ampliarla con un
 * clic o toque, moviendo el puntero para recorrerla.
 */
export default function Lightbox({ images, index, alt, onIndex, onClose }: LightboxProps) {
  const count = images.length;
  const current = images[index];
  const [zoomed, setZoomed] = useState(false);
  const [origin, setOrigin] = useState("50% 50%");
  const [loadedUrl, setLoadedUrl] = useState<string | null>(null); // la ORIGINAL ya bajó
  const [lowUrl, setLowUrl] = useState<string | null>(null); // la copia ligera ya bajó
  const wrapRef = useRef<HTMLDivElement>(null);
  const touchX = useRef<number | null>(null);

  const go = useCallback(
    (delta: number) => {
      if (count < 2) return;
      setZoomed(false);
      onIndex((index + delta + count) % count);
    },
    [count, index, onIndex]
  );

  // Teclado en fase de captura: así Esc y las flechas no llegan a la ventana de producto de debajo.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" && e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      e.stopPropagation();
      if (e.key === "Escape") onClose();
      else go(e.key === "ArrowLeft" ? -1 : 1);
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [go, onClose]);

  // Precarga la copia ligera de las vecinas (no la original de varios MB) para que el cambio sea instantáneo.
  useEffect(() => {
    if (count < 2) return;
    for (const d of [1, -1]) preloadPhoto(images[(index + d + count) % count], VIEWER_WIDTHS, "100vw");
  }, [images, index, count]);

  const pointOrigin = (e: MouseEvent) => {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    setOrigin(`${((e.clientX - rect.left) / rect.width) * 100}% ${((e.clientY - rect.top) / rect.height) * 100}%`);
  };

  const stop = (e: MouseEvent) => e.stopPropagation();
  const ready = loadedUrl === current;
  const lowReady = lowUrl === current;

  return (
    <div
      className="animate-fade fixed inset-0 z-[80] flex flex-col bg-slate-950/95"
      role="dialog"
      aria-modal="true"
      aria-label="Visor de imágenes"
      onClick={onClose}
    >
      <div className="flex shrink-0 items-center justify-between px-4 py-3 text-white" onClick={stop}>
        <span className="rounded-full bg-white/10 px-3 py-1 text-sm font-semibold tabular-nums">
          {index + 1} / {count}
        </span>
        <span className="hidden text-xs text-white/55 sm:block">
          Clic en la imagen para ampliar · ← → para cambiar · Esc para cerrar
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar visor"
          className="btn btn-glass h-11 w-11 rounded-full"
        >
          <CloseIcon className="h-5 w-5" />
        </button>
      </div>

      <div
        className="relative flex min-h-0 flex-1 items-center justify-center px-2 sm:px-20"
        onTouchStart={(e) => {
          touchX.current = zoomed ? null : (e.changedTouches[0]?.clientX ?? null);
        }}
        onTouchEnd={(e) => {
          if (touchX.current === null) return;
          const dx = (e.changedTouches[0]?.clientX ?? touchX.current) - touchX.current;
          touchX.current = null;
          if (Math.abs(dx) > 50) go(dx > 0 ? -1 : 1);
        }}
      >
        {count > 1 && (
          <button
            type="button"
            onClick={(e) => { stop(e); go(-1); }}
            aria-label="Imagen anterior"
            className="btn btn-glass absolute left-2 top-1/2 z-10 h-12 w-12 -translate-y-1/2 rounded-full sm:left-5"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}

        <div
          ref={wrapRef}
          className="relative grid max-h-full max-w-full place-items-center overflow-hidden rounded-xl"
          onClick={stop}
          onMouseMove={(e) => zoomed && pointOrigin(e)}
        >
          {!ready && !lowReady && (
            <span className="absolute inset-0 m-auto h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-white" />
          )}
          {/* 1) Copia ligera: se ve casi al instante, aunque la original aún esté bajando. */}
          <Photo
            key={"lo" + current}
            src={current}
            sizes="100vw"
            widths={VIEWER_WIDTHS}
            alt={`${alt} — imagen ${index + 1}`}
            draggable={false}
            onLoad={() => setLowUrl(current)}
            className={`col-start-1 row-start-1 max-h-[calc(100dvh-11rem)] w-auto max-w-full select-none object-contain transition-opacity duration-500 ${ready ? "opacity-0" : "opacity-100"}`}
          />
          {!ready && lowReady && (
            <span className="pointer-events-none absolute right-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-semibold text-white">
              <span aria-hidden="true" className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" /> Cargando HD
            </span>
          )}
          {/* 2) Foto ORIGINAL a máxima resolución: se funde encima y es la que se amplía. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={current}
            src={current}
            alt=""
            draggable={false}
            onLoad={() => setLoadedUrl(current)}
            onClick={(e) => {
              if (!ready) return;
              pointOrigin(e);
              setZoomed((z) => !z);
            }}
            className={`col-start-1 row-start-1 max-h-[calc(100dvh-11rem)] w-auto max-w-full select-none object-contain transition-[transform,opacity] duration-300 ease-out ${ready ? "opacity-100" : "opacity-0"}`}
            style={{
              transform: zoomed ? "scale(2.5)" : "none",
              transformOrigin: origin,
              cursor: zoomed ? "zoom-out" : "zoom-in",
            }}
          />
        </div>

        {count > 1 && (
          <button
            type="button"
            onClick={(e) => { stop(e); go(1); }}
            aria-label="Imagen siguiente"
            className="btn btn-glass absolute right-2 top-1/2 z-10 h-12 w-12 -translate-y-1/2 rounded-full sm:right-5"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}
      </div>

      {count > 1 && (
        <div className="no-scrollbar flex shrink-0 justify-center gap-2 overflow-x-auto px-4 pb-4 pt-3" onClick={stop}>
          {images.map((url, i) => (
            <button
              key={url + i}
              type="button"
              onClick={() => { setZoomed(false); onIndex(i); }}
              aria-label={`Ver imagen ${i + 1}`}
              className={`h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 transition ${i === index ? "border-white opacity-100" : "border-transparent opacity-50 hover:opacity-100"}`}
            >
              <Photo src={url} sizes="56px" widths={THUMB_WIDTHS} alt="" loading="lazy" decoding="async" fetchPriority="low" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
