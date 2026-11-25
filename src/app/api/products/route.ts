import { NextRequest, NextResponse } from "next/server";
import { getProducts, createProduct } from "@/lib/data";
import { isAuthenticated } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const p = new URL(req.url).searchParams;
    // stable products fetch
    const products = await getProducts({
      categoryId: p.get("categoryId") || undefined,
      search: p.get("search") || undefined,
      active: p.get("active") === "true" ? true : undefined,
    });
    return NextResponse.json(products);
  } catch (e) {
    console.error("GET products error:", e);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated(req))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const row = await createProduct(body);
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    console.error("POST products error:", e);
    return NextResponse.json({ error: "Error creando" }, { status: 500 });
  }
}
