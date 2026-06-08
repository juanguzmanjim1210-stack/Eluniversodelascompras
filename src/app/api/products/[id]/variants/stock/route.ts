import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { products, productVariants } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { variantId, quantity, setStock, productStock } = await req.json();

    // ---- Update PRODUCT stock (sin variantes) ----
    if (typeof productStock === "number") {
      await db.update(products).set({ stock: Math.max(0, productStock) }).where(eq(products.id, id));
      return NextResponse.json({ ok: true });
    }

    if (!variantId && typeof quantity === "number") {
      const [prod] = await db.select().from(products).where(eq(products.id, id));
      if (prod) {
        await db.update(products).set({ stock: Math.max(0, prod.stock - quantity) }).where(eq(products.id, id));
      }
      return NextResponse.json({ ok: true });
    }

    // ---- Update VARIANT stock ----
    if (!variantId) return NextResponse.json({ error: "variantId required" }, { status: 400 });

    const [variant] = await db.select().from(productVariants).where(and(eq(productVariants.id, variantId), eq(productVariants.productId, id)));
    if (variant) {
      if (typeof setStock === "number") {
        await db.update(productVariants).set({ stock: Math.max(0, setStock) }).where(eq(productVariants.id, variantId));
      } else if (typeof quantity === "number") {
        await db.update(productVariants).set({ stock: Math.max(0, variant.stock - quantity) }).where(eq(productVariants.id, variantId));
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Stock update error:", e);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
