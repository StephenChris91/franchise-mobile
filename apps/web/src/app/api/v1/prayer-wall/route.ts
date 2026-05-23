import { NextRequest } from "next/server";
import { and, eq, lt, desc } from "drizzle-orm";
import { db, socialPosts, profiles } from "@franchise/db";
import { ok, err, withAuth, encodeCursor, decodeCursor } from "@/lib/api/middleware";

export async function GET(req: NextRequest) {
  return withAuth(req, async (req) => {
    const sp = req.nextUrl.searchParams;
    const cursor = sp.get("cursor") ?? undefined;
    const limit = Math.min(Number(sp.get("limit") ?? 20), 50);

    const cursorDecoded = cursor ? decodeCursor(cursor) : null;

    const posts = await db
      .select({
        id: socialPosts.id,
        content: socialPosts.content,
        mediaUrls: socialPosts.mediaUrls,
        reactionCount: socialPosts.reactionCount,
        commentCount: socialPosts.commentCount,
        createdAt: socialPosts.createdAt,
        authorId: socialPosts.authorId,
        authorUsername: profiles.username,
        authorFullName: profiles.fullName,
        authorPhoto: profiles.photoUrl,
      })
      .from(socialPosts)
      .leftJoin(profiles, eq(socialPosts.authorId, profiles.userId))
      .where(
        and(
          eq(socialPosts.postType, "prayer"),
          eq(socialPosts.isHidden, false),
          ...(cursorDecoded ? [lt(socialPosts.createdAt, cursorDecoded.createdAt)] : [])
        )
      )
      .orderBy(desc(socialPosts.createdAt))
      .limit(limit + 1);

    const hasMore = posts.length > limit;
    const page = hasMore ? posts.slice(0, limit) : posts;

    const nextCursor = hasMore && page.length > 0
      ? encodeCursor(page[page.length - 1]!.id, page[page.length - 1]!.createdAt)
      : null;

    return ok({
      data: page.map((p) => ({
        id: p.id,
        content: p.content,
        mediaUrls: p.mediaUrls,
        reactionCount: p.reactionCount,
        commentCount: p.commentCount,
        createdAt: p.createdAt.toISOString(),
        author: { userId: p.authorId, username: p.authorUsername, fullName: p.authorFullName, photoUrl: p.authorPhoto },
      })),
      nextCursor,
      hasMore,
    });
  });
}
