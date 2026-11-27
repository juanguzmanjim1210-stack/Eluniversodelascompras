"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import type { Category, Product } from "@/lib/types";
import Photo from "../Photo";
import { ChevronDown, ChevronUp, EditIcon, ImageIcon, PackageIcon, PlusIcon, SearchIcon, TrashIcon } from "../Icons";
import { EmptyState, Field, LoadingBlock, PageHeader, Toggle, errorText, useAdmin } from "./ui";
import { THUMB_WIDTHS } from "@/lib/img";
import { formatMoney } from "@/lib/format";

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
    // Se abre directamente el editor del producto recién creado.
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

  // Mismo orden manual de siempre: intercambia el sortOrder con el vecino.
  const moveProduct = async (index: number, direction: "up" | "down") => {
    const swapIdx = direction === "up" ? index - 1 : index + 1;
    if (swapIdx < 0 || swapIdx >= products.length) return;
    const a = products[index];
    const b = products[swapIdx];
    const [ra, rb] = await Promise.all([
      api(`/api/products/${a.id}`, { method: "PUT", body: { ...a, sortOrder: swapIdx } }),
      api(`/api/products/${b.id}`, { method: "PUT", body: { ...b, sortOrder: index } }),
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

      <div className="space-y-4 px-4 pb-8 sm:px-6">
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
              const categoryName = categories.find((c) => c.id === p.categoryId)?.name;
              return (
                <li key={p.id} className="admin-card flex flex-wrap items-center gap-3 p-3 sm:flex-nowrap sm:p-3.5">
                  {!filtering && (
                    <div className="flex shrink-0 flex-col gap-1">
                      <button type="button" aria-label="Subir" onClick={() => moveProduct(idx, "up")} disabled={idx === 0} className="btn btn-ghost h-6 w-7 rounded-lg disabled:opacity-30">
                        <ChevronUp className="h-3.5 w-3.5" />
                      </button>
                      <button type="button" aria-label="Bajar" onClick={() => moveProduct(idx, "down")} disabled={idx === products.length - 1} className="btn btn-ghost h-6 w-7 rounded-lg disabled:opacity-30">
                        <ChevronDown className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}

                  <button type="button" onClick={() => onEdit(p.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                    <span className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-slate-100 text-slate-300">
                      {p.images[0] ? (
                        <Photo src={p.images[0].url} sizes="56px" widths={THUMB_WIDTHS} alt="" className={`h-full w-full object-cover ${p.active ? "" : "grayscale"}`} />
                      ) : (
                        <ImageIcon className="h-6 w-6" />
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className="line-clamp-2 break-words text-sm font-extrabold leading-snug text-slate-900 sm:text-[15px]">{p.name.trim()}</span>
                      <span className="mt-1 flex flex-wrap items-center gap-1.5">
                        {categoryName && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">{categoryName.trim()}</span>}
                        {p.badge && (
                          <span className="rounded-full px-2 py-0.5 text-[11px] font-extrabold text-white" style={{ backgroundColor: p.badgeColor || "#f59e0b" }}>
                            {p.badge}
                          </span>
                        )}
                        {p.variants.length > 0 && (
                          <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${units > 0 ? "bg-sky-50 text-sky-700" : "bg-rose-50 text-rose-600"}`}>
                            {units > 0 ? `${units} uds · ${p.variants.length} ${p.variants.length === 1 ? "variante" : "variantes"}` : "Sin stock"}
                          </span>
                        )}
                      </span>
                    </span>
                  </button>

                  <div className="shrink-0 text-right">
                    <p className="text-base font-extrabold tabular-nums text-brand">{formatMoney("$", p.basePrice)}</p>
                    {p.comparePrice && parseFloat(p.comparePrice) > parseFloat(p.basePrice) && (
                      <p className="text-xs text-slate-400 line-through">{formatMoney("$", p.comparePrice)}</p>
                    )}
                  </div>

                  <div className="ml-auto flex shrink-0 items-center gap-2 sm:ml-0">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={p.active}
                      onClick={() => toggleActive(p)}
                      title={p.active ? "Disponible: toca para marcar agotado" : "Agotado: toca para marcar disponible"}
                      className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition hover:bg-slate-50"
                    >
                      <Toggle checked={p.active} />
                      <span className={`hidden w-[4.5rem] text-left text-xs font-bold md:block ${p.active ? "text-emerald-600" : "text-rose-500"}`}>{p.active ? "Disponible" : "Agotado"}</span>
                    </button>
                    <button type="button" onClick={() => onEdit(p.id)} aria-label="Editar" title="Editar" className="btn btn-ghost h-10 w-10 rounded-xl">
                      <EditIcon className="h-[18px] w-[18px]" />
                    </button>
                    <button type="button" onClick={() => handleDelete(p)} aria-label="Eliminar" title="Eliminar" className="btn btn-ghost h-10 w-10 rounded-xl hover:text-rose-500">
                      <TrashIcon className="h-[18px] w-[18px]" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {filtering && products.length > 0 && <p className="text-center text-xs text-slate-400">Con un filtro activo no se puede reordenar. Quita los filtros para usar las flechas.</p>}
      </div>
    </div>
  );
}
