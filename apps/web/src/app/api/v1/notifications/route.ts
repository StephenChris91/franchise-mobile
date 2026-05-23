import { NextRequest } from "next/server";
import { and, eq, lt, desc, inArray } from "drizzle-orm";
import { db, notifications, profiles } from "@franchise/db";
import { listNotificationsSchema } from "@franchise/validators";
import { ok, err, withAuth, encodeCursor, decodeCursor } from "@/lib/api/middleware";

export async function GET(req: NextRequest) {
  return withAuth(req, async (req, user) => {
    const sp = Object.fromEntries(req.nextUrl.searchParams);
    const parsed = listNotificationsSchema.safeParse(sp);
    if (!parsed.success) return err("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid params", 400);

    const { cursor, limit } = parsed.data;
    const cursorDecoded = cursor ? decodeCursor(cursor) : null;

    const rows = await db
      .select()
      .from(notifications)
      .where(and(
        eq(notifications.userId, user.sub),
        ...(cursorDecoded ? [lt(notifications.createdAt, cursorDecoded.createdAt)] : [])
      ))
      .orderBy(desc(notifications.createdAt))
      .limit(limit + 1);

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;

    const actorIds = [...new Set(page.map((r) => r.actorId).filter(Boolean) as string[])];
    const actorProfiles = actorIds.length
      ? await db.select({ userId: profiles.userId, fullName: profiles.fullName }).from(profiles).where(inArray(profiles.userId, actorIds))
      : [];
    const actorMap = Object.fromEntries(actorProfiles.map((p) => [p.userId, p.fullName]));

    const nextCursor = hasMore && page.length > 0
      ? encodeCursor(page[page.length - 1]!.id, page[page.length - 1]!.createdAt)
      : null;

    return ok({
      data: page.map((n) => ({
        id: n.id, notificationType: n.notificationType, entityType: n.entityType, entityId: n.entityId,
        isRead: n.isRead, createdAt: n.createdAt.toISOString(), actorId: n.actorId,
        actorName: n.actorId ? actorMap[n.actorId] : undefined,
      })),
      nextCursor,
      hasMore,
    });
  });
}
