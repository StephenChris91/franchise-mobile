import { NextRequest } from "next/server";
import { and, eq, count } from "drizzle-orm";
import { db, notifications } from "@franchise/db";
import { ok, withAuth } from "@/lib/api/middleware";

export async function GET(req: NextRequest) {
  return withAuth(req, async (_, user) => {
    const [{ value }] = await db.select({ value: count() }).from(notifications).where(and(eq(notifications.userId, user.sub), eq(notifications.isRead, false)));
    return ok({ count: value });
  });
}
