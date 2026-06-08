import { NextRequest, NextResponse } from "next/server";
import { getStoreSettings, updateStoreSettings } from "@/lib/data";

export async function GET() {
  try {
    const row = await getStoreSettings();
    return NextResponse.json(row);
  } catch (e) {
    console.error("GET store-settings error:", e);
    return NextResponse.json({
      id: 1, storeName: "Mi Tienda", storeDescription: null, logoUrl: null,
      coverUrl: null, facebook: null, whatsapp: null, instagram: null, tiktok: null,
      primaryColor: "#16a34a", buttonText: "Comprar", currency: "$",
      footerText: null, announcementText: null, announcementActive: false, announcementColor: "#16a34a", announcementSpeed: 40,
    });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const row = await updateStoreSettings(body);
    return NextResponse.json(row);
  } catch (e) {
    console.error("PUT store-settings error:", e);
    return NextResponse.json({ error: "Error guardando" }, { status: 500 });
  }
}
