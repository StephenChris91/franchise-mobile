import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db, profiles } from "@franchise/db";
import { updateProfileSchema } from "@franchise/validators";
import { ok, err, withApproved } from "@/lib/api/middleware";

export async function GET(req: NextRequest) {
  return withApproved(req, async (_, user) => {
    const [profile] = await db.select().from(profiles).where(eq(profiles.userId, user.sub)).limit(1);
    if (!profile) return err("NOT_FOUND", "Profile not found", 404);
    return ok(profile);
  });
}

export async function PATCH(req: NextRequest) {
  return withApproved(req, async (req, user) => {
    let body: unknown;
    try { body = await req.json(); } catch { return err("BAD_REQUEST", "Invalid JSON", 400); }

    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) return err("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input", 400);

    const { fullName, bio, ministry, phone, whatsappNumber, photoUrl } = parsed.data;
    await db.update(profiles).set({
      fullName,
      bio: bio ?? null,
      ministry,
      phone: phone || null,
      whatsappNumber: whatsappNumber || null,
      photoUrl: photoUrl ?? null,
      updatedAt: new Date(),
    }).where(eq(profiles.userId, user.sub));

    const [updated] = await db.select().from(profiles).where(eq(profiles.userId, user.sub)).limit(1);
    return ok(updated);
  });
}
