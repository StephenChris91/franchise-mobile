import { NextRequest } from "next/server";
import { eq, inArray } from "drizzle-orm";
import { db, groups, groupMembers, profiles } from "@franchise/db";
import { ok, err, withAuth } from "@/lib/api/middleware";

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  return withAuth(req, async () => {
    const { slug } = await params;
    const [group] = await db.select().from(groups).where(eq(groups.slug, slug)).limit(1);
    if (!group) return err("NOT_FOUND", "Group not found", 404);

    const members = await db.select({ userId: groupMembers.userId, role: groupMembers.role, joinedAt: groupMembers.joinedAt }).from(groupMembers).where(eq(groupMembers.groupId, group.id));
    if (!members.length) return ok([]);

    const userIds = members.map((m) => m.userId);
    const profileRows = await db.select({ userId: profiles.userId, username: profiles.username, fullName: profiles.fullName, photoUrl: profiles.photoUrl }).from(profiles).where(inArray(profiles.userId, userIds));
    const profileMap = Object.fromEntries(profileRows.map((p) => [p.userId, p]));

    return ok(members.map((m) => ({
      userId: m.userId,
      role: m.role,
      joinedAt: m.joinedAt.toISOString(),
      profile: profileMap[m.userId] ?? { username: "member", fullName: "Member", photoUrl: null },
    })));
  });
}
