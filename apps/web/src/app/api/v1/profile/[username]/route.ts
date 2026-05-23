import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db, profiles } from "@franchise/db";
import { ok, err, withAuth } from "@/lib/api/middleware";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  return withAuth(req, async () => {
    const { username } = await params;
    const [profile] = await db
      .select({
        userId: profiles.userId,
        username: profiles.username,
        fullName: profiles.fullName,
        photoUrl: profiles.photoUrl,
        bio: profiles.bio,
        ministry: profiles.ministry,
        role: profiles.role,
        createdAt: profiles.createdAt,
      })
      .from(profiles)
      .where(eq(profiles.username, username))
      .limit(1);

    if (!profile) return err("NOT_FOUND", "Profile not found", 404);
    return ok(profile);
  });
}
