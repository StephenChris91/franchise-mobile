import { NextRequest } from "next/server";
import { revokeRefreshToken } from "@franchise/auth";
import { refreshTokenSchema } from "@franchise/validators";
import { ok, err, withAuth } from "@/lib/api/middleware";

export async function POST(req: NextRequest) {
  return withAuth(req, async () => {
    let body: unknown;
    try { body = await req.json(); } catch { return err("BAD_REQUEST", "Invalid JSON", 400); }

    const parsed = refreshTokenSchema.safeParse(body);
    if (!parsed.success) return err("VALIDATION_ERROR", "refreshToken is required", 400);

    await revokeRefreshToken(parsed.data.refreshToken);
    return ok({ message: "Logged out successfully" });
  });
}
