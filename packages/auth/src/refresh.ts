import { eq, and } from "drizzle-orm";
import { db, refreshTokens, users, profiles } from "@franchise/db";
import { signAccessToken, signRefreshToken, verifyRefreshToken, hashToken } from "./tokens";
import type { AccessTokenPayload } from "./tokens";

export async function storeRefreshToken(
  userId: string,
  token: string,
  jti: string,
  deviceInfo?: string
): Promise<void> {
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await db.insert(refreshTokens).values({
    userId,
    tokenHash,
    deviceInfo: deviceInfo ?? null,
    expiresAt,
  });
}

export async function rotateRefreshToken(
  oldToken: string,
  deviceInfo?: string
): Promise<{ accessToken: string; refreshToken: string } | null> {
  const payload = await verifyRefreshToken(oldToken);
  if (!payload) return null;

  const oldHash = hashToken(oldToken);
  const [record] = await db
    .select()
    .from(refreshTokens)
    .where(and(eq(refreshTokens.tokenHash, oldHash), eq(refreshTokens.revoked, false)))
    .limit(1);

  if (!record || record.expiresAt < new Date()) return null;

  // Revoke the old token
  await db
    .update(refreshTokens)
    .set({ revoked: true })
    .where(eq(refreshTokens.id, record.id));

  // Fetch user + profile for the new access token payload
  const [user] = await db.select().from(users).where(eq(users.id, payload.sub)).limit(1);
  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, payload.sub)).limit(1);
  if (!user || !profile) return null;

  const accessPayload: AccessTokenPayload = {
    sub: user.id,
    email: user.email!,
    role: profile.role,
    approvalStatus: profile.approvalStatus,
    username: profile.username,
  };

  const accessToken = await signAccessToken(accessPayload);
  const { token: newRefresh, jti: newJti } = await signRefreshToken(user.id);
  await storeRefreshToken(user.id, newRefresh, newJti, deviceInfo);

  return { accessToken, refreshToken: newRefresh };
}

export async function revokeRefreshToken(token: string): Promise<void> {
  const hash = hashToken(token);
  await db
    .update(refreshTokens)
    .set({ revoked: true })
    .where(eq(refreshTokens.tokenHash, hash));
}
