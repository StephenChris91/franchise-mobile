import { NextRequest } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { db, socialPosts, socialPostReactions, notifications } from "@franchise/db";
import { reactionSchema } from "@franchise/validators";
import { ok, err, withApproved } from "@/lib/api/middleware";
import { pusherServer } from "@/lib/pusher";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withApproved(req, async (req, user) => {
    const { id } = await params;
    let body: unknown;
    try { body = await req.json(); } catch { return err("BAD_REQUEST", "Invalid JSON", 400); }

    const parsed = reactionSchema.safeParse(body);
    if (!parsed.success) return err("VALIDATION_ERROR", "Invalid reaction type", 400);

    const { type: reactionType } = parsed.data;

    const [existing] = await db.select().from(socialPostReactions).where(and(eq(socialPostReactions.postId, id), eq(socialPostReactions.userId, user.sub), eq(socialPostReactions.reactionType, reactionType))).limit(1);

    if (existing) {
      await db.delete(socialPostReactions).where(and(eq(socialPostReactions.postId, id), eq(socialPostReactions.userId, user.sub), eq(socialPostReactions.reactionType, reactionType)));
      await db.update(socialPosts).set({ reactionCount: sql`${socialPosts.reactionCount} - 1` }).where(eq(socialPosts.id, id));
    } else {
      await db.insert(socialPostReactions).values({ postId: id, userId: user.sub, reactionType });
      await db.update(socialPosts).set({ reactionCount: sql`${socialPosts.reactionCount} + 1` }).where(eq(socialPosts.id, id));

      const [post] = await db.select({ authorId: socialPosts.authorId }).from(socialPosts).where(eq(socialPosts.id, id)).limit(1);
      if (post && post.authorId !== user.sub) {
        await db.insert(notifications).values({ userId: post.authorId, actorId: user.sub, notificationType: reactionType === "praying" ? "prayer_reaction" : "reaction_on_post", entityType: "post", entityId: id });
        pusherServer.trigger(`private-user-${post.authorId}`, "notification", {}).catch(() => {});
      }
    }

    pusherServer.trigger(`post-${id}`, "reaction-update", {}).catch(() => {});
    return ok({ ok: true, toggled: !existing });
  });
}
