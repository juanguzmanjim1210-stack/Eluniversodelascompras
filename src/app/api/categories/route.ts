import { NextRequest, NextResponse } from "next/server";
import { getCategories, createCategory, deleteCategory } from "@/lib/data";

export async function GET() {
  return NextResponse.json(await getCategories());
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const row = await createCategory(body);
  return NextResponse.json(row, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await deleteCategory(id);
  return NextResponse.json({ ok: true });
}
