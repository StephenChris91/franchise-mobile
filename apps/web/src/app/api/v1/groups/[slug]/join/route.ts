import { NextRequest } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db, groups, groupMembers } from "@franchise/db";
import { ok, err, withApproved } from "@/lib/api/middleware";
import { pusherServer } from "@/lib/pusher";

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  return withApproved(req, async (_, user) => {
    const { slug } = await params;
    const [group] = await db.select().from(groups).where(eq(groups.slug, slug)).limit(1);
    if (!group) return err("NOT_FOUND", "Group not found", 404);

    await db.insert(groupMembers).values({ groupId: group.id, userId: user.sub }).onConflictDoNothing();
    await db.update(groups).set({ memberCount: sql`${groups.memberCount} + 1` }).where(eq(groups.id, group.id));
    pusherServer.trigger(`feed-${group.id}`, "member-joined", { userId: user.sub }).catch(() => {});

    return ok({ ok: true });
  });
}
