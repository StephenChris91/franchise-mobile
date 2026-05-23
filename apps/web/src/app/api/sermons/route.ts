import { desc, sql } from "drizzle-orm";
import { db, sermons } from "@franchise/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const offset = Math.max(0, parseInt(searchParams.get("offset") ?? "0"));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "8")));

  try {
    const [rows, totalRows] = await Promise.all([
      db
        .select()
        .from(sermons)
        .orderBy(desc(sermons.date))
        .limit(limit)
        .offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(sermons),
    ]);

    const total = totalRows[0]?.count ?? 0;

    return Response.json({
      sermons: rows,
      pagination: {
        total,
        hasMore: offset + rows.length < total,
        nextOffset: offset + rows.length,
      },
    });
  } catch (err) {
    console.error("[/api/sermons] fetch error:", err);
    return Response.json(
      { sermons: [], pagination: { total: 0, hasMore: false, nextOffset: 0 } },
      { status: 500 }
    );
  }
}
