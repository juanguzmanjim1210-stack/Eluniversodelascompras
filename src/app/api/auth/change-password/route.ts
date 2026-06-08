import { NextRequest, NextResponse } from "next/server";
import { changePassword } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Ambas contraseñas son requeridas" },
        { status: 400 }
      );
    }

    // changePassword already verifies currentPassword internally
    const result = await changePassword(currentPassword, newPassword);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "Contraseña actualizada correctamente",
    });
  } catch {
    return NextResponse.json(
      { error: "Error al cambiar la contraseña" },
      { status: 500 }
    );
  }
}
