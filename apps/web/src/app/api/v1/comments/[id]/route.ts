import { NextRequest } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db, socialPostComments, socialPosts } from "@franchise/db";
import { updateCommentSchema } from "@franchise/validators";
import { ok, err, withApproved } from "@/lib/api/middleware";
import { containsProfanity } from "@/lib/profanity";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withApproved(req, async (req, user) => {
    const { id } = await params;
    let body: unknown;
    try { body = await req.json(); } catch { return err("BAD_REQUEST", "Invalid JSON", 400); }

    const parsed = updateCommentSchema.safeParse(body);
    if (!parsed.success) return err("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input", 400);

    const [comment] = await db.select().from(socialPostComments).where(eq(socialPostComments.id, id)).limit(1);
    if (!comment) return err("NOT_FOUND", "Comment not found", 404);
    if (comment.authorId !== user.sub) return err("FORBIDDEN", "Not your comment", 403);
    if (containsProfanity(parsed.data.content)) return err("BAD_REQUEST", "Comment contains prohibited language", 400);

    await db.update(socialPostComments).set({ content: parsed.data.content, updatedAt: new Date() }).where(eq(socialPostComments.id, id));
    return ok({ ok: true });
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withApproved(req, async (_, user) => {
    const { id } = await params;
    const [comment] = await db.select().from(socialPostComments).where(eq(socialPostComments.id, id)).limit(1);
    if (!comment) return err("NOT_FOUND", "Comment not found", 404);
    if (comment.authorId !== user.sub && user.role !== "admin" && user.role !== "pastor") {
      return err("FORBIDDEN", "Not authorized", 403);
    }
    await db.delete(socialPostComments).where(eq(socialPostComments.id, id));
    await db.update(socialPosts).set({ commentCount: sql`GREATEST(${socialPosts.commentCount} - 1, 0)` }).where(eq(socialPosts.id, comment.postId));
    return ok({ ok: true });
  });
}
