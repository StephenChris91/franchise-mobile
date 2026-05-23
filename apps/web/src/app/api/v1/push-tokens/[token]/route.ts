import { NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { db, pushTokens } from "@franchise/db";
import { ok, err, withAuth } from "@/lib/api/middleware";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  return withAuth(req, async (_, user) => {
    const { token } = await params;
    const deleted = await db.delete(pushTokens).where(and(eq(pushTokens.token, token), eq(pushTokens.userId, user.sub))).returning();
    if (!deleted.length) return err("NOT_FOUND", "Token not found", 404);
    return ok({ ok: true });
  });
}
