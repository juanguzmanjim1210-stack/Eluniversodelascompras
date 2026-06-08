import { NextRequest, NextResponse } from "next/server";
import { addProductFeature, deleteProductFeature } from "@/lib/data";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const row = await addProductFeature(id, body.key, body.value);
  return NextResponse.json(row, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const featureId = new URL(req.url).searchParams.get("featureId");
  if (!featureId) return NextResponse.json({ error: "featureId required" }, { status: 400 });
  await deleteProductFeature(id, featureId);
  return NextResponse.json({ ok: true });
}
