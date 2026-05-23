import { NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { db, postReactions } from "@franchise/db";
import { reactionSchema } from "@franchise/validators";
import { ok, err, withApproved } from "@/lib/api/middleware";

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  return withApproved(req, async (req, user) => {
    const { slug } = await params;
    let body: unknown;
    try { body = await req.json(); } catch { return err("BAD_REQUEST", "Invalid JSON", 400); }

    const parsed = reactionSchema.safeParse(body);
    if (!parsed.success) return err("VALIDATION_ERROR", "Invalid reaction type", 400);

    const { type: reactionType } = parsed.data;
    const existing = await db.select().from(postReactions).where(and(eq(postReactions.postSlug, slug), eq(postReactions.userId, user.sub), eq(postReactions.reactionType, reactionType as "like" | "amen" | "praying"))).limit(1);

    if (existing.length > 0) {
      await db.delete(postReactions).where(and(eq(postReactions.postSlug, slug), eq(postReactions.userId, user.sub), eq(postReactions.reactionType, reactionType as "like" | "amen" | "praying")));
    } else {
      await db.insert(postReactions).values({ postSlug: slug, userId: user.sub, reactionType: reactionType as "like" | "amen" | "praying" });
    }

    return ok({ ok: true, toggled: existing.length === 0 });
  });
}
