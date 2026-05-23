import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db, socialPosts } from "@franchise/db";
import { updatePostSchema } from "@franchise/validators";
import { ok, err, withApproved, withAuth } from "@/lib/api/middleware";
import { containsProfanity } from "@/lib/profanity";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, async () => {
    const { id } = await params;
    const [post] = await db.select().from(socialPosts).where(eq(socialPosts.id, id)).limit(1);
    if (!post || post.isHidden) return err("NOT_FOUND", "Post not found", 404);
    return ok(post);
  });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withApproved(req, async (req, user) => {
    const { id } = await params;
    let body: unknown;
    try { body = await req.json(); } catch { return err("BAD_REQUEST", "Invalid JSON", 400); }

    const parsed = updatePostSchema.safeParse(body);
    if (!parsed.success) return err("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input", 400);

    const [post] = await db.select().from(socialPosts).where(eq(socialPosts.id, id)).limit(1);
    if (!post) return err("NOT_FOUND", "Post not found", 404);
    if (post.authorId !== user.sub) return err("FORBIDDEN", "Not your post", 403);
    if (containsProfanity(parsed.data.content)) return err("BAD_REQUEST", "Content contains prohibited language", 400);

    await db.update(socialPosts).set({ content: parsed.data.content, updatedAt: new Date() }).where(eq(socialPosts.id, id));
    return ok({ ok: true });
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withApproved(req, async (_, user) => {
    const { id } = await params;
    const [post] = await db.select().from(socialPosts).where(eq(socialPosts.id, id)).limit(1);
    if (!post) return err("NOT_FOUND", "Post not found", 404);
    if (post.authorId !== user.sub && user.role !== "admin" && user.role !== "pastor") {
      return err("FORBIDDEN", "Not authorized to delete this post", 403);
    }
    await db.delete(socialPosts).where(eq(socialPosts.id, id));
    return ok({ ok: true });
  });
}
