import type { Product, ProductVariant } from "@/lib/types";

/** «$1.234.567» con separador de miles colombiano, sin decimales. */
export function formatMoney(currency: string, value: string | number): string {
  const n = typeof value === "number" ? value : parseFloat(value);
  return `${currency}${Math.round(Number.isFinite(n) ? n : 0).toLocaleString("es-CO")}`;
}

/** Descuento si el precio de comparación es mayor que el precio actual. */
export function getDiscount(product: Pick<Product, "basePrice" | "comparePrice">) {
  const base = parseFloat(product.basePrice);
  const compare = product.comparePrice ? parseFloat(product.comparePrice) : 0;
  if (!(compare > base)) return null;
  return { compare, pct: Math.round(((compare - base) / compare) * 100), saving: compare - base };
}

export function variantLabel(v: ProductVariant): string {
  return v.color && v.size ? `${v.color} / ${v.size}` : v.color || v.size || "Opción";
}
