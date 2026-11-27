import { NextRequest, NextResponse } from "next/server";
import { createOrder, listOrders } from "@/lib/orders";
import { isAuthenticated } from "@/lib/auth";
import { checkRateLimit, clearFailures, registerFailure, tooManyRequests } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * POST /api/orders — crear un pedido desde el catálogo.
 *
 * Público a propósito (el comprador no inicia sesión), pero limitado por IP
 * y con todo el cálculo —precios, stock y total— en el servidor.
 */
export async function POST(req: NextRequest) {
  try {
    // Cada intento cuenta: corta el spam de pedidos desde una misma IP.
    const limit = checkRateLimit(req, "order");
    if (!limit.allowed) return tooManyRequests(limit.retryAfterSeconds);

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      registerFailure(req, "order");
      return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
    }

    const result = await createOrder(
      (body.items as never) ?? [],
      (body.customer as never) ?? ({} as never)
    );

    if (!result.ok) {
      // Un pedido rechazado también cuenta como intento.
      registerFailure(req, "order");
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    clearFailures(req, "order");
    return NextResponse.json(result.order, { status: 201 });
  } catch (e) {
    console.error("POST /api/orders:", e);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

/** GET /api/orders — listar pedidos. Solo administración. */
export async function GET(req: NextRequest) {
  if (!(await isAuthenticated(req))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    return NextResponse.json(await listOrders());
  } catch (e) {
    console.error("GET /api/orders:", e);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
