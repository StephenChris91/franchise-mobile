import { NextRequest } from "next/server";
import { and, eq, desc, sql } from "drizzle-orm";
import { db, socialPosts, socialPostComments, profiles, notifications } from "@franchise/db";
import { createCommentSchema } from "@franchise/validators";
import { ok, err, withApproved, withAuth } from "@/lib/api/middleware";
import { containsProfanity } from "@/lib/profanity";
import { pusherServer } from "@/lib/pusher";
import { sendPushToUser } from "@/lib/push/service";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, async () => {
    const { id } = await params;
    const rows = await db
      .select({
        id: socialPostComments.id,
        content: socialPostComments.content,
        parentId: socialPostComments.parentId,
        createdAt: socialPostComments.createdAt,
        updatedAt: socialPostComments.updatedAt,
        authorId: socialPostComments.authorId,
        authorUsername: profiles.username,
        authorFullName: profiles.fullName,
        authorPhoto: profiles.photoUrl,
      })
      .from(socialPostComments)
      .leftJoin(profiles, eq(socialPostComments.authorId, profiles.userId))
      .where(and(eq(socialPostComments.postId, id), eq(socialPostComments.isHidden, false)))
      .orderBy(desc(socialPostComments.createdAt))
      .limit(100);

    return ok(rows.map((r) => ({
      id: r.id,
      content: r.content,
      parentId: r.parentId,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      author: { userId: r.authorId, username: r.authorUsername, fullName: r.authorFullName, photoUrl: r.authorPhoto },
    })));
  });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withApproved(req, async (req, user) => {
    const { id } = await params;
    let body: unknown;
    try { body = await req.json(); } catch { return err("BAD_REQUEST", "Invalid JSON", 400); }

    const parsed = createCommentSchema.safeParse(body);
    if (!parsed.success) return err("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input", 400);

    const { content, parentId } = parsed.data;
    if (containsProfanity(content)) return err("BAD_REQUEST", "Comment contains prohibited language", 400);

    const [post] = await db.select().from(socialPosts).where(eq(socialPosts.id, id)).limit(1);
    if (!post) return err("NOT_FOUND", "Post not found", 404);

    const [comment] = await db.insert(socialPostComments).values({ postId: id, authorId: user.sub, parentId: parentId ?? null, content }).returning();
    await db.update(socialPosts).set({ commentCount: sql`${socialPosts.commentCount} + 1` }).where(eq(socialPosts.id, id));

    if (post.authorId !== user.sub) {
      await db.insert(notifications).values({ userId: post.authorId, actorId: user.sub, notificationType: "comment_on_post", entityType: "comment", entityId: comment!.id });
      pusherServer.trigger(`private-user-${post.authorId}`, "notification", {}).catch(() => {});
      sendPushToUser(
        post.authorId,
        {
          title: `${user.username} commented on your post`,
          body: content.length > 80 ? content.slice(0, 80) + "…" : content,
          data: { type: "comment", postId: id, commentId: comment!.id },
        },
        "comments"
      ).catch(() => {});
    }
    pusherServer.trigger(`post-${id}`, "new-comment", { commentId: comment!.id }).catch(() => {});

    return ok(comment, 201);
  });
}
