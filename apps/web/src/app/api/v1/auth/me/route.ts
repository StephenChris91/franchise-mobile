import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db, users, profiles } from "@franchise/db";
import { ok, err, withAuth } from "@/lib/api/middleware";

export async function GET(req: NextRequest) {
  return withAuth(req, async (_, user) => {
    const [profile] = await db.select().from(profiles).where(eq(profiles.userId, user.sub)).limit(1);
    const [dbUser] = await db.select().from(users).where(eq(users.id, user.sub)).limit(1);

    if (!profile || !dbUser) return err("NOT_FOUND", "User not found", 404);

    return ok({
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      username: profile.username,
      fullName: profile.fullName,
      photoUrl: profile.photoUrl,
      role: profile.role,
      approvalStatus: profile.approvalStatus,
      ministry: profile.ministry,
      bio: profile.bio,
      phone: profile.phone,
      whatsappNumber: profile.whatsappNumber,
      createdAt: profile.createdAt.toISOString(),
    });
  });
}
