import { NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { db, profiles } from "@franchise/db";
import { ok, err, withAuth } from "@/lib/api/middleware";

export async function GET(req: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  return withAuth(req, async () => {
    const { username } = await params;
    const [profile] = await db
      .select({
        userId: profiles.userId, username: profiles.username, fullName: profiles.fullName,
        photoUrl: profiles.photoUrl, ministry: profiles.ministry, bio: profiles.bio, role: profiles.role,
      })
      .from(profiles)
      .where(and(eq(profiles.username, username), eq(profiles.approvalStatus, "approved")))
      .limit(1);

    if (!profile) return err("NOT_FOUND", "Member not found", 404);
    return ok(profile);
  });
}
