import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { productVariants } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { isAuthenticated } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Ajuste de stock de una variante.
 *
 * Dos caminos con permisos distintos:
 *  - `setStock`  → fija un valor exacto. Solo admin autenticado.
 *  - `quantity`  → descuenta unidades (lo usa el checkout del catálogo).
 *                  Debe ser un entero positivo: antes aceptaba negativos,
 *                  lo que permitía *sumar* stock arbitrariamente sin sesión.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { variantId, quantity, setStock } = body;

    if (!variantId || typeof variantId !== "string") {
      return NextResponse.json({ error: "variantId required" }, { status: 400 });
    }

    const [variant] = await db
      .select()
      .from(productVariants)
      .where(and(eq(productVariants.id, variantId), eq(productVariants.productId, id)));

    // Idempotente: si la variante no existe devolvemos ok sin tocar nada.
    if (!variant) return NextResponse.json({ ok: true });

    if (typeof setStock === "number") {
      if (!(await isAuthenticated(req))) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
      }
      if (!Number.isFinite(setStock)) {
        return NextResponse.json({ error: "setStock inválido" }, { status: 400 });
      }
      const next = Math.max(0, Math.round(setStock));
      await db.update(productVariants).set({ stock: next }).where(eq(productVariants.id, variantId));
      return NextResponse.json({ ok: true, stock: next });
    }

    if (typeof quantity === "number") {
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 1000) {
        return NextResponse.json(
          { error: "quantity debe ser un entero entre 1 y 1000" },
          { status: 400 }
        );
      }
      const next = Math.max(0, variant.stock - quantity);
      await db.update(productVariants).set({ stock: next }).where(eq(productVariants.id, variantId));
      return NextResponse.json({ ok: true, stock: next });
    }

    return NextResponse.json({ error: "setStock o quantity requerido" }, { status: 400 });
  } catch (e) {
    console.error("Stock update error:", e);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
