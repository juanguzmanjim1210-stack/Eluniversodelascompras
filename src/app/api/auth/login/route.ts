import { NextRequest, NextResponse } from "next/server";
import { verifyPassword, createSessionToken, setSessionCookie } from "@/lib/auth";
import { checkRateLimit, registerFailure, clearFailures, tooManyRequests } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const SCOPE = "auth:login";

  const limit = checkRateLimit(req, SCOPE);
  if (!limit.allowed) return tooManyRequests(limit.retryAfterSeconds);

  try {
    const { password } = await req.json();

    if (!password) {
      return NextResponse.json({ error: "Contraseña requerida" }, { status: 400 });
    }

    const isValid = await verifyPassword(password);
    if (!isValid) {
      registerFailure(req, SCOPE);
      return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 401 });
    }

    clearFailures(req, SCOPE);
    const token = await createSessionToken();
    const response = NextResponse.json({ success: true });
    setSessionCookie(response, token);
    return response;
  } catch (e) {
    console.error("POST login error:", e);
    const configError = e instanceof Error && e.message.includes("JWT_SECRET");
    if (configError) {
      return NextResponse.json({ error: e.message }, { status: 503 });
    }
    return NextResponse.json({ error: "Error al iniciar sesión" }, { status: 500 });
  }
}
