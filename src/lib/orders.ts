/*
  Checkout en el servidor.

  El navegador solo dice *qué* quiere llevar. Los precios, el stock y el
  total se leen aquí, de la base de datos, dentro de una transacción: así
  dos clientes no pueden comprar la última unidad a la vez ni cambiar el
  precio desde la consola del navegador.
*/
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, sql, desc } from "drizzle-orm";

export interface CartLine {
  productId: string;
  variantId?: string | null;
  quantity: number;
}

export interface CustomerInput {
  fullName: string;
  whatsapp: string;
  city: string;
  department: string;
  address: string;
}

export type CheckoutResult =
  | { ok: true; order: OrderSummary }
  | { ok: false; error: string; status: number };

export interface OrderSummary {
  id: string;
  number: number;
  total: string;
  itemCount: number;
  status: string;
  createdAt: string;
}

const MAX_LINES = 50;
const MAX_QTY_PER_LINE = 999;

function bad(error: string, status = 400): CheckoutResult {
  return { ok: false, error, status };
}

function cleanText(value: unknown, max: number): string {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

/** Precio unitario efectivo de una línea (variante si la hay, si no, base). */
function unitPriceOf(
  variant: { price: string } | undefined,
  basePrice: string
): number {
  const v = variant ? parseFloat(variant.price) : 0;
  return v > 0 ? v : parseFloat(basePrice);
}

/**
 * Crea un pedido descontando stock y calculando el total en el servidor.
 *
 * Devuelve `409` si algo del carrito ya no está disponible, para que el
 * carrito pueda refrescarse en lugar de vender de más.
 */
export async function createOrder(
  lines: CartLine[],
  customer: CustomerInput
): Promise<CheckoutResult> {
  if (!Array.isArray(lines) || lines.length === 0) {
    return bad("El carrito está vacío");
  }
  if (lines.length > MAX_LINES) {
    return bad("Demasiados artículos en el carrito");
  }

  const name = cleanText(customer?.fullName, 255);
  const phone = cleanText(customer?.whatsapp, 60);
  const city = cleanText(customer?.city, 255);
  const department = cleanText(customer?.department, 255);
  const address = cleanText(customer?.address, 1000);

  if (!name || !phone || !city || !department || !address) {
    return bad("Faltan datos de entrega");
  }
  if (phone.replace(/\D/g, "").length < 7) {
    return bad("El número de WhatsApp no parece válido");
  }

  // Une líneas repetidas del mismo producto+variante.
  const merged = new Map<string, CartLine>();
  for (const line of lines) {
    if (!line || typeof line.productId !== "string") {
      return bad("Línea de carrito inválida");
    }
    const qty = Number(line.quantity);
    if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY_PER_LINE) {
      return bad("Cantidad inválida");
    }
    const key = `${line.productId}::${line.variantId ?? ""}`;
    const prev = merged.get(key);
    const nextQty = (prev?.quantity ?? 0) + qty;
    if (nextQty > MAX_QTY_PER_LINE) return bad("Cantidad inválida");
    merged.set(key, {
      productId: line.productId,
      variantId: line.variantId ?? null,
      quantity: nextQty,
    });
  }

  const resolved: Array<{
    line: CartLine;
    productId: string;
    variantId: string | null;
    name: string;
    variantLabel: string | null;
    unitPrice: number;
    available: number;
  }> = [];

  for (const line of merged.values()) {
    const [product] = await db
      .select()
      .from(schema.products)
      .where(eq(schema.products.id, line.productId));

    if (!product || !product.active) {
      return bad("Un producto del carrito ya no está disponible", 409);
    }

    let variant: (typeof schema.productVariants.$inferSelect) | undefined;
    if (line.variantId) {
      const [found] = await db
        .select()
        .from(schema.productVariants)
        .where(eq(schema.productVariants.id, line.variantId));
      if (!found || found.productId !== product.id) {
        return bad("Una variante del carrito ya no está disponible", 409);
      }
      variant = found;
    }

    const available = variant ? variant.stock : product.stock;
    if (available < line.quantity) {
      const label = variant
        ? `${product.name} (${[variant.color, variant.size].filter(Boolean).join(" / ")})`
        : product.name;
      return bad(`Solo quedan ${available} unidades de ${label}`, 409);
    }

    const label = variant
      ? [variant.color, variant.size].filter(Boolean).join(" / ") || null
      : null;

    resolved.push({
      line,
      productId: product.id,
      variantId: variant?.id ?? null,
      name: product.name,
      variantLabel: label,
      unitPrice: unitPriceOf(variant, product.basePrice),
      available,
    });
  }

  const total = resolved.reduce(
    (sum, r) => sum + r.unitPrice * r.line.quantity,
    0
  );
  const itemCount = resolved.reduce((sum, r) => sum + r.line.quantity, 0);

  try {
    const created = await db.transaction(async (tx) => {
      // 1. Reserva de stock, condicionada a que siga habiendo unidades.
      for (const r of resolved) {
        if (r.variantId) {
          const updated = await tx
            .update(schema.productVariants)
            .set({
              stock: sql`greatest(${schema.productVariants.stock} - ${r.line.quantity}, 0)`,
            })
            .where(
              sql`${schema.productVariants.id} = ${r.variantId} AND ${schema.productVariants.stock} >= ${r.line.quantity}`
            )
            .returning({ id: schema.productVariants.id });
          if (updated.length === 0) {
            throw new CheckoutError(`Se agotó ${r.name} durante la compra`);
          }
        } else {
          const updated = await tx
            .update(schema.products)
            .set({
              stock: sql`greatest(${schema.products.stock} - ${r.line.quantity}, 0)`,
            })
            .where(
              sql`${schema.products.id} = ${r.productId} AND ${schema.products.stock} >= ${r.line.quantity}`
            )
            .returning({ id: schema.products.id });
          if (updated.length === 0) {
            throw new CheckoutError(`Se agotó ${r.name} durante la compra`);
          }
        }
      }

      // 2. Número correlativo visible para el cliente.
      const [{ nextNumber }] = await tx
        .select({ nextNumber: sql<number>`coalesce(max(${schema.orders.number}), 0) + 1` })
        .from(schema.orders);

      const [order] = await tx
        .insert(schema.orders)
        .values({
          number: nextNumber,
          customerName: name,
          customerPhone: phone,
          customerCity: city,
          customerDepartment: department,
          customerAddress: address,
          total: total.toFixed(2),
          itemCount,
          status: "pending",
        })
        .returning();

      // 3. Líneas del pedido, con el precio congelado.
      await tx.insert(schema.orderItems).values(
        resolved.map((r) => ({
          orderId: order.id,
          productId: r.productId,
          variantId: r.variantId,
          name: r.name,
          variantLabel: r.variantLabel,
          quantity: r.line.quantity,
          unitPrice: r.unitPrice.toFixed(2),
        }))
      );

      return order;
    });

    return {
      ok: true,
      order: {
        id: created.id,
        number: created.number,
        total: created.total,
        itemCount: created.itemCount,
        status: created.status,
        createdAt: created.createdAt.toISOString(),
      },
    };
  } catch (e) {
    if (e instanceof CheckoutError) return bad(e.message, 409);
    console.error("Checkout error:", e);
    return { ok: false, error: "No se pudo procesar el pedido", status: 500 };
  }
}

class CheckoutError extends Error {}

/** Pedidos más recientes. Solo para el panel de administración. */
export async function listOrders(limit = 100) {
  const rows = await db
    .select()
    .from(schema.orders)
    .orderBy(desc(schema.orders.createdAt))
    .limit(limit);

  const items = await db.select().from(schema.orderItems);

  return rows.map((o) => ({
    ...o,
    createdAt: o.createdAt.toISOString(),
    updatedAt: o.updatedAt.toISOString(),
    items: items.filter((i) => i.orderId === o.id),
  }));
}

const ALLOWED_STATUS = ["pending", "preparing", "shipped", "delivered", "cancelled"] as const;

export async function updateOrderStatus(
  id: string,
  status: string
): Promise<{ ok: boolean; error?: string }> {
  if (!(ALLOWED_STATUS as readonly string[]).includes(status)) {
    return { ok: false, error: "Estado no válido" };
  }
  const updated = await db
    .update(schema.orders)
    .set({ status, updatedAt: new Date() })
    .where(eq(schema.orders.id, id))
    .returning({ id: schema.orders.id });

  if (updated.length === 0) return { ok: false, error: "Pedido no encontrado" };
  return { ok: true };
}

/** Devuelve al stock las unidades de un pedido cancelado. */
export async function releaseOrderStock(id: string): Promise<void> {
  const items = await db.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, id));
  for (const item of items) {
    if (item.variantId) {
      await db
        .update(schema.productVariants)
        .set({ stock: sql`${schema.productVariants.stock} + ${item.quantity}` })
        .where(eq(schema.productVariants.id, item.variantId));
    } else if (item.productId) {
      await db
        .update(schema.products)
        .set({ stock: sql`${schema.products.stock} + ${item.quantity}` })
        .where(eq(schema.products.id, item.productId));
    }
  }
}
