"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import type { Category, Product } from "@/lib/types";
import Photo from "../Photo";
import { ChevronDown, ChevronUp, EditIcon, ImageIcon, PackageIcon, PlusIcon, SearchIcon, TrashIcon } from "../Icons";
import { EmptyState, Field, LoadingBlock, PageHeader, Toggle, errorText, useAdmin } from "./ui";
import { THUMB_WIDTHS } from "@/lib/img";
import { formatMoney, isPriceHidden } from "@/lib/format";

type StatusFilter = "all" | "active" | "inactive";

export default function ProductsTab({ onEdit }: { onEdit: (id: string) => void }) {
  const { api, toast, confirm } = useAdmin();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [showNew, setShowNew] = useState(false);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [basePrice, setBasePrice] = useState("");

  const fetchData = useCallback(async () => {
    const [p, c] = await Promise.all([api<Product[]>("/api/products"), api<Category[]>("/api/categories")]);
    setProducts(Array.isArray(p.data) ? p.data : []);
    setCategories(Array.isArray(c.data) ? c.data : []);
    setLoading(false);
  }, [api]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtering = query.trim() !== "" || catFilter !== "" || status !== "all";

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter(
      (p) =>
        (!q || p.name.toLowerCase().includes(q)) &&
        (!catFilter || p.categoryId === catFilter) &&
        (status === "all" || (status === "active" ? p.active : !p.active))
    );
  }, [products, query, catFilter, status]);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    const r = await api<Product>("/api/products", {
      method: "POST",
      body: { name, description: "", categoryId: categoryId || null, basePrice: basePrice || "0" },
    });
    setCreating(false);
    if (!r.ok) return toast(errorText(r, "No se pudo crear el producto"), "error");
    setName(""); setCategoryId(""); setBasePrice(""); setShowNew(false);
    toast("Producto creado. Ahora agrégale fotos y variantes.");
    if (r.data?.id) onEdit(r.data.id);
    else fetchData();
  };

  const handleDelete = async (p: Product) => {
    const ok = await confirm({
      title: "¿Eliminar este producto?",
      message: `«${p.name.trim()}» se borrará junto con sus fotos y variantes. Esta acción no se puede deshacer.`,
      confirmText: "Sí, eliminar",
      danger: true,
    });
    if (!ok) return;
    const r = await api(`/api/products/${p.id}`, { method: "DELETE" });
    if (!r.ok) return toast(errorText(r, "No se pudo eliminar"), "error");
    toast("Producto eliminado");
    fetchData();
  };

  const toggleActive = async (p: Product) => {
    const r = await api(`/api/products/${p.id}`, { method: "PUT", body: { ...p, active: !p.active } });
    if (!r.ok) return toast(errorText(r, "No se pudo actualizar"), "error");
    setProducts((prev) => prev.map((x) => (x.id === p.id ? { ...x, active: !p.active } : x)));
    toast(p.active ? "Marcado como agotado" : "Marcado como disponible");
  };

  const moveProduct = async (index: number, direction: "up" | "down") => {
    const swapIdx = direction === "up" ? index - 1 : index + 1;
    if (swapIdx < 0 || swapIdx >= products.length) return;
    const a = products[index];
    const bItem = products[swapIdx];
    const [ra, rb] = await Promise.all([
      api(`/api/products/${a.id}`, { method: "PUT", body: { ...a, sortOrder: swapIdx } }),
      api(`/api/products/${bItem.id}`, { method: "PUT", body: { ...bItem, sortOrder: index } }),
    ]);
    if (!ra.ok || !rb.ok) toast("No se pudo cambiar el orden", "error");
    fetchData();
  };

  if (loading) return <LoadingBlock />;

  const STATUS: { key: StatusFilter; label: string }[] = [
    { key: "all", label: `Todos (${products.length})` },
    { key: "active", label: `Disponibles (${products.filter((p) => p.active).length})` },
    { key: "inactive", label: `Agotados (${products.filter((p) => !p.active).length})` },
  ];

  return (
    <div>
      <PageHeader
        title="Productos"
        subtitle={`${products.length} en tu catálogo`}
        actions={
          <button type="button" onClick={() => setShowNew((v) => !v)} className="btn btn-brand btn-shine rounded-xl px-4 py-2.5 text-sm font-bold">
            <PlusIcon className="h-4 w-4" /> {showNew ? "Cancelar" : "Nuevo producto"}
          </button>
        }
      />

        <div className="space-y-4 px-3 pb-8 sm:px-6">
        {showNew && (
          <form onSubmit={handleCreate} className="admin-card card-enter space-y-4 p-4 sm:p-5">
            <h3 className="text-[15px] font-extrabold text-slate-900">Nuevo producto</h3>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Nombre *" className="sm:col-span-3">
                <input required autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Combo de ollas" className="field" />
              </Field>
              <Field label="Precio de venta">
                <input type="text" inputMode="decimal" value={basePrice} onChange={(e) => setBasePrice(e.target.value.replace(/[^\d.]/g, ""))} placeholder="0" className="field" />
              </Field>
              <Field label="Categoría" className="sm:col-span-2">
                <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="field">
                  <option value="">Sin categoría</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name.trim()}</option>)}
                </select>
              </Field>
            </div>
            <button type="submit" disabled={creating || !name.trim()} className="btn btn-brand btn-shine rounded-xl px-5 py-3 text-sm font-bold disabled:opacity-50">
              {creating ? "Creando…" : "Crear y continuar"}
            </button>
          </form>
        )}

        {/* Filtros */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar producto…" aria-label="Buscar producto" className="field py-2.5 pl-10" />
          </div>
          <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} aria-label="Filtrar por categoría" className="field py-2.5 sm:w-52">
            <option value="">Todas las categorías</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name.trim()}</option>)}
          </select>
        </div>
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          {STATUS.map((s) => (
            <button key={s.key} type="button" onClick={() => setStatus(s.key)} className={`btn shrink-0 rounded-full px-4 py-2 text-xs font-bold ${status === s.key ? "btn-brand" : "btn-ghost"}`}>
              {s.label}
            </button>
          ))}
        </div>

        {/* Lista */}
        {visible.length === 0 ? (
          <div className="admin-card">
            <EmptyState
              icon={<PackageIcon className="h-8 w-8" />}
              title={products.length === 0 ? "Aún no hay productos" : "Ningún producto coincide"}
              text={products.length === 0 ? "Crea el primero con el botón «Nuevo producto»." : "Prueba con otra búsqueda o quita los filtros."}
            />
          </div>
        ) : (
          <ul className="space-y-2.5">
            {visible.map((p) => {
              const idx = products.findIndex((x) => x.id === p.id);
              const units = p.variants.reduce((s, v) => s + v.stock, 0);
              const hasVariants = p.variants.length > 0;
              const hasDiscount = p.comparePrice && parseFloat(p.comparePrice) > parseFloat(p.basePrice);

              return (
                <li key={p.id} className="admin-card overflow-hidden">
                   {/* ── Fila principal: foto + info ── */}
                   <div className="flex items-stretch gap-0">
                     {/* Foto cuadrada a la izquierda */}
                     <button
                       type="button"
                       onClick={() => onEdit(p.id)}
                       aria-label={`Editar ${p.name.trim()}`}
                       className="relative shrink-0"
                       style={{ width: 72, minHeight: 72 }}
                     >
                      <span className={`absolute inset-0 overflow-hidden ${p.images[0] ? "" : "flex items-center justify-center bg-slate-100 text-slate-300"}`}>
                        {p.images[0] ? (
                          <Photo
                            src={p.images[0].url}
                            sizes="80px"
                            widths={THUMB_WIDTHS}
                            alt=""
                            className={`h-full w-full object-cover ${p.active ? "" : "grayscale"}`}
                          />
                        ) : (
                          <ImageIcon className="h-6 w-6" />
                        )}
                      </span>
                      {!p.active && (
                        <span className="absolute inset-0 bg-white/50" />
                      )}
                    </button>

                    {/* Contenido: nombre, chips, precio */}
                    <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 px-3 py-2.5">
                      <button
                        type="button"
                        onClick={() => onEdit(p.id)}
                        className="text-left"
                      >
                        <span className="line-clamp-2 text-sm font-bold leading-snug text-slate-900">
                          {p.name.trim()}
                        </span>
                      </button>

                      {/* Chips de badge, categoría, variantes */}
                      <div className="flex flex-wrap items-center gap-1">
                        {p.badge && (
                          <span
                            className="rounded-md px-1.5 py-0.5 text-[10px] font-extrabold text-white"
                            style={{ backgroundColor: p.badgeColor || "#f59e0b" }}
                          >
                            {p.badge}
                          </span>
                        )}
                        {hasVariants && (
                          <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${units > 0 ? "bg-slate-100 text-slate-500" : "bg-rose-50 text-rose-600"}`}>
                            {hasVariants ? `${p.variants.length} var.` : ""}{units > 0 ? ` · ${units} uds` : " · Sin stock"}
                          </span>
                        )}
                      </div>

                      {/* Precio */}
                      <div className="flex items-baseline gap-1.5">
                        {isPriceHidden(p.basePrice) ? (
                          <span className="text-[11px] font-semibold text-slate-400">Ver en opciones</span>
                        ) : (
                          <>
                            <span className="text-sm font-bold tabular-nums text-slate-900">
                              {formatMoney("$", p.basePrice)}
                            </span>
                            {hasDiscount && (
                              <span className="text-[11px] tabular-nums text-slate-400 line-through">
                                {formatMoney("$", p.comparePrice!)}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Columna derecha: orden + interruptor */}
                    <div className="flex shrink-0 flex-col items-center justify-between border-l border-slate-100 px-2 py-2">
                      {!filtering ? (
                        <div className="flex flex-col gap-0.5">
                          <button
                            type="button"
                            aria-label="Subir"
                            onClick={() => moveProduct(idx, "up")}
                            disabled={idx === 0}
                            className="btn btn-ghost h-7 w-8 rounded-lg disabled:opacity-25"
                          >
                            <ChevronUp className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            aria-label="Bajar"
                            onClick={() => moveProduct(idx, "down")}
                            disabled={idx === products.length - 1}
                            className="btn btn-ghost h-7 w-8 rounded-lg disabled:opacity-25"
                          >
                            <ChevronDown className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <span />
                      )}
                      <button
                        type="button"
                        role="switch"
                        aria-checked={p.active}
                        onClick={() => toggleActive(p)}
                        title={p.active ? "Disponible" : "Agotado"}
                      >
                        <Toggle checked={p.active} />
                      </button>
                    </div>
                  </div>

                  {/* ── Barra de acciones ── */}
                  <div className="flex items-center justify-between border-t border-slate-100 px-3 py-2">
                    <span className={`text-xs font-bold ${p.active ? "text-emerald-600" : "text-rose-500"}`}>
                      {p.active ? "✓ Disponible" : "✗ Agotado"}
                    </span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => onEdit(p.id)}
                        aria-label="Editar"
                        className="btn btn-ghost h-9 w-9 rounded-xl"
                      >
                        <EditIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(p)}
                        aria-label="Eliminar"
                        className="btn btn-ghost h-9 w-9 rounded-xl hover:text-rose-500"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {filtering && products.length > 0 && (
          <p className="text-center text-xs text-slate-400">Con un filtro activo no se puede reordenar. Quita los filtros para usar las flechas.</p>
        )}
      </div>
    </div>
  );
}
