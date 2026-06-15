import { NextRequest, NextResponse } from "next/server";
import { getProducts, createProduct } from "@/lib/data";

export async function GET(req: NextRequest) {
  try {
    const p = new URL(req.url).searchParams;
    const products = await getProducts({
      categoryId: p.get("categoryId") || undefined,
      search: p.get("search") || undefined,
      active: p.get("active") === "true" ? true : undefined,
    });
    return NextResponse.json(products);
  } catch (e) {
    console.error("GET products error:", e);
    return NextResponse.json({ error: "Error", detail: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const row = await createProduct(body);
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    console.error("POST products error:", e);
    return NextResponse.json({ error: "Error creando" }, { status: 500 });
  }
}
