import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { setAdminHash } from "@/lib/data";
import { getJwtSecret, safeEqual } from "@/lib/auth";
import { checkRateLimit, registerFailure, tooManyRequests } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const SCOPE = "auth:reset";
  const limit = checkRateLimit(req, SCOPE);
  if (!limit.allowed) return tooManyRequests(limit.retryAfterSeconds);

  // Sin JWT_SECRET configurado este endpoint no debe existir: usar el
  // secreto por defecto permitiría resetear la contraseña a cualquiera.
  let expectedSecret: string;
  try {
    expectedSecret = getJwtSecret();
  } catch (e) {
    console.error("POST reset error:", e);
    return NextResponse.json({ error: "JWT_SECRET no está configurado en el servidor" }, { status: 503 });
  }

  try {
    const { secret, newPassword } = await req.json();

    if (typeof secret !== "string" || !safeEqual(secret, expectedSecret)) {
      registerFailure(req, SCOPE);
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json({ error: "Contraseña mínimo 8 caracteres" }, { status: 400 });
    }

    const hash = await bcrypt.hash(newPassword, 10);
    await setAdminHash(hash);

    return NextResponse.json({ success: true, message: "Contraseña reseteada" });
  } catch (e) {
    console.error("POST reset error:", e);
    return NextResponse.json({ error: "Error al resetear la contraseña" }, { status: 500 });
  }
}
