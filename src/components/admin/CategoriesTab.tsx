"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import type { Category, Product } from "@/lib/types";
import { PlusIcon, TagIcon, TrashIcon } from "../Icons";
import { Card, EmptyState, LoadingBlock, PageHeader, errorText, useAdmin } from "./ui";

export default function CategoriesTab() {
  const { api, toast, confirm } = useAdmin();
  const [categories, setCategories] = useState<Category[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    const [c, p] = await Promise.all([api<Category[]>("/api/categories"), api<Product[]>("/api/products")]);
    setCategories(Array.isArray(c.data) ? c.data : []);
    const tally: Record<string, number> = {};
    for (const prod of Array.isArray(p.data) ? p.data : []) if (prod.categoryId) tally[prod.categoryId] = (tally[prod.categoryId] ?? 0) + 1;
    setCounts(tally);
    setLoading(false);
  }, [api]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    const r = await api("/api/categories", { method: "POST", body: { name } });
    setCreating(false);
    if (!r.ok) return toast(errorText(r, "No se pudo crear la categoría"), "error");
    setName("");
    toast("Categoría creada");
    load();
  };

  const handleDelete = async (c: Category) => {
    const n = counts[c.id] ?? 0;
    const ok = await confirm({
      title: "¿Eliminar categoría?",
      message: n > 0 ? `«${c.name.trim()}» tiene ${n} ${n === 1 ? "producto" : "productos"}. No se borrarán: quedarán sin categoría.` : `Se eliminará «${c.name.trim()}».`,
      confirmText: "Sí, eliminar",
      danger: true,
    });
    if (!ok) return;
    const r = await api(`/api/categories?id=${c.id}`, { method: "DELETE" });
    if (!r.ok) return toast(errorText(r, "No se pudo eliminar"), "error");
    toast("Categoría eliminada");
    load();
  };

  if (loading) return <LoadingBlock />;

  return (
    <div>
      <PageHeader title="Categorías" subtitle="Organizan tu catálogo y aparecen como filtros arriba de los productos" />
        <div className="space-y-4 px-3 pb-8 sm:px-6">
        <form onSubmit={handleCreate} className="admin-card flex flex-col gap-3 p-4 sm:flex-row sm:p-5">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre de la nueva categoría…" aria-label="Nombre de la categoría" className="field flex-1" />
          <button type="submit" disabled={creating || !name.trim()} className="btn btn-brand btn-shine rounded-xl px-6 py-3 text-sm font-bold disabled:opacity-50">
            <PlusIcon className="h-4 w-4" /> Crear categoría
          </button>
        </form>

        <Card>
          {categories.length === 0 ? (
            <EmptyState icon={<TagIcon className="h-8 w-8" />} title="Aún no hay categorías" text="Crea la primera arriba para filtrar tus productos." />
          ) : (
            <ul className="-my-2 divide-y divide-slate-100">
              {categories.map((c) => (
                <li key={c.id} className="flex items-center gap-3 py-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
                    <TagIcon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-extrabold text-slate-900">{c.name.trim()}</span>
                    <span className="text-xs text-slate-500">{counts[c.id] ?? 0} {(counts[c.id] ?? 0) === 1 ? "producto" : "productos"}</span>
                  </span>
                  <button type="button" onClick={() => handleDelete(c)} aria-label={`Eliminar ${c.name.trim()}`} className="btn btn-ghost h-10 w-10 rounded-xl hover:text-rose-500">
                    <TrashIcon className="h-[18px] w-[18px]" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
