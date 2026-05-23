import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db, notifications } from "@franchise/db";
import { ok, withAuth } from "@/lib/api/middleware";

export async function POST(req: NextRequest) {
  return withAuth(req, async (_, user) => {
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, user.sub));
    return ok({ ok: true });
  });
}
