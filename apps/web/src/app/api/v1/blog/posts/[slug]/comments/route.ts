import { NextRequest } from "next/server";
import { and, eq, desc } from "drizzle-orm";
import { db, postComments, profiles } from "@franchise/db";
import { createCommentSchema } from "@franchise/validators";
import { ok, err, withApproved, withAuth } from "@/lib/api/middleware";
import { containsProfanity } from "@/lib/profanity";

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  return withAuth(req, async () => {
    const { slug } = await params;
    const rows = await db
      .select({
        id: postComments.id, content: postComments.content, parentId: postComments.parentId,
        createdAt: postComments.createdAt, authorId: postComments.userId,
        authorUsername: profiles.username, authorFullName: profiles.fullName, authorPhoto: profiles.photoUrl,
      })
      .from(postComments)
      .leftJoin(profiles, eq(postComments.userId, profiles.userId))
      .where(and(eq(postComments.postSlug, slug), eq(postComments.isHidden, false)))
      .orderBy(desc(postComments.createdAt))
      .limit(100);

    return ok(rows.map((r) => ({
      id: r.id, content: r.content, parentId: r.parentId, createdAt: r.createdAt.toISOString(),
      author: { userId: r.authorId, username: r.authorUsername, fullName: r.authorFullName, photoUrl: r.authorPhoto },
    })));
  });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  return withApproved(req, async (req, user) => {
    const { slug } = await params;
    let body: unknown;
    try { body = await req.json(); } catch { return err("BAD_REQUEST", "Invalid JSON", 400); }

    const parsed = createCommentSchema.safeParse(body);
    if (!parsed.success) return err("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input", 400);

    const { content, parentId } = parsed.data;
    if (containsProfanity(content)) return err("BAD_REQUEST", "Comment contains prohibited language", 400);

    const [comment] = await db.insert(postComments).values({ postSlug: slug, userId: user.sub, parentId: parentId ?? null, content }).returning();
    return ok(comment, 201);
  });
}
