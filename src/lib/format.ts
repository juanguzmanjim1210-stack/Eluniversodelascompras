import type { Product, ProductVariant } from "@/lib/types";

/** «$1.234.567» con separador de miles colombiano, sin decimales. */
export function formatMoney(currency: string, value: string | number): string {
  const n = typeof value === "number" ? value : parseFloat(value);
  return `${currency}${Math.round(Number.isFinite(n) ? n : 0).toLocaleString("es-CO")}`;
}

/**
 * Devuelve true cuando el precio es el guion especial "-".
 * En ese caso la tarjeta y el modal no muestran ningún precio:
 * el cliente descubre el valor en las variantes al abrir el detalle.
 */
export function isPriceHidden(value: string | number | null | undefined): boolean {
  if (value === null || value === undefined) return false;
  return String(value).trim() === "-";
}

/** Descuento si el precio de comparación es mayor que el precio actual. */
export function getDiscount(product: Pick<Product, "basePrice" | "comparePrice">) {
  if (isPriceHidden(product.basePrice)) return null;
  const base = parseFloat(product.basePrice);
  const compare = product.comparePrice ? parseFloat(product.comparePrice) : 0;
  if (!(compare > base)) return null;
  return { compare, pct: Math.round(((compare - base) / compare) * 100), saving: compare - base };
}

export function variantLabel(v: ProductVariant): string {
  return v.color && v.size ? `${v.color} / ${v.size}` : v.color || v.size || "Opción";
}
