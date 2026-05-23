"use server";

import { and, eq, gte, count, sql, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "../../../auth";
import {
  db,
  socialPosts,
  socialPostReactions,
  socialPostComments,
  groups,
  groupMembers,
  contentReports,
  notifications,
  profiles,
} from "../../../db";
import { pusherServer } from "@/lib/pusher";
import { containsProfanity } from "@/lib/profanity";

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function requireApproved() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  if (session.user.approvalStatus !== "approved")
    throw new Error("Account pending approval");
  return session.user;
}

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  const role = session.user.role;
  if (role !== "admin" && role !== "pastor") throw new Error("Unauthorized");
  return session.user;
}

async function checkRateLimit(userId: string, table: "posts" | "comments") {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  if (table === "posts") {
    const [{ value }] = await db
      .select({ value: count() })
      .from(socialPosts)
      .where(and(eq(socialPosts.authorId, userId), gte(socialPosts.createdAt, oneHourAgo)));
    if (value >= 10) throw new Error("Rate limit: max 10 posts per hour");
  } else {
    const [{ value }] = await db
      .select({ value: count() })
      .from(socialPostComments)
      .where(and(eq(socialPostComments.authorId, userId), gte(socialPostComments.createdAt, oneHourAgo)));
    if (value >= 30) throw new Error("Rate limit: max 30 comments per hour");
  }
}

// ─── Posts ────────────────────────────────────────────────────────────────────

export async function createPost(formData: {
  content: string;
  postType: "regular" | "prayer" | "announcement" | "testimony";
  groupId?: string | null;
  mediaUrls?: string[];
}) {
  const user = await requireApproved();
  await checkRateLimit(user.id!, "posts");

  const { content, postType, groupId, mediaUrls = [] } = formData;

  if (!content.trim()) throw new Error("Content is required");
  if (content.length > 12000) throw new Error("Content too long");
  if (containsProfanity(content)) throw new Error("Content contains prohibited language");
  if (mediaUrls.length > 4) throw new Error("Max 4 images per post");

  // If posting to a group, verify membership
  if (groupId) {
    const membership = await db
      .select()
      .from(groupMembers)
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, user.id!)))
      .limit(1);
    if (!membership.length) throw new Error("You must be a member of this group to post");
  }

  const [post] = await db
    .insert(socialPosts)
    .values({
      authorId: user.id!,
      groupId: groupId ?? null,
      content,
      postType,
      mediaUrls,
    })
    .returning();

  // Trigger real-time event
  const channel = groupId ? `feed-${groupId}` : "feed-main";
  await pusherServer.trigger(channel, "new-post", { postId: post.id }).catch(() => {});

  revalidatePath("/social");
  if (groupId) revalidatePath(`/social/groups/${groupId}`);
  return { ok: true, post };
}

export async function editPost(postId: string, content: string) {
  const user = await requireApproved();
  if (!content.trim()) throw new Error("Content is required");
  if (containsProfanity(content)) throw new Error("Content contains prohibited language");

  const [post] = await db.select().from(socialPosts).where(eq(socialPosts.id, postId)).limit(1);
  if (!post) throw new Error("Post not found");
  if (post.authorId !== user.id) throw new Error("Not your post");

  await db.update(socialPosts).set({ content, updatedAt: new Date() }).where(eq(socialPosts.id, postId));
  revalidatePath("/social");
  return { ok: true };
}

export async function deletePost(postId: string) {
  const user = await requireApproved();

  const [post] = await db.select().from(socialPosts).where(eq(socialPosts.id, postId)).limit(1);
  if (!post) throw new Error("Post not found");

  const session = await auth();
  const role = session?.user?.role;
  if (post.authorId !== user.id && role !== "admin" && role !== "pastor") {
    throw new Error("Not authorized to delete this post");
  }

  await db.delete(socialPosts).where(eq(socialPosts.id, postId));
  revalidatePath("/social");
  return { ok: true };
}

export async function pinPost(postId: string) {
  await requireAdmin();
  await db.update(socialPosts).set({ isPinned: true }).where(eq(socialPosts.id, postId));
  revalidatePath("/social");
  return { ok: true };
}

export async function hidePost(postId: string) {
  await requireAdmin();
  await db.update(socialPosts).set({ isHidden: true }).where(eq(socialPosts.id, postId));
  revalidatePath("/social");
  return { ok: true };
}

// ─── Reactions ────────────────────────────────────────────────────────────────

export async function toggleReaction(
  postId: string,
  reactionType: "like" | "amen" | "praying" | "heart"
) {
  const user = await requireApproved();

  const existing = await db
    .select()
    .from(socialPostReactions)
    .where(
      and(
        eq(socialPostReactions.postId, postId),
        eq(socialPostReactions.userId, user.id!),
        eq(socialPostReactions.reactionType, reactionType)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    await db
      .delete(socialPostReactions)
      .where(
        and(
          eq(socialPostReactions.postId, postId),
          eq(socialPostReactions.userId, user.id!),
          eq(socialPostReactions.reactionType, reactionType)
        )
      );
    await db
      .update(socialPosts)
      .set({ reactionCount: sql`${socialPosts.reactionCount} - 1` })
      .where(eq(socialPosts.id, postId));
  } else {
    await db.insert(socialPostReactions).values({
      postId,
      userId: user.id!,
      reactionType,
    });
    await db
      .update(socialPosts)
      .set({ reactionCount: sql`${socialPosts.reactionCount} + 1` })
      .where(eq(socialPosts.id, postId));

    // Notify post author (skip self-reaction)
    const [post] = await db.select({ authorId: socialPosts.authorId }).from(socialPosts).where(eq(socialPosts.id, postId)).limit(1);
    if (post && post.authorId !== user.id) {
      await db.insert(notifications).values({
        userId: post.authorId,
        actorId: user.id!,
        notificationType: reactionType === "praying" ? "prayer_reaction" : "reaction_on_post",
        entityType: "post",
        entityId: postId,
      });
      await pusherServer.trigger(`private-user-${post.authorId}`, "notification", {}).catch(() => {});
    }
  }

  await pusherServer.trigger(`post-${postId}`, "reaction-update", {}).catch(() => {});
  revalidatePath("/social");
  return { ok: true };
}

// ─── Comments ─────────────────────────────────────────────────────────────────

export async function fetchComments(postId: string) {
  const rows = await db
    .select({
      id: socialPostComments.id,
      content: socialPostComments.content,
      authorId: socialPostComments.authorId,
      parentId: socialPostComments.parentId,
      createdAt: socialPostComments.createdAt,
      authorName: profiles.fullName,
      authorUsername: profiles.username,
      authorPhoto: profiles.photoUrl,
    })
    .from(socialPostComments)
    .leftJoin(profiles, eq(socialPostComments.authorId, profiles.userId))
    .where(
      and(
        eq(socialPostComments.postId, postId),
        eq(socialPostComments.isHidden, false)
      )
    )
    .orderBy(desc(socialPostComments.createdAt))
    .limit(100);

  return rows;
}

export async function appendToThread(postId: string, text: string) {
  const user = await requireApproved();

  const trimmed = text.trim();
  if (!trimmed) throw new Error("Text is required");
  if (trimmed.length > 500) throw new Error("Too long");
  if (containsProfanity(trimmed)) throw new Error("Content contains prohibited language");

  const [post] = await db.select().from(socialPosts).where(eq(socialPosts.id, postId)).limit(1);
  if (!post) throw new Error("Post not found");
  if (post.authorId !== user.id) throw new Error("Not your post");

  let parsed: { type: string; segments?: unknown[] };
  try {
    parsed = JSON.parse(post.content) as typeof parsed;
  } catch {
    parsed = { type: "thread", segments: [{ type: "plain", text: post.content }] };
  }

  let newContent: string;
  if (parsed.type === "thread" && Array.isArray(parsed.segments)) {
    newContent = JSON.stringify({ ...parsed, segments: [...parsed.segments, { type: "plain", text: trimmed }] });
  } else {
    newContent = JSON.stringify({ type: "thread", segments: [parsed, { type: "plain", text: trimmed }] });
  }

  await db.update(socialPosts).set({ content: newContent, updatedAt: new Date() }).where(eq(socialPosts.id, postId));
  revalidatePath("/social");
  return { ok: true, content: newContent };
}

export async function createComment(postId: string, content: string, parentId?: string) {
  const user = await requireApproved();
  await checkRateLimit(user.id!, "comments");

  const trimmed = content.trim();
  if (!trimmed || trimmed.length > 1000) throw new Error("Comment must be 1–1000 characters");
  if (containsProfanity(trimmed)) throw new Error("Comment contains prohibited language");

  const [comment] = await db
    .insert(socialPostComments)
    .values({
      postId,
      authorId: user.id!,
      parentId: parentId ?? null,
      content: trimmed,
    })
    .returning();

  await db
    .update(socialPosts)
    .set({ commentCount: sql`${socialPosts.commentCount} + 1` })
    .where(eq(socialPosts.id, postId));

  // Notify post author
  const [post] = await db.select({ authorId: socialPosts.authorId }).from(socialPosts).where(eq(socialPosts.id, postId)).limit(1);
  if (post && post.authorId !== user.id) {
    await db.insert(notifications).values({
      userId: post.authorId,
      actorId: user.id!,
      notificationType: "comment_on_post",
      entityType: "comment",
      entityId: comment.id,
    });
    await pusherServer.trigger(`private-user-${post.authorId}`, "notification", {}).catch(() => {});
  }

  await pusherServer.trigger(`post-${postId}`, "new-comment", { commentId: comment.id }).catch(() => {});
  revalidatePath("/social");
  return { ok: true, commentId: comment.id };
}

export async function deleteComment(commentId: string) {
  const user = await requireApproved();

  const [comment] = await db.select().from(socialPostComments).where(eq(socialPostComments.id, commentId)).limit(1);
  if (!comment) throw new Error("Comment not found");

  const session = await auth();
  const role = session?.user?.role;
  if (comment.authorId !== user.id && role !== "admin" && role !== "pastor") {
    throw new Error("Not authorized");
  }

  await db.delete(socialPostComments).where(eq(socialPostComments.id, commentId));
  await db
    .update(socialPosts)
    .set({ commentCount: sql`GREATEST(${socialPosts.commentCount} - 1, 0)` })
    .where(eq(socialPosts.id, comment.postId));

  revalidatePath("/social");
  return { ok: true };
}

// ─── Groups ───────────────────────────────────────────────────────────────────

export async function joinGroup(groupSlug: string) {
  const user = await requireApproved();

  const [group] = await db.select().from(groups).where(eq(groups.slug, groupSlug)).limit(1);
  if (!group) throw new Error("Group not found");

  await db
    .insert(groupMembers)
    .values({ groupId: group.id, userId: user.id! })
    .onConflictDoNothing();

  await db
    .update(groups)
    .set({ memberCount: sql`${groups.memberCount} + 1` })
    .where(eq(groups.id, group.id));

  // Notify group in real-time
  await pusherServer.trigger(`feed-${group.id}`, "member-joined", { userId: user.id }).catch(() => {});

  revalidatePath("/social/groups");
  revalidatePath(`/social/groups/${groupSlug}`);
  return { ok: true };
}

export async function leaveGroup(groupSlug: string) {
  const user = await requireApproved();

  const [group] = await db.select().from(groups).where(eq(groups.slug, groupSlug)).limit(1);
  if (!group) throw new Error("Group not found");

  const deleted = await db
    .delete(groupMembers)
    .where(and(eq(groupMembers.groupId, group.id), eq(groupMembers.userId, user.id!)))
    .returning();

  if (deleted.length > 0) {
    await db
      .update(groups)
      .set({ memberCount: sql`GREATEST(${groups.memberCount} - 1, 0)` })
      .where(eq(groups.id, group.id));
  }

  revalidatePath("/social/groups");
  revalidatePath(`/social/groups/${groupSlug}`);
  return { ok: true };
}

// ─── Reports ──────────────────────────────────────────────────────────────────

export async function reportContent(data: {
  postId?: string;
  commentId?: string;
  reason: "spam" | "inappropriate" | "harassment" | "misinformation" | "other";
  notes?: string;
}) {
  const user = await requireApproved();

  await db.insert(contentReports).values({
    reporterId: user.id!,
    reportedPostId: data.postId ?? null,
    reportedCommentId: data.commentId ?? null,
    reason: data.reason,
    notes: data.notes ?? "",
  });

  return { ok: true };
}

// ─── Notifications ────────────────────────────────────────────────────────────

export async function markNotificationsRead() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  await db
    .update(notifications)
    .set({ isRead: true })
    .where(eq(notifications.userId, session.user.id));

  return { ok: true };
}
