import { NextRequest } from "next/server";
import { db, pushTokens } from "@franchise/db";
import { pushTokenSchema } from "@franchise/validators";
import { ok, err, withAuth } from "@/lib/api/middleware";

export async function POST(req: NextRequest) {
  return withAuth(req, async (req, user) => {
    let body: unknown;
    try { body = await req.json(); } catch { return err("BAD_REQUEST", "Invalid JSON", 400); }

    const parsed = pushTokenSchema.safeParse(body);
    if (!parsed.success) return err("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input", 400);

    await db
      .insert(pushTokens)
      .values({
        userId: user.sub,
        token: parsed.data.token,
        platform: parsed.data.platform,
        deviceName: parsed.data.deviceName ?? null,
        lastUsedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: pushTokens.token,
        set: { lastUsedAt: new Date(), deviceName: parsed.data.deviceName ?? null },
      });
    return ok({ ok: true }, 201);
  });
}
