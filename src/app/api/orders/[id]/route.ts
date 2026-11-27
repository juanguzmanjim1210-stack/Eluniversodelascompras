import { NextRequest, NextResponse } from "next/server";
import { releaseOrderStock, updateOrderStatus } from "@/lib/orders";
import { isAuthenticated } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/orders/[id] — cambiar el estado de un pedido.
 *
 * Solo administración. Al cancelar se devuelven las unidades al stock.
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isAuthenticated(req))) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json().catch(() => null);
    const status = body && typeof body === "object" ? (body.status as string) : undefined;
    if (!status) return NextResponse.json({ error: "status requerido" }, { status: 400 });

    const current = await updateOrderStatus(id, status);
    if (!current.ok) {
      return NextResponse.json({ error: current.error }, { status: status === "Pedido no encontrado" ? 404 : 400 });
    }

    if (status === "cancelled") await releaseOrderStock(id);

    return NextResponse.json({ ok: true, status });
  } catch (e) {
    console.error("PATCH /api/orders:", e);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
