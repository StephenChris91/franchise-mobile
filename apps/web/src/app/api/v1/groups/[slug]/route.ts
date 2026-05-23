import { NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { db, groups, groupMembers } from "@franchise/db";
import { ok, err, withAuth } from "@/lib/api/middleware";

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  return withAuth(req, async (_, user) => {
    const { slug } = await params;
    const [group] = await db.select().from(groups).where(eq(groups.slug, slug)).limit(1);
    if (!group) return err("NOT_FOUND", "Group not found", 404);

    const [membership] = await db.select().from(groupMembers).where(and(eq(groupMembers.groupId, group.id), eq(groupMembers.userId, user.sub))).limit(1);

    return ok({
      id: group.id, slug: group.slug, name: group.name, description: group.description,
      groupType: group.groupType, visibility: group.visibility, coverImageUrl: group.coverImageUrl,
      memberCount: group.memberCount, createdAt: group.createdAt.toISOString(),
      isMember: !!membership, userRole: membership?.role ?? null,
    });
  });
}
