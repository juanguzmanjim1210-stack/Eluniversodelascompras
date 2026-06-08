import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { variantId, quantity, setStock } = body;
    if (!variantId) return NextResponse.json({ error: "variantId required" }, { status: 400 });

    const { isFirebaseConfigured, getFirestoreDb } = await import("@/lib/firebase");

    if (isFirebaseConfigured()) {
      const fs = getFirestoreDb();
      const ref = fs.collection("products").doc(id).collection("variants").doc(variantId);
      const snap = await ref.get();
      if (snap.exists) {
        if (typeof setStock === "number") {
          // Set stock directly
          await ref.update({ stock: Math.max(0, setStock) });
        } else if (typeof quantity === "number") {
          // Subtract quantity from stock
          const current = snap.data()!.stock || 0;
          const newStock = Math.max(0, current - quantity);
          await ref.update({ stock: newStock });
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
          const newStock = Math.max(0, variant.stock - quantity);
          await db.update(productVariants).set({ stock: newStock }).where(eq(productVariants.id, variantId));
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Stock update error:", e);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
