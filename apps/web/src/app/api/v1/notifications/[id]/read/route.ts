import { NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { db, notifications } from "@franchise/db";
import { ok, err, withAuth } from "@/lib/api/middleware";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, async (_, user) => {
    const { id } = await params;
    const updated = await db.update(notifications).set({ isRead: true }).where(and(eq(notifications.id, id), eq(notifications.userId, user.sub))).returning();
    if (!updated.length) return err("NOT_FOUND", "Notification not found", 404);
    return ok({ ok: true });
  });
}
