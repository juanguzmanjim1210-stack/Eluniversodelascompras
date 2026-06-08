import { NextRequest, NextResponse } from "next/server";
import { setProductImages, deleteProductImage } from "@/lib/data";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { urls } = await req.json();
  const filtered = (urls as string[] || []).filter((u) => u.trim() !== "");
  if (filtered.length > 10) return NextResponse.json({ error: "Máximo 10 imágenes" }, { status: 400 });
  const created = await setProductImages(id, filtered);
  return NextResponse.json(created);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const imageId = new URL(req.url).searchParams.get("imageId");
  if (!imageId) return NextResponse.json({ error: "imageId required" }, { status: 400 });
  await deleteProductImage(id, imageId);
  return NextResponse.json({ ok: true });
}
