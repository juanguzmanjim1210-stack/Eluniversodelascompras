export const dynamic = "force-dynamic";
import { db } from "@/db";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    const result = await db.execute(sql`
      SELECT column_name FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'products' 
      ORDER BY ordinal_position
    `);
    return Response.json({ columns: result.rows });
  } catch (e) {
    return Response.json({ error: String(e) });
  }
}
