import { NextRequest, NextResponse } from "next/server";
import { addProductFeature, deleteProductFeature } from "@/lib/data";
import { isAuthenticated } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAuthenticated(req))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const body = await req.json();
    if (!body?.key || !body?.value) {
      return NextResponse.json({ error: "key y value son requeridos" }, { status: 400 });
    }
    const row = await addProductFeature(id, String(body.key), String(body.value));
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    console.error("POST feature error:", e);
    return NextResponse.json({ error: "Error creando característica" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAuthenticated(req))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const featureId = new URL(req.url).searchParams.get("featureId");
    if (!featureId) return NextResponse.json({ error: "featureId required" }, { status: 400 });
    await deleteProductFeature(id, featureId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE feature error:", e);
    return NextResponse.json({ error: "Error eliminando característica" }, { status: 500 });
  }
}
