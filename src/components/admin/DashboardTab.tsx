"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Category, Product } from "@/lib/types";
import Photo from "../Photo";
import { AlertIcon, CheckCircleIcon, EditIcon, ExternalIcon, LayersIcon, PackageIcon, PlusIcon, StoreIcon, TagIcon } from "../Icons";
import { Card, EmptyState, LoadingBlock, PageHeader, StockInput, errorText, useAdmin, type AdminTab } from "./ui";
import { THUMB_WIDTHS } from "@/lib/img";
import { variantLabel } from "@/lib/format";

const TONES = {
  blue: "from-[#0b44b7] to-[#1784e6]",
  gold: "from-[#d4a62a] to-[#fde047]",
  red: "from-[#f02436] to-[#ff6b78]",
  navy: "from-[#0a1a5c] to-[#0b44b7]",
} as const;

function Stat({ label, value, hint, icon, tone }: { label: string; value: ReactNode; hint?: string; icon: ReactNode; tone: keyof typeof TONES }) {
  return (
    <div className="admin-card relative overflow-hidden p-4">
      <span className={`absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br opacity-15 ${TONES[tone]}`} />
      <span className={`mb-3 grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br shadow-lg ${TONES[tone]} ${tone === "gold" ? "text-amber-950" : "text-white"}`}>{icon}</span>
      <p className="text-2xl font-extrabold tabular-nums text-slate-900">{value}</p>
      <p className="text-xs font-bold text-slate-500">{label}</p>
      {hint && <p className="mt-0.5 text-[11px] text-slate-400">{hint}</p>}
    </div>
  );
}

const LOW_STOCK = 3;

export default function DashboardTab({ goTo, openProduct }: { goTo: (tab: AdminTab) => void; openProduct: (id: string) => void }) {
  const { api, toast } = useAdmin();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  // Las filas de «stock bajo» se fijan al cargar: así no desaparecen mientras se escribe la nueva cantidad.
  const [watch, setWatch] = useState<string[]>([]);

  const load = useCallback(async () => {
    const [p, c] = await Promise.all([api<Product[]>("/api/products"), api<Category[]>("/api/categories")]);
    const list = Array.isArray(p.data) ? p.data : [];
    setProducts(list);
    setCategories(Array.isArray(c.data) ? c.data : []);
    setWatch(
      list
        .filter((x) => x.active)
        .flatMap((x) => x.variants.filter((v) => v.stock <= LOW_STOCK).map((v) => `${x.id}|${v.id}`))
        .slice(0, 12)
    );
    setLoading(false);
  }, [api]);

  useEffect(() => { load(); }, [load]);

  const commitStock = useCallback(
    (productId: string, variantId: string) => async (n: number) => {
      const r = await api(`/api/products/${productId}/variants/stock`, { method: "POST", body: { variantId, setStock: n } });
      if (!r.ok) {
        toast(errorText(r, "No se pudo guardar el stock"), "error");
        return false;
      }
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, variants: p.variants.map((v) => (v.id === variantId ? { ...v, stock: n } : v)) } : p))
      );
      return true;
    },
    [api, toast]
  );

  const reactivate = async (product: Product) => {
    const r = await api(`/api/products/${product.id}`, { method: "PUT", body: { ...product, active: true } });
    if (!r.ok) return toast(errorText(r, "No se pudo actualizar el producto"), "error");
    setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, active: true } : p)));
    toast(`«${product.name.trim()}» vuelve a estar disponible`);
  };

  const stats = useMemo(() => {
    const active = products.filter((p) => p.active).length;
    const units = products.reduce((s, p) => s + p.variants.reduce((a, v) => a + v.stock, 0), 0);
    return { total: products.length, active, inactive: products.length - active, units };
  }, [products]);

  const lowRows = useMemo(() => {
    return watch
      .map((key) => {
        const [pid, vid] = key.split("|");
        const product = products.find((p) => p.id === pid);
        const variant = product?.variants.find((v) => v.id === vid);
        return product && variant ? { product, variant } : null;
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);
  }, [watch, products]);

  const inactive = products.filter((p) => !p.active);

  if (loading) return <LoadingBlock />;

  return (
    <div>
      <PageHeader title="Resumen" subtitle="Así va tu tienda hoy" />

      <div className="space-y-5 px-4 pb-8 sm:px-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Productos" value={stats.total} hint={`${stats.active} disponibles`} icon={<PackageIcon className="h-5 w-5" />} tone="blue" />
          <Stat label="Agotados" value={stats.inactive} hint="Marcados como agotados" icon={<AlertIcon className="h-5 w-5" />} tone="red" />
          <Stat label="Unidades en stock" value={stats.units.toLocaleString("es-CO")} hint="Suma de todas las variantes" icon={<LayersIcon className="h-5 w-5" />} tone="gold" />
          <Stat label="Categorías" value={categories.length} icon={<TagIcon className="h-5 w-5" />} tone="navy" />
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button type="button" onClick={() => goTo("products")} className="btn btn-brand btn-shine rounded-xl px-4 py-2.5 text-sm font-bold">
            <PlusIcon className="h-4 w-4" /> Nuevo producto
          </button>
          <button type="button" onClick={() => goTo("settings")} className="btn btn-ghost rounded-xl px-4 py-2.5 text-sm font-bold">
            <StoreIcon className="h-4 w-4" /> Editar tienda
          </button>
          <a href="/" target="_blank" rel="noopener noreferrer" className="btn btn-ghost rounded-xl px-4 py-2.5 text-sm font-bold">
            <ExternalIcon className="h-4 w-4" /> Ver catálogo
          </a>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <Card
            title="Stock bajo"
            description={`Variantes con ${LOW_STOCK} unidades o menos. Escribe la nueva cantidad y se guarda sola.`}
            icon={<AlertIcon className="h-5 w-5" />}
          >
            {lowRows.length === 0 ? (
              <EmptyState icon={<CheckCircleIcon className="h-8 w-8 text-emerald-500" />} title="Todo en orden" text="Ninguna variante tiene el stock bajo." />
            ) : (
              <ul className="-my-1 divide-y divide-slate-100">
                {lowRows.map(({ product, variant }) => (
                  <li key={variant.id} className="flex flex-wrap items-center gap-3 py-3">
                    <button type="button" onClick={() => openProduct(product.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left" title="Abrir producto">
                      <span className="h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                        {product.images[0] && <Photo src={product.images[0].url} sizes="44px" widths={THUMB_WIDTHS} alt="" className="h-full w-full object-cover" />}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-bold text-slate-900">{product.name.trim()}</span>
                        <span className="block truncate text-xs text-slate-500">{variantLabel(variant)}</span>
                      </span>
                    </button>
                    <StockInput value={variant.stock} onCommit={commitStock(product.id, variant.id)} />
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Marcados como agotados" description="No se pueden comprar hasta que los reactives." icon={<PackageIcon className="h-5 w-5" />}>
            {inactive.length === 0 ? (
              <EmptyState icon={<CheckCircleIcon className="h-8 w-8 text-emerald-500" />} title="Nada agotado" text="Todos tus productos están disponibles." />
            ) : (
              <ul className="-my-1 divide-y divide-slate-100">
                {inactive.map((p) => (
                  <li key={p.id} className="flex items-center gap-3 py-3">
                    <span className="h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                      {p.images[0] && <Photo src={p.images[0].url} sizes="44px" widths={THUMB_WIDTHS} alt="" className="h-full w-full object-cover grayscale" />}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-bold text-slate-700">{p.name.trim()}</span>
                    <button type="button" onClick={() => openProduct(p.id)} aria-label="Editar" className="btn btn-ghost h-9 w-9 rounded-xl">
                      <EditIcon className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => reactivate(p)} className="btn btn-success rounded-xl px-3.5 py-2 text-xs font-bold">
                      Reactivar
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
