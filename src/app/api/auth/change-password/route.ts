import { NextRequest, NextResponse } from "next/server";
import { changePassword, isAuthenticated } from "@/lib/auth";
import { checkRateLimit, registerFailure, clearFailures, tooManyRequests } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // Requiere sesión de admin: sin esto cualquiera podría redefinir la contraseña.
  if (!(await isAuthenticated(req))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const SCOPE = "auth:change-password";
  const limit = checkRateLimit(req, SCOPE);
  if (!limit.allowed) return tooManyRequests(limit.retryAfterSeconds);

  try {
    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Ambas contraseñas son requeridas" }, { status: 400 });
    }

    // changePassword already verifies currentPassword internally
    const result = await changePassword(currentPassword, newPassword);

    if (!result.success) {
      registerFailure(req, SCOPE);
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    clearFailures(req, SCOPE);
    return NextResponse.json({
      success: true,
      message: "Contraseña actualizada correctamente",
    });
  } catch (e) {
    console.error("POST change-password error:", e);
    return NextResponse.json({ error: "Error al cambiar la contraseña" }, { status: 500 });
  }
}
