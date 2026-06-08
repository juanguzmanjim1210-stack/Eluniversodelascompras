import { NextRequest, NextResponse } from "next/server";
import { getStoreSettings, updateStoreSettings } from "@/lib/data";

export async function GET() {
  const row = await getStoreSettings();
  return NextResponse.json(row);
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const row = await updateStoreSettings(body);
  return NextResponse.json(row);
}
