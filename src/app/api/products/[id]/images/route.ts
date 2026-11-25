import { NextRequest, NextResponse } from "next/server";
import { setProductImages, deleteProductImage } from "@/lib/data";
import { isAuthenticated } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAuthenticated(req))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const { urls } = await req.json();
    const filtered = ((urls as string[]) || []).filter((u) => typeof u === "string" && u.trim() !== "");
    if (filtered.length > 10) return NextResponse.json({ error: "Máximo 10 imágenes" }, { status: 400 });
    const created = await setProductImages(id, filtered);
    return NextResponse.json(created);
  } catch (e) {
    console.error("PUT images error:", e);
    return NextResponse.json({ error: "Error guardando imágenes" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAuthenticated(req))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const imageId = new URL(req.url).searchParams.get("imageId");
    if (!imageId) return NextResponse.json({ error: "imageId required" }, { status: 400 });
    await deleteProductImage(id, imageId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE image error:", e);
    return NextResponse.json({ error: "Error eliminando imagen" }, { status: 500 });
  }
}
