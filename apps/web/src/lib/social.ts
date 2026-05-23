import { and, desc, eq, lt, inArray, isNull, or, count } from "drizzle-orm";
import {
  db,
  socialPosts,
  socialPostReactions,
  groups,
  groupMembers,
  profiles,
  users,
  notifications,
} from "../../db";
import type { SocialPost, Group } from "../../db/schema";

export interface PostWithMeta {
  post: SocialPost;
  author: { name: string; username: string; photoUrl?: string | null };
  group?: Pick<Group, "id" | "name" | "slug"> | null;
  reactionCounts: { like: number; amen: number; praying: number; heart: number };
  userReactions: string[];
}

const PAGE_SIZE = 20;

async function buildReactionData(postIds: string[], userId?: string) {
  if (postIds.length === 0) return { counts: {}, userReactions: {} };

  const allReactions = await db
    .select()
    .from(socialPostReactions)
    .where(inArray(socialPostReactions.postId, postIds));

  const counts: Record<string, { like: number; amen: number; praying: number; heart: number }> = {};
  const userReactions: Record<string, string[]> = {};

  for (const r of allReactions) {
    if (!counts[r.postId]) counts[r.postId] = { like: 0, amen: 0, praying: 0, heart: 0 };
    counts[r.postId][r.reactionType as keyof typeof counts[string]]++;
    if (userId && r.userId === userId) {
      if (!userReactions[r.postId]) userReactions[r.postId] = [];
      userReactions[r.postId].push(r.reactionType);
    }
  }

  return { counts, userReactions };
}

async function hydratePost(
  post: SocialPost,
  counts: Record<string, { like: number; amen: number; praying: number; heart: number }>,
  userReactions: Record<string, string[]>,
  groupMap: Record<string, Pick<Group, "id" | "name" | "slug">>,
  authorMap: Record<string, { name: string; username: string; photoUrl?: string | null }>
): Promise<PostWithMeta> {
  return {
    post,
    author: authorMap[post.authorId] ?? { name: "Member", username: "member" },
    group: post.groupId ? groupMap[post.groupId] ?? null : null,
    reactionCounts: counts[post.id] ?? { like: 0, amen: 0, praying: 0, heart: 0 },
    userReactions: userReactions[post.id] ?? [],
  };
}

async function fetchAuthors(authorIds: string[]) {
  if (!authorIds.length) return {};
  const rows = await db
    .select({
      userId: profiles.userId,
      fullName: profiles.fullName,
      username: profiles.username,
      photoUrl: profiles.photoUrl,
    })
    .from(profiles)
    .where(inArray(profiles.userId, authorIds));
  return Object.fromEntries(rows.map((r) => [r.userId, { name: r.fullName, username: r.username, photoUrl: r.photoUrl }]));
}

async function fetchGroupMap(groupIds: string[]) {
  if (!groupIds.length) return {};
  const rows = await db.select({ id: groups.id, name: groups.name, slug: groups.slug }).from(groups).where(inArray(groups.id, groupIds));
  return Object.fromEntries(rows.map((r) => [r.id, r]));
}

// ─── Main feed (posts from groups user is in + main feed) ─────────────────────

export async function getMainFeed(userId?: string, cursor?: string, postType?: string): Promise<PostWithMeta[]> {
  let memberGroupIds: string[] = [];
  if (userId) {
    const memberships = await db.select({ groupId: groupMembers.groupId }).from(groupMembers).where(eq(groupMembers.userId, userId));
    memberGroupIds = memberships.map((m) => m.groupId);
  }

  const conditions = [
    eq(socialPosts.isHidden, false),
    ...(cursor ? [lt(socialPosts.createdAt, new Date(cursor))] : []),
    ...(postType ? [eq(socialPosts.postType, postType as "regular" | "prayer" | "announcement" | "testimony")] : []),
    or(isNull(socialPosts.groupId), ...(memberGroupIds.length ? [inArray(socialPosts.groupId, memberGroupIds)] : [])),
  ].filter(Boolean);

  const posts = await db
    .select()
    .from(socialPosts)
    .where(and(...conditions as Parameters<typeof and>))
    .orderBy(desc(socialPosts.isPinned), desc(socialPosts.createdAt))
    .limit(PAGE_SIZE);

  if (!posts.length) return [];

  const postIds = posts.map((p) => p.id);
  const authorIds = [...new Set(posts.map((p) => p.authorId))];
  const groupIds = [...new Set(posts.map((p) => p.groupId).filter(Boolean) as string[])];

  const [{ counts, userReactions }, authorMap, groupMap] = await Promise.all([
    buildReactionData(postIds, userId),
    fetchAuthors(authorIds),
    fetchGroupMap(groupIds),
  ]);

  return Promise.all(posts.map((p) => hydratePost(p, counts, userReactions, groupMap, authorMap)));
}

// ─── Group feed ───────────────────────────────────────────────────────────────

export async function getGroupFeed(groupId: string, userId?: string, cursor?: string): Promise<PostWithMeta[]> {
  const conditions = [
    eq(socialPosts.groupId, groupId),
    eq(socialPosts.isHidden, false),
    ...(cursor ? [lt(socialPosts.createdAt, new Date(cursor))] : []),
  ];

  const posts = await db
    .select()
    .from(socialPosts)
    .where(and(...conditions))
    .orderBy(desc(socialPosts.isPinned), desc(socialPosts.createdAt))
    .limit(PAGE_SIZE);

  if (!posts.length) return [];

  const postIds = posts.map((p) => p.id);
  const authorIds = [...new Set(posts.map((p) => p.authorId))];

  const [{ counts, userReactions }, authorMap] = await Promise.all([
    buildReactionData(postIds, userId),
    fetchAuthors(authorIds),
  ]);

  const groupRow = await db.select({ id: groups.id, name: groups.name, slug: groups.slug }).from(groups).where(eq(groups.id, groupId)).limit(1).then((r) => r[0]);
  const groupMap = groupRow ? { [groupId]: groupRow } : {};

  return Promise.all(posts.map((p) => hydratePost(p, counts, userReactions, groupMap, authorMap)));
}

// ─── User groups ──────────────────────────────────────────────────────────────

export async function getUserGroups(userId: string) {
  const memberships = await db
    .select({ groupId: groupMembers.groupId })
    .from(groupMembers)
    .where(eq(groupMembers.userId, userId));

  if (!memberships.length) return [];

  return db
    .select()
    .from(groups)
    .where(inArray(groups.id, memberships.map((m) => m.groupId)));
}

export async function getAllGroups() {
  return db.select().from(groups).orderBy(groups.name);
}

export async function getGroupBySlug(slug: string) {
  return db.select().from(groups).where(eq(groups.slug, slug)).limit(1).then((r) => r[0] ?? null);
}

export async function isGroupMember(groupId: string, userId: string) {
  const row = await db
    .select()
    .from(groupMembers)
    .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)))
    .limit(1);
  return row.length > 0;
}

export async function getGroupMembers(groupId: string) {
  const members = await db
    .select({ userId: groupMembers.userId, role: groupMembers.role, joinedAt: groupMembers.joinedAt })
    .from(groupMembers)
    .where(eq(groupMembers.groupId, groupId));

  if (!members.length) return [];

  const userIds = members.map((m) => m.userId);
  const authorMap = await fetchAuthors(userIds);

  return members.map((m) => ({
    ...m,
    profile: authorMap[m.userId] ?? { name: "Member", username: "member", photoUrl: null },
  }));
}

// ─── Notifications ────────────────────────────────────────────────────────────

export async function getUserNotifications(userId: string) {
  const rows = await db
    .select({
      id: notifications.id,
      notificationType: notifications.notificationType,
      entityType: notifications.entityType,
      entityId: notifications.entityId,
      isRead: notifications.isRead,
      createdAt: notifications.createdAt,
      actorId: notifications.actorId,
    })
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(50);

  const actorIds = [...new Set(rows.map((r) => r.actorId).filter(Boolean) as string[])];
  const actorMap = await fetchAuthors(actorIds);

  return rows.map((r) => ({
    ...r,
    actorName: r.actorId ? actorMap[r.actorId]?.name : undefined,
  }));
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const [{ value }] = await db
    .select({ value: count() })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  return value;
}

// ─── Members directory ────────────────────────────────────────────────────────

export async function getMembers(search?: string) {
  const rows = await db
    .select({
      userId: profiles.userId,
      username: profiles.username,
      fullName: profiles.fullName,
      photoUrl: profiles.photoUrl,
      ministry: profiles.ministry,
      bio: profiles.bio,
    })
    .from(profiles)
    .where(eq(profiles.approvalStatus, "approved"))
    .orderBy(profiles.fullName)
    .limit(100);

  if (!search) return rows;
  const q = search.toLowerCase();
  return rows.filter((r) => r.fullName.toLowerCase().includes(q) || r.username.toLowerCase().includes(q));
}
