import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { variantId, quantity, setStock, productStock } = body;

    const { isFirebaseConfigured, getFirestoreDb } = await import("@/lib/firebase");

    // ---- Update PRODUCT stock (products without variants) ----
    if (typeof productStock === "number" || (!variantId && typeof quantity === "number")) {
      if (isFirebaseConfigured()) {
        const fs = getFirestoreDb();
        const ref = fs.collection("products").doc(id);
        const snap = await ref.get();
        if (snap.exists) {
          if (typeof productStock === "number") {
            await ref.update({ stock: Math.max(0, productStock) });
          } else if (typeof quantity === "number") {
            const current = (snap.data()!.stock as number) || 0;
            await ref.update({ stock: Math.max(0, current - quantity) });
          }
        }
      } else {
        const { db } = await import("@/db");
        const { products } = await import("@/db/schema");
        const { eq } = await import("drizzle-orm");
        const [prod] = await db.select().from(products).where(eq(products.id, id));
        if (prod) {
          if (typeof productStock === "number") {
            await db.update(products).set({ stock: Math.max(0, productStock) }).where(eq(products.id, id));
          } else if (typeof quantity === "number") {
            await db.update(products).set({ stock: Math.max(0, prod.stock - quantity) }).where(eq(products.id, id));
          }
        }
      }
      return NextResponse.json({ ok: true });
    }

    // ---- Update VARIANT stock ----
    if (!variantId) return NextResponse.json({ error: "variantId or productStock required" }, { status: 400 });

    if (isFirebaseConfigured()) {
      const fs = getFirestoreDb();
      const ref = fs.collection("products").doc(id).collection("variants").doc(variantId);
      const snap = await ref.get();
      if (snap.exists) {
        if (typeof setStock === "number") {
          await ref.update({ stock: Math.max(0, setStock) });
        } else if (typeof quantity === "number") {
          const current = (snap.data()!.stock as number) || 0;
          await ref.update({ stock: Math.max(0, current - quantity) });
        }
      }
    } else {
      const { db } = await import("@/db");
      const { productVariants } = await import("@/db/schema");
      const { eq, and } = await import("drizzle-orm");
      const [variant] = await db.select().from(productVariants).where(and(eq(productVariants.id, variantId), eq(productVariants.productId, id)));
      if (variant) {
        if (typeof setStock === "number") {
          await db.update(productVariants).set({ stock: Math.max(0, setStock) }).where(eq(productVariants.id, variantId));
        } else if (typeof quantity === "number") {
          await db.update(productVariants).set({ stock: Math.max(0, variant.stock - quantity) }).where(eq(productVariants.id, variantId));
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Stock update error:", e);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
