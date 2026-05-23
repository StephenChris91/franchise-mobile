import { NextRequest } from "next/server";
import { and, eq, ilike, or } from "drizzle-orm";
import { db, profiles } from "@franchise/db";
import { listMembersSchema } from "@franchise/validators";
import { ok, err, withAuth } from "@/lib/api/middleware";

export async function GET(req: NextRequest) {
  return withAuth(req, async (req) => {
    const sp = Object.fromEntries(req.nextUrl.searchParams);
    const parsed = listMembersSchema.safeParse(sp);
    if (!parsed.success) return err("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid params", 400);

    const { search, ministry, limit } = parsed.data;

    const conditions = [
      eq(profiles.approvalStatus, "approved"),
      ...(ministry ? [eq(profiles.ministry, ministry)] : []),
      ...(search ? [or(ilike(profiles.fullName, `%${search}%`), ilike(profiles.username, `%${search}%`))] : []),
    ].filter(Boolean) as Parameters<typeof and>;

    const rows = await db
      .select({
        userId: profiles.userId, username: profiles.username, fullName: profiles.fullName,
        photoUrl: profiles.photoUrl, ministry: profiles.ministry, bio: profiles.bio,
      })
      .from(profiles)
      .where(and(...conditions))
      .orderBy(profiles.fullName)
      .limit(limit);

    return ok(rows);
  });
}
