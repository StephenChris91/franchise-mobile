import { NextRequest } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { db, socialPosts, socialPostReactions } from "@franchise/db";
import { ok, err, withApproved } from "@/lib/api/middleware";

const VALID_TYPES = ["like", "amen", "praying", "heart"] as const;

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; type: string }> }
) {
  return withApproved(req, async (_, user) => {
    const { id, type } = await params;
    if (!VALID_TYPES.includes(type as typeof VALID_TYPES[number])) {
      return err("BAD_REQUEST", "Invalid reaction type", 400);
    }

    const deleted = await db
      .delete(socialPostReactions)
      .where(and(eq(socialPostReactions.postId, id), eq(socialPostReactions.userId, user.sub), eq(socialPostReactions.reactionType, type as typeof VALID_TYPES[number])))
      .returning();

    if (deleted.length > 0) {
      await db.update(socialPosts).set({ reactionCount: sql`GREATEST(${socialPosts.reactionCount} - 1, 0)` }).where(eq(socialPosts.id, id));
    }

    return ok({ ok: true });
  });
}
