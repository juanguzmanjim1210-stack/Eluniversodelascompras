import { NextRequest, NextResponse } from "next/server";
import { getCategories, createCategory, deleteCategory } from "@/lib/data";
import { isAuthenticated } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(await getCategories());
  } catch (e) {
    console.error("GET categories error:", e);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated(req))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const body = await req.json();
    if (!body?.name || !String(body.name).trim()) {
      return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 });
    }
    const row = await createCategory({ name: String(body.name).trim(), description: body.description });
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    console.error("POST categories error:", e);
    return NextResponse.json({ error: "Error creando" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!(await isAuthenticated(req))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
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
