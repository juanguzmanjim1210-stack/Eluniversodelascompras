"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import type { Category, Product } from "@/lib/types";
import Photo from "../Photo";
import {
  AlertIcon,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CloseIcon,
  DollarIcon,
  EyeIcon,
  ImageIcon,
  LayersIcon,
  PlusIcon,
  SaveIcon,
  TagIcon,
  TrashIcon,
} from "../Icons";
import { Card, ColorField, Field, LoadingBlock, StockInput, Switch, errorText, useAdmin } from "./ui";
import { LOGO_SWATCHES } from "@/lib/theme";
import { GRID_SIZES, THUMB_WIDTHS } from "@/lib/img";
import { formatMoney, getDiscount } from "@/lib/format";

interface InfoForm {
  name: string;
  description: string;
  categoryId: string;
  basePrice: string;
  comparePrice: string;
  badge: string;
  badgeColor: string;
  active: boolean;
}

const BADGE_SWATCHES = [
  ...LOGO_SWATCHES,
  { name: "Verde", hex: "#10b981" },
  { name: "Violeta", hex: "#8b5cf6" },
  { name: "Rosa", hex: "#ec4899" },
  { name: "Negro", hex: "#111827" },
];

/** La base devuelve «210000.00»; en el campo se muestra «210000». */
const pretty = (v: string) => (v ? v.replace(/\.00$/, "") : "");

const toForm = (p: Product): InfoForm => ({
  name: p.name,
  description: p.description || "",
  categoryId: p.categoryId || "",
  basePrice: pretty(p.basePrice),
  comparePrice: pretty(p.comparePrice || ""),
  badge: p.badge || "",
  badgeColor: p.badgeColor || "#f59e0b",
  active: p.active,
});

/** Solo dígitos y un punto decimal. */
const money = (v: string) => v.replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1");

function ImageTile({ url, index, total, onRemove, onMove }: { url: string; index: number; total: number; onRemove: () => void; onMove: (to: number) => void }) {
  const [broken, setBroken] = useState(false);
  return (
    <li className="group relative">
      <div className="relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
        {broken ? (
          <span className="absolute inset-0 grid place-items-center px-1 text-center text-[10px] font-bold text-rose-500">
            <span><AlertIcon className="mx-auto mb-1 h-5 w-5" />Enlace roto</span>
          </span>
        ) : (
          <Photo src={url} sizes="120px" widths={[128, 256]} alt="" draggable={false} onFail={() => setBroken(true)} className="h-full w-full object-cover" />
        )}
        {index === 0 && <span className="absolute left-1 top-1 rounded-md bg-slate-900/80 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-white">Principal</span>}
      </div>
      <button type="button" onClick={onRemove} aria-label="Quitar imagen" className="btn btn-danger absolute -right-1.5 -top-1.5 h-6 w-6 rounded-full">
        <CloseIcon className="h-3.5 w-3.5" strokeWidth={3} />
      </button>
      <div className="absolute inset-x-1 bottom-1 flex justify-between">
        <button type="button" onClick={() => onMove(index - 1)} disabled={index === 0} aria-label="Mover a la izquierda" className="btn h-6 w-6 rounded-md bg-slate-900/70 text-white disabled:opacity-0">
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        <button type="button" onClick={() => onMove(index + 1)} disabled={index === total - 1} aria-label="Mover a la derecha" className="btn h-6 w-6 rounded-md bg-slate-900/70 text-white disabled:opacity-0">
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </li>
  );
}

export default function ProductEditor({ productId, onBack }: { productId: string; onBack: () => void }) {
  const { api, toast, confirm } = useAdmin();
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<InfoForm | null>(null);
  const [savedForm, setSavedForm] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [savedImages, setSavedImages] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [missing, setMissing] = useState(false);

  const [varColor, setVarColor] = useState("");
  const [varSize, setVarSize] = useState("");
  const [varPrice, setVarPrice] = useState("");
  const [varStock, setVarStock] = useState("0");
  const [addingVariant, setAddingVariant] = useState(false);

  const load = useCallback(async () => {
    const [p, c] = await Promise.all([api<Product>(`/api/products/${productId}`), api<Category[]>("/api/categories")]);
    if (!p.ok || !p.data) {
      setMissing(true);
      return;
    }
    const prod = p.data;
    setProduct(prod);
    setCategories(Array.isArray(c.data) ? c.data : []);
    const f = toForm(prod);
    setForm(f);
    setSavedForm(JSON.stringify(f));
    const urls = [...prod.images].sort((a, b) => a.sortOrder - b.sortOrder).map((i) => i.url);
    setImages(urls);
    setSavedImages(JSON.stringify(urls));
  }, [api, productId]);

  useEffect(() => { load(); }, [load]);

  /** Solo recarga las variantes: no pisa lo que se esté editando en el resto del formulario. */
  const refreshVariants = useCallback(async () => {
    const p = await api<Product>(`/api/products/${productId}`);
    if (p.ok && p.data) {
      const fresh = p.data;
      setProduct((prev) => (prev ? { ...prev, variants: fresh.variants } : fresh));
    }
  }, [api, productId]);

  const infoDirty = !!form && JSON.stringify(form) !== savedForm;
  const imagesDirty = JSON.stringify(images) !== savedImages;
  const dirty = infoDirty || imagesDirty;

  const set = <K extends keyof InfoForm>(key: K, value: InfoForm[K]) => setForm((f) => (f ? { ...f, [key]: value } : f));

  const discount = useMemo(
    () => (form ? getDiscount({ basePrice: form.basePrice || "0", comparePrice: form.comparePrice || null }) : null),
    [form]
  );

  const saveAll = async () => {
    if (!form || !product) return;
    if (!form.name.trim()) return toast("El producto necesita un nombre", "error");
    setSaving(true);
    let ok = true;

    if (infoDirty) {
      const r = await api(`/api/products/${productId}`, {
        method: "PUT",
        body: {
          name: form.name,
          description: form.description,
          categoryId: form.categoryId || null,
          basePrice: form.basePrice,
          comparePrice: form.comparePrice || null,
          badge: form.badge || null,
          badgeColor: form.badgeColor,
          active: form.active,
          // Se reenvían para no reiniciarlos: el servidor pone 0 a lo que no recibe,
          // y eso borraba el orden manual de los productos.
          stock: product.stock,
          sortOrder: product.sortOrder,
        },
      });
      if (!r.ok) {
        ok = false;
        toast(errorText(r, "No se pudo guardar la información"), "error");
      }
    }

    if (ok && imagesDirty) {
      const urls = images.filter((u) => u.trim() !== "");
      const r = await api(`/api/products/${productId}/images`, { method: "PUT", body: { urls } });
      if (!r.ok) {
        ok = false;
        toast(errorText(r, "No se pudieron guardar las imágenes"), "error");
      }
    }

    setSaving(false);
    if (ok) {
      toast("Cambios guardados. Ya se ven en el catálogo.");
      await load();
    }
  };

  /* ── Imágenes ── */
  const addImage = () => {
    if (!newImageUrl.trim() || images.length >= 10) return;
    // Detección inteligente: extrae todos los enlaces de imagen del texto pegado.
    const text = newImageUrl.trim();
    const urlRegex = /https?:\/\/[^\s,;"'<>]+\.(?:jpg|jpeg|png|gif|webp|bmp|svg)(?:\?[^\s,;"'<>]*)?/gi;
    const ibbRegex = /https?:\/\/i\.ibb\.co\/[^\s,;"'<>]+/gi;
    const found = new Set<string>();
    text.match(urlRegex)?.forEach((u) => found.add(u));
    text.match(ibbRegex)?.forEach((u) => found.add(u));
    if (found.size === 0) {
      text.split(/[\n\r]+/).map((l) => l.trim()).filter((l) => l.startsWith("http")).forEach((l) => found.add(l));
    }
    if (found.size > 0) setImages((prev) => [...prev, ...Array.from(found)].slice(0, 10));
    else setImages((prev) => [...prev, text].slice(0, 10));
    setNewImageUrl("");
  };

  const moveImage = (from: number, to: number) => {
    if (to < 0 || to >= images.length) return;
    setImages((prev) => {
      const arr = [...prev];
      const [item] = arr.splice(from, 1);
      arr.splice(to, 0, item);
      return arr;
    });
  };

  /* ── Variantes y stock ── */
  const commitStock = useCallback(
    (variantId: string) => async (n: number) => {
      const r = await api(`/api/products/${productId}/variants/stock`, { method: "POST", body: { variantId, setStock: n } });
      if (!r.ok) {
        toast(errorText(r, "No se pudo guardar el stock"), "error");
        return false;
      }
      setProduct((prev) => (prev ? { ...prev, variants: prev.variants.map((v) => (v.id === variantId ? { ...v, stock: n } : v)) } : prev));
      return true;
    },
    [api, productId, toast]
  );

  const handleAddVariant = async (e: FormEvent) => {
    e.preventDefault();
    setAddingVariant(true);
    const r = await api(`/api/products/${productId}/variants`, {
      method: "POST",
      body: { color: varColor, size: varSize, price: varPrice || "0", stock: parseInt(varStock, 10) || 0 },
    });
    setAddingVariant(false);
    if (!r.ok) return toast(errorText(r, "No se pudo agregar la variante"), "error");
    setVarColor(""); setVarSize(""); setVarPrice(""); setVarStock("0");
    toast("Variante agregada");
    refreshVariants();
  };

  const handleDeleteVariant = async (id: string, label: string) => {
    const ok = await confirm({ title: "¿Eliminar esta variante?", message: `Se quitará «${label}» y su stock.`, confirmText: "Sí, eliminar", danger: true });
    if (!ok) return;
    const r = await api(`/api/products/${productId}/variants?variantId=${id}`, { method: "DELETE" });
    if (!r.ok) return toast(errorText(r, "No se pudo eliminar"), "error");
    toast("Variante eliminada");
    refreshVariants();
  };

  if (missing)
    return (
      <div className="p-8 text-center">
        <p className="font-bold text-slate-700">No se encontró el producto.</p>
        <button type="button" onClick={onBack} className="btn btn-brand mt-4 rounded-xl px-5 py-2.5 text-sm font-bold">Volver a productos</button>
      </div>
    );
  if (!product || !form) return <LoadingBlock />;

  const totalUnits = product.variants.reduce((s, v) => s + v.stock, 0);

  return (
    <div>
      {/* Cabecera */}
      <div className="flex items-center gap-3 px-4 pb-4 pt-5 sm:px-6">
        <button type="button" onClick={onBack} aria-label="Volver a productos" className="btn btn-ghost h-11 w-11 shrink-0 rounded-xl">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          <h2 className="truncate text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">{form.name.trim() || "Producto sin nombre"}</h2>
          <p className="text-sm text-slate-500">Editar producto</p>
        </div>
        <span className={`ml-auto shrink-0 rounded-full px-3 py-1 text-xs font-extrabold ${form.active ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
          {form.active ? "Disponible" : "Agotado"}
        </span>
      </div>

      <div className="grid gap-5 px-4 pb-6 sm:px-6 lg:grid-cols-5">
        {/* ───── Columna izquierda ───── */}
        <div className="space-y-5 lg:col-span-3">
          <Card title="Información" description="Nombre, categoría y descripción" icon={<TagIcon className="h-5 w-5" />}>
            <Field label="Nombre del producto">
              <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Nombre del producto" className="field" />
            </Field>
            <Field label="Categoría">
              <select value={form.categoryId} onChange={(e) => set("categoryId", e.target.value)} className="field">
                <option value="">Sin categoría</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name.trim()}</option>)}
              </select>
            </Field>
            <Field label="Descripción" hint="Para poner texto en negrita escribe **texto aquí** con doble asterisco.">
              <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={5} placeholder="Describe el producto: qué incluye, medidas, beneficios…" className="field resize-y" />
            </Field>
            <Switch checked={!form.active} onChange={(v) => set("active", !v)} tone="danger" label="Marcar como agotado" description="Los clientes verán «Agotado» y no podrán comprarlo." />

            <div className="space-y-3 rounded-2xl bg-slate-50 p-3.5">
              <Field label="Etiqueta (opcional)">
                <div className="flex gap-2">
                  <input value={form.badge} onChange={(e) => set("badge", e.target.value)} placeholder="Ej: Nuevo, Oferta, Hot" className="field" />
                  {form.badge && (
                    <button type="button" onClick={() => set("badge", "")} className="btn btn-ghost shrink-0 rounded-xl px-3.5 text-xs font-bold hover:text-rose-500">Quitar</button>
                  )}
                </div>
              </Field>
              <div className="flex flex-wrap gap-1.5">
                {["Nuevo", "Oferta", "Hot 🔥", "Último"].map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => set("badge", b)}
                    className={`rounded-full px-3 py-1 text-xs font-extrabold text-white transition ${form.badge === b ? "ring-2 ring-slate-900 ring-offset-2" : "opacity-80 hover:opacity-100"}`}
                    style={{ backgroundColor: form.badgeColor }}
                  >
                    {b}
                  </button>
                ))}
              </div>
              {form.badge && (
                <div>
                  <p className="mb-1.5 text-xs font-bold text-slate-600">Color de la etiqueta</p>
                  <ColorField value={form.badgeColor} onChange={(v) => set("badgeColor", v)} swatches={BADGE_SWATCHES} />
                </div>
              )}
            </div>
          </Card>

          <Card title="Precios" description="El precio «antes» muestra el descuento automáticamente" icon={<DollarIcon className="h-5 w-5" />}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Precio de venta *" hint={form.basePrice ? `Se verá como ${formatMoney("$", form.basePrice)}` : "Escribe un precio en pesos"}>
                <span className="relative block">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400">$</span>
                  <input type="text" inputMode="decimal" value={form.basePrice} onChange={(e) => set("basePrice", money(e.target.value))} placeholder="0" className="field pl-8" />
                </span>
              </Field>
              <Field label="Precio antes (opcional)">
                <span className="relative block">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400">$</span>
                  <input type="text" inputMode="decimal" value={form.comparePrice} onChange={(e) => set("comparePrice", money(e.target.value))} placeholder="Precio normal" className="field pl-8" />
                </span>
              </Field>
            </div>
            {discount && (
              <div className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3">
                <span className="rounded-lg bg-[color:var(--c-red)] px-2 py-1 text-xs font-extrabold text-white">-{discount.pct}%</span>
                <span className="text-sm">
                  <span className="text-slate-400 line-through">{formatMoney("$", discount.compare)}</span>
                  <span className="ml-2 font-extrabold text-rose-600">{formatMoney("$", form.basePrice || "0")}</span>
                </span>
                <span className="ml-auto text-xs text-slate-500">Así se verá</span>
              </div>
            )}
          </Card>

          {/* Variantes y stock */}
          <Card
            title="Variantes y stock"
            description="Escribe la cantidad directamente: se guarda sola"
            icon={<LayersIcon className="h-5 w-5" />}
            action={<span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-extrabold text-slate-600">{totalUnits} uds</span>}
          >
            {product.variants.length === 0 ? (
              <p className="rounded-2xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">Este producto no tiene variantes. Agrega colores o tallas, cada una con su cantidad.</p>
            ) : (
              <ul className="space-y-2.5">
                {product.variants.map((v) => {
                  const label = v.color && v.size ? `${v.color} / ${v.size}` : v.color || v.size || "Única";
                  return (
                    <li key={v.id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {v.color && <span className="rounded-lg bg-sky-100 px-2.5 py-1 text-xs font-extrabold text-sky-700">{v.color}</span>}
                          {v.size && <span className="rounded-lg bg-violet-100 px-2.5 py-1 text-xs font-extrabold text-violet-700">{v.size}</span>}
                          {!v.color && !v.size && <span className="rounded-lg bg-slate-200 px-2.5 py-1 text-xs font-extrabold text-slate-600">Única</span>}
                          <span className="text-xs font-bold text-slate-500">
                            {parseFloat(v.price) > 0 ? formatMoney("$", v.price) : "Precio del producto"}
                          </span>
                        </div>
                        <button type="button" onClick={() => handleDeleteVariant(v.id, label)} aria-label={`Eliminar ${label}`} className="btn btn-ghost h-8 w-8 shrink-0 rounded-lg hover:text-rose-500">
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                        <span className={`text-xs font-extrabold ${v.stock <= 0 ? "text-rose-500" : v.stock <= 3 ? "text-amber-600" : "text-emerald-600"}`}>
                          {v.stock <= 0 ? "Agotado" : v.stock <= 3 ? "Stock bajo" : "En stock"}
                        </span>
                        <StockInput value={v.stock} onCommit={commitStock(v.id)} label={`Cantidad de ${label}`} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            <form onSubmit={handleAddVariant} className="space-y-3 rounded-2xl border-2 border-dashed border-slate-200 p-3.5">
              <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Agregar variante</p>
              <div className="grid grid-cols-2 gap-2.5">
                <Field label="Color"><input value={varColor} onChange={(e) => setVarColor(e.target.value)} placeholder="Ej: Rojo" className="field py-2.5" /></Field>
                <Field label="Talla"><input value={varSize} onChange={(e) => setVarSize(e.target.value)} placeholder="Ej: M" className="field py-2.5" /></Field>
                <Field label="Cantidad">
                  <input type="text" inputMode="numeric" pattern="[0-9]*" value={varStock} onFocus={(e) => e.target.select()} onChange={(e) => setVarStock(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="0" className="field no-spin py-2.5" />
                </Field>
                <Field label="Precio distinto" hint="Vacío = usa el del producto">
                  <input type="text" inputMode="decimal" value={varPrice} onChange={(e) => setVarPrice(money(e.target.value))} placeholder="Opcional" className="field py-2.5" />
                </Field>
              </div>
              <button type="submit" disabled={addingVariant} className="btn btn-dark w-full rounded-xl py-3 text-sm font-bold disabled:opacity-60">
                <PlusIcon className="h-4 w-4" /> {addingVariant ? "Agregando…" : "Agregar variante"}
              </button>
            </form>
          </Card>
        </div>

        {/* ───── Columna derecha ───── */}
        <div className="space-y-5 lg:col-span-2">
          <Card title="Vista previa" description="Así se verá en el catálogo" icon={<EyeIcon className="h-5 w-5" />}>
            <div className="mx-auto w-full max-w-[15rem] overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-lg">
              <div className="relative aspect-square bg-slate-100">
                {images[0] ? (
                  <Photo src={images[0]} sizes={GRID_SIZES} alt="" className={`h-full w-full object-cover ${form.active ? "" : "grayscale"}`} />
                ) : (
                  <span className="absolute inset-0 grid place-items-center text-slate-300"><ImageIcon className="h-12 w-12" /></span>
                )}
                <span className="absolute left-2 top-2 flex flex-col items-start gap-1.5">
                  {discount && form.active && <span className="rounded-lg bg-[color:var(--c-red)] px-2 py-1 text-xs font-extrabold text-white shadow">-{discount.pct}%</span>}
                  {form.badge && form.active && <span className="rounded-lg px-2 py-1 text-xs font-extrabold text-white shadow" style={{ backgroundColor: form.badgeColor }}>{form.badge}</span>}
                </span>
                {!form.active && <span className="absolute right-2 top-2 rounded-lg bg-slate-900 px-2 py-1 text-[11px] font-bold text-white">AGOTADO</span>}
              </div>
              <div className="space-y-2 p-3">
                <p className="line-clamp-3 text-sm font-bold leading-tight text-slate-900">{form.name.trim() || "Nombre del producto"}</p>
                <p className="flex items-baseline gap-2">
                  <span className="text-xl font-extrabold text-brand">{formatMoney("$", form.basePrice || "0")}</span>
                  {discount && <span className="text-xs text-slate-400 line-through">{formatMoney("$", discount.compare)}</span>}
                </p>
                <span className={`btn pointer-events-none w-full rounded-xl py-2.5 text-sm font-bold ${form.active ? "btn-brand" : "bg-slate-200 text-slate-500"}`}>{form.active ? "Comprar" : "Agotado"}</span>
              </div>
            </div>
          </Card>

          <Card
            title="Imágenes"
            description="La primera es la principal. Máximo 10."
            icon={<ImageIcon className="h-5 w-5" />}
            action={<span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-extrabold text-slate-600">{images.length}/10</span>}
          >
            {images.length < 10 && (
              <div className="space-y-2.5">
                <textarea
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); addImage(); } }}
                  rows={3}
                  placeholder={"Pega uno o varios enlaces de imágenes…\n\nhttps://i.ibb.co/xxxx/foto1.jpg"}
                  className="field resize-none font-mono text-sm"
                />
                <button type="button" onClick={addImage} disabled={!newImageUrl.trim()} className="btn btn-brand w-full rounded-xl py-2.5 text-sm font-bold disabled:opacity-40">
                  <PlusIcon className="h-4 w-4" /> Detectar y agregar
                </button>
                <p className="rounded-xl bg-sky-50 px-3 py-2 text-[11px] font-semibold leading-snug text-sky-700">Pega varios enlaces de imgbb a la vez: se detectan automáticamente. Acepta JPG, PNG, WebP y GIF.</p>
              </div>
            )}
            {images.length > 0 && (
              <ul className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4">
                {images.map((url, i) => (
                  <ImageTile key={url + i} url={url} index={i} total={images.length} onRemove={() => setImages((prev) => prev.filter((_, idx) => idx !== i))} onMove={(to) => moveImage(i, to)} />
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      {/* Barra de guardado */}
      <div className="sticky bottom-0 z-20 border-t border-slate-200/80 bg-white/85 px-4 py-3 backdrop-blur-xl sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <p className={`text-sm font-bold ${dirty ? "text-amber-600" : "text-emerald-600"}`}>{dirty ? "● Cambios sin guardar" : "✓ Todo guardado"}</p>
          <div className="flex gap-2">
            {dirty && (
              <button type="button" onClick={load} disabled={saving} className="btn btn-ghost rounded-xl px-4 py-2.5 text-sm font-bold">Descartar</button>
            )}
            <button type="button" onClick={saveAll} disabled={!dirty || saving} className="btn btn-brand btn-shine rounded-xl px-5 py-2.5 text-sm font-bold disabled:opacity-50 disabled:shadow-none">
              <SaveIcon className="h-4 w-4" /> {saving ? "Guardando…" : "Guardar cambios"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
