import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, users, profiles } from "@franchise/db";
import { signAccessToken, signRefreshToken, storeRefreshToken } from "@franchise/auth";
import { loginSchema } from "@franchise/validators";
import { ok, err } from "@/lib/api/middleware";

export async function POST(req: NextRequest) {
  let body: unknown;
  try { body = await req.json(); } catch { return err("BAD_REQUEST", "Invalid JSON", 400); }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) return err("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input", 400);

  const { email, password } = parsed.data;

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user || !user.passwordHash) return err("INVALID_CREDENTIALS", "Invalid email or password", 401);

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return err("INVALID_CREDENTIALS", "Invalid email or password", 401);

  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, user.id)).limit(1);
  if (!profile) return err("NOT_FOUND", "Profile not found", 404);

  const accessToken = await signAccessToken({
    sub: user.id,
    email: user.email!,
    role: profile.role,
    approvalStatus: profile.approvalStatus,
    username: profile.username,
  });

  const { token: refreshToken, jti } = await signRefreshToken(user.id);
  await storeRefreshToken(user.id, refreshToken, jti, req.headers.get("user-agent") ?? undefined);

  return ok({
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      username: profile.username,
      fullName: profile.fullName,
      photoUrl: profile.photoUrl,
      role: profile.role,
      approvalStatus: profile.approvalStatus,
      ministry: profile.ministry,
    },
  });
}
