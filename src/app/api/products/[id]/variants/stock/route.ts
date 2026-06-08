import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { variantId, quantity } = await req.json();
    if (!variantId || !quantity) return NextResponse.json({ error: "variantId and quantity required" }, { status: 400 });

    // Dynamic import to support both Firebase and PostgreSQL
    const { isFirebaseConfigured, getFirestoreDb } = await import("@/lib/firebase");

    if (isFirebaseConfigured()) {
      const fs = getFirestoreDb();
      const ref = fs.collection("products").doc(id).collection("variants").doc(variantId);
      const snap = await ref.get();
      if (snap.exists) {
        const current = snap.data()!.stock || 0;
        const newStock = Math.max(0, current - quantity);
        await ref.update({ stock: newStock });
      }
    } else {
      const { db } = await import("@/db");
      const { productVariants } = await import("@/db/schema");
      const { eq, and } = await import("drizzle-orm");
      const [variant] = await db.select().from(productVariants).where(and(eq(productVariants.id, variantId), eq(productVariants.productId, id)));
      if (variant) {
        const newStock = Math.max(0, variant.stock - quantity);
        await db.update(productVariants).set({ stock: newStock }).where(eq(productVariants.id, variantId));
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Stock update error:", e);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
