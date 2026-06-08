import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { setAdminHash } from "@/lib/data";

export async function POST(req: NextRequest) {
  const { secret, newPassword } = await req.json();

  // Only works with the JWT_SECRET as authorization
  const jwtSecret = process.env.JWT_SECRET || "catalogo-admin-secret-key-2024-change-me";

  if (secret !== jwtSecret) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (!newPassword || newPassword.length < 4) {
    return NextResponse.json({ error: "Contraseña mínimo 4 caracteres" }, { status: 400 });
  }

  const hash = await bcrypt.hash(newPassword, 10);
  await setAdminHash(hash);

  return NextResponse.json({ success: true, message: "Contraseña reseteada" });
}
