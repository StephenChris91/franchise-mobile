import { NextRequest } from "next/server";
import { rotateRefreshToken } from "@franchise/auth";
import { refreshTokenSchema } from "@franchise/validators";
import { ok, err } from "@/lib/api/middleware";

export async function POST(req: NextRequest) {
  let body: unknown;
  try { body = await req.json(); } catch { return err("BAD_REQUEST", "Invalid JSON", 400); }

  const parsed = refreshTokenSchema.safeParse(body);
  if (!parsed.success) return err("VALIDATION_ERROR", "refreshToken is required", 400);

  const result = await rotateRefreshToken(parsed.data.refreshToken, req.headers.get("user-agent") ?? undefined);
  if (!result) return err("UNAUTHORIZED", "Invalid or expired refresh token", 401);

  return ok({ accessToken: result.accessToken, refreshToken: result.refreshToken });
}
