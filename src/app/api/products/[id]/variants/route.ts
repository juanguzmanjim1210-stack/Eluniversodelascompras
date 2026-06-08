import { NextRequest, NextResponse } from "next/server";
import { addProductVariant, deleteProductVariant } from "@/lib/data";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const row = await addProductVariant(id, body);
  return NextResponse.json(row, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const variantId = new URL(req.url).searchParams.get("variantId");
  if (!variantId) return NextResponse.json({ error: "variantId required" }, { status: 400 });
  await deleteProductVariant(id, variantId);
  return NextResponse.json({ ok: true });
}
