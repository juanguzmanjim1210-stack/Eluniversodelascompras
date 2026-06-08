import { NextRequest, NextResponse } from "next/server";
import { getProducts, createProduct } from "@/lib/data";

export async function GET(req: NextRequest) {
  const p = new URL(req.url).searchParams;
  const products = await getProducts({
    categoryId: p.get("categoryId") || undefined,
    search: p.get("search") || undefined,
    active: p.get("active") === "true",
  });
  return NextResponse.json(products);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const row = await createProduct(body);
  return NextResponse.json(row, { status: 201 });
}
