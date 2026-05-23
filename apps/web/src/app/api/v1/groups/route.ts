import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db, groups, groupMembers } from "@franchise/db";
import { ok, withAuth } from "@/lib/api/middleware";

export async function GET(req: NextRequest) {
  return withAuth(req, async (_, user) => {
    const allGroups = await db.select().from(groups).orderBy(groups.name);

    const memberships = await db
      .select({ groupId: groupMembers.groupId, role: groupMembers.role })
      .from(groupMembers)
      .where(eq(groupMembers.userId, user.sub));

    const memberMap = Object.fromEntries(memberships.map((m) => [m.groupId, m.role]));

    return ok(allGroups.map((g) => ({
      id: g.id,
      slug: g.slug,
      name: g.name,
      description: g.description,
      groupType: g.groupType,
      visibility: g.visibility,
      coverImageUrl: g.coverImageUrl,
      memberCount: g.memberCount,
      createdAt: g.createdAt.toISOString(),
      isMember: !!memberMap[g.id],
      userRole: memberMap[g.id] ?? null,
    })));
  });
}
