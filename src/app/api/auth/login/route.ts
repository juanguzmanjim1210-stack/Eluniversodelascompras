import { NextRequest, NextResponse } from "next/server";
import { verifyPassword, createSessionToken, setSessionCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();

    if (!password) {
      return NextResponse.json({ error: "Contraseña requerida" }, { status: 400 });
    }

    const isValid = await verifyPassword(password);
    if (!isValid) {
      return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 401 });
    }

    const token = await createSessionToken();
    const response = NextResponse.json({ success: true });
    setSessionCookie(response, token);
    return response;
  } catch (e) {
    console.error("LOGIN ERROR:", e);
    return NextResponse.json({ error: "Error al iniciar sesión", detail: String(e) }, { status: 500 });
  }
}
