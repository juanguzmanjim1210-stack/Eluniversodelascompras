import { NextRequest, NextResponse } from "next/server";
import { addProductVariant, deleteProductVariant } from "@/lib/data";
import { isAuthenticated } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAuthenticated(req))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const body = await req.json();
    const row = await addProductVariant(id, body);
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    console.error("POST variant error:", e);
    return NextResponse.json({ error: "Error creando variante" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAuthenticated(req))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const variantId = new URL(req.url).searchParams.get("variantId");
    if (!variantId) return NextResponse.json({ error: "variantId required" }, { status: 400 });
    await deleteProductVariant(id, variantId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE variant error:", e);
    return NextResponse.json({ error: "Error eliminando variante" }, { status: 500 });
  }
}
