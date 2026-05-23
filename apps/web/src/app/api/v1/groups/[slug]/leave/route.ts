import { NextRequest } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { db, groups, groupMembers } from "@franchise/db";
import { ok, err, withApproved } from "@/lib/api/middleware";

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  return withApproved(req, async (_, user) => {
    const { slug } = await params;
    const [group] = await db.select().from(groups).where(eq(groups.slug, slug)).limit(1);
    if (!group) return err("NOT_FOUND", "Group not found", 404);

    const deleted = await db.delete(groupMembers).where(and(eq(groupMembers.groupId, group.id), eq(groupMembers.userId, user.sub))).returning();
    if (deleted.length > 0) {
      await db.update(groups).set({ memberCount: sql`GREATEST(${groups.memberCount} - 1, 0)` }).where(eq(groups.id, group.id));
    }

    return ok({ ok: true });
  });
}
