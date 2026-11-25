import { NextRequest, NextResponse } from "next/server";
import { getStoreSettings, updateStoreSettings } from "@/lib/data";
import { isAuthenticated } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const row = await getStoreSettings();
    return NextResponse.json(row);
  } catch (e) {
    console.error("GET store-settings error:", e);
    return NextResponse.json({ error: "Error cargando configuración" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  // Sin esta comprobación cualquiera podía reescribir nombre, colores,
  // redes sociales y textos de la tienda pública.
  if (!(await isAuthenticated(req))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const row = await updateStoreSettings(body);
    return NextResponse.json(row);
  } catch (e) {
    console.error("PUT store-settings error:", e);
    return NextResponse.json({ error: "Error guardando" }, { status: 500 });
  }
}
