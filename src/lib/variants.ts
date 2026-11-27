/*
  Orden estable de las variantes de un producto.

  La base de datos no guarda cuándo se creó cada variante y la consulta no
  tenía ORDER BY, así que PostgreSQL las devolvía en el orden físico de las
  filas: al cambiar el stock de una, esta saltaba al final de la lista (en el
  panel y en la tienda). Con un orden fijo y «natural» eso ya no ocurre:
  por color, luego por talla (XS, S, M, L, XL… en su orden) y los números
  como números («Combo 2» antes que «Combo 10»).
*/

const SIZE_RANK: Record<string, number> = {
  xxs: 0, xs: 1, s: 2, m: 3, l: 4, xl: 5, xxl: 6, "2xl": 6, xxxl: 7, "3xl": 7, "4xl": 8, "5xl": 9,
};

const collator = new Intl.Collator("es", { numeric: true, sensitivity: "base" });

interface Orderable {
  id: string;
  color: string | null;
  size: string | null;
}

export function compareVariants(a: Orderable, b: Orderable): number {
  const byColor = collator.compare((a.color ?? "").trim(), (b.color ?? "").trim());
  if (byColor !== 0) return byColor;

  const sa = (a.size ?? "").trim().toLowerCase();
  const sb = (b.size ?? "").trim().toLowerCase();
  const ra = SIZE_RANK[sa];
  const rb = SIZE_RANK[sb];
  if (ra !== undefined && rb !== undefined && ra !== rb) return ra - rb;
  if (ra !== undefined && rb === undefined) return -1;
  if (ra === undefined && rb !== undefined) return 1;

  const bySize = collator.compare(sa, sb);
  if (bySize !== 0) return bySize;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0; // desempate fijo
}
