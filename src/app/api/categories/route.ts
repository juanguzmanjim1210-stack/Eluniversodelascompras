import { NextRequest, NextResponse } from "next/server";
import { getCategories, createCategory, deleteCategory } from "@/lib/data";

export async function GET() {
  try {
    return NextResponse.json(await getCategories());
  } catch (e) {
    console.error("GET categories error:", e);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const row = await createCategory(body);
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    console.error("POST categories error:", e);
    return NextResponse.json({ error: "Error creando" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = new URL(req.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    await deleteCategory(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE categories error:", e);
    return NextResponse.json({ error: "Error eliminando" }, { status: 500 });
  }
}
