import { NextRequest } from "next/server";
import { and, eq, lt, or, isNull, inArray, desc } from "drizzle-orm";
import { db, socialPosts, socialPostReactions, groups, groupMembers, profiles } from "@franchise/db";
import { createPostSchema, listPostsSchema } from "@franchise/validators";
import { ok, err, withApproved, encodeCursor, decodeCursor } from "@/lib/api/middleware";
import { containsProfanity } from "@/lib/profanity";
import { pusherServer } from "@/lib/pusher";

export async function GET(req: NextRequest) {
  return withApproved(req, async (req, user) => {
    const sp = Object.fromEntries(req.nextUrl.searchParams);
    const parsed = listPostsSchema.safeParse(sp);
    if (!parsed.success) return err("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid params", 400);

    const { groupId, cursor, limit, postType } = parsed.data;

    let memberGroupIds: string[] = [];
    if (!groupId) {
      const memberships = await db.select({ groupId: groupMembers.groupId }).from(groupMembers).where(eq(groupMembers.userId, user.sub));
      memberGroupIds = memberships.map((m) => m.groupId);
    }

    const cursorDecoded = cursor ? decodeCursor(cursor) : null;

    const conditions = [
      eq(socialPosts.isHidden, false),
      ...(cursorDecoded ? [lt(socialPosts.createdAt, cursorDecoded.createdAt)] : []),
      ...(postType ? [eq(socialPosts.postType, postType)] : []),
      ...(groupId
        ? [eq(socialPosts.groupId, groupId)]
        : [or(isNull(socialPosts.groupId), ...(memberGroupIds.length ? [inArray(socialPosts.groupId, memberGroupIds)] : []))]),
    ].filter(Boolean) as Parameters<typeof and>;

    const posts = await db
      .select()
      .from(socialPosts)
      .where(and(...conditions))
      .orderBy(desc(socialPosts.isPinned), desc(socialPosts.createdAt))
      .limit(limit + 1);

    const hasMore = posts.length > limit;
    const page = hasMore ? posts.slice(0, limit) : posts;

    const postIds = page.map((p) => p.id);
    const authorIds = [...new Set(page.map((p) => p.authorId))];
    const groupIds = [...new Set(page.map((p) => p.groupId).filter(Boolean) as string[])];

    const [reactions, authors, groupRows] = await Promise.all([
      postIds.length ? db.select().from(socialPostReactions).where(inArray(socialPostReactions.postId, postIds)) : [],
      authorIds.length ? db.select({ userId: profiles.userId, username: profiles.username, fullName: profiles.fullName, photoUrl: profiles.photoUrl }).from(profiles).where(inArray(profiles.userId, authorIds)) : [],
      groupIds.length ? db.select({ id: groups.id, name: groups.name, slug: groups.slug }).from(groups).where(inArray(groups.id, groupIds)) : [],
    ]);

    const reactionMap: Record<string, { like: number; amen: number; praying: number; heart: number }> = {};
    const userReactionMap: Record<string, string[]> = {};
    for (const r of reactions) {
      if (!reactionMap[r.postId]) reactionMap[r.postId] = { like: 0, amen: 0, praying: 0, heart: 0 };
      reactionMap[r.postId][r.reactionType as keyof typeof reactionMap[string]]++;
      if (r.userId === user.sub) {
        if (!userReactionMap[r.postId]) userReactionMap[r.postId] = [];
        userReactionMap[r.postId].push(r.reactionType);
      }
    }
    const authorMap = Object.fromEntries(authors.map((a) => [a.userId, a]));
    const groupMap = Object.fromEntries(groupRows.map((g) => [g.id, g]));

    const data = page.map((p) => ({
      id: p.id,
      content: p.content,
      postType: p.postType,
      mediaUrls: p.mediaUrls,
      isPinned: p.isPinned,
      reactionCount: p.reactionCount,
      commentCount: p.commentCount,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      author: authorMap[p.authorId] ? { userId: authorMap[p.authorId].userId, username: authorMap[p.authorId].username, fullName: authorMap[p.authorId].fullName, photoUrl: authorMap[p.authorId].photoUrl } : null,
      group: p.groupId && groupMap[p.groupId] ? groupMap[p.groupId] : null,
      reactionCounts: reactionMap[p.id] ?? { like: 0, amen: 0, praying: 0, heart: 0 },
      userReactions: userReactionMap[p.id] ?? [],
    }));

    const nextCursor = hasMore && page.length > 0
      ? encodeCursor(page[page.length - 1]!.id, page[page.length - 1]!.createdAt)
      : null;

    return ok({ data, nextCursor, hasMore });
  });
}

export async function POST(req: NextRequest) {
  return withApproved(req, async (req, user) => {
    let body: unknown;
    try { body = await req.json(); } catch { return err("BAD_REQUEST", "Invalid JSON", 400); }

    const parsed = createPostSchema.safeParse(body);
    if (!parsed.success) return err("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input", 400);

    const { content, postType, groupId, mediaUrls = [] } = parsed.data;

    if (containsProfanity(content)) return err("BAD_REQUEST", "Content contains prohibited language", 400);

    if (groupId) {
      const [membership] = await db.select().from(groupMembers).where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, user.sub))).limit(1);
      if (!membership) return err("FORBIDDEN", "You must be a member of this group to post", 403);
    }

    const [post] = await db.insert(socialPosts).values({ authorId: user.sub, groupId: groupId ?? null, content, postType, mediaUrls }).returning();

    const channel = groupId ? `feed-${groupId}` : "feed-main";
    pusherServer.trigger(channel, "new-post", { postId: post!.id }).catch(() => {});

    return ok(post, 201);
  });
}
