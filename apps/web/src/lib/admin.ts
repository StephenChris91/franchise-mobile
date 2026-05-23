import { and, eq, gte, lte, count, desc, sql, ne } from "drizzle-orm";
import {
  db,
  users,
  profiles,
  socialPosts,
  contentReports,
  adminActions,
  groups,
  groupMembers,
} from "../../db";

// ─── Stats ────────────────────────────────────────────────────────────────────

export async function getAdminStats() {
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

  const [
    [{ pendingApprovals }],
    [{ pendingReports }],
    [{ newMembersThisWeek }],
    [{ newMembersLastWeek }],
    [{ postsThisWeek }],
    [{ postsLastWeek }],
    [{ totalMembers }],
  ] = await Promise.all([
    db.select({ pendingApprovals: count() }).from(profiles).where(eq(profiles.approvalStatus, "pending")),
    db.select({ pendingReports: count() }).from(contentReports).where(eq(contentReports.status, "pending")),
    db.select({ newMembersThisWeek: count() }).from(profiles).where(and(eq(profiles.approvalStatus, "approved"), gte(profiles.createdAt, oneWeekAgo))),
    db.select({ newMembersLastWeek: count() }).from(profiles).where(and(eq(profiles.approvalStatus, "approved"), gte(profiles.createdAt, twoWeeksAgo), lte(profiles.createdAt, oneWeekAgo))),
    db.select({ postsThisWeek: count() }).from(socialPosts).where(gte(socialPosts.createdAt, oneWeekAgo)),
    db.select({ postsLastWeek: count() }).from(socialPosts).where(and(gte(socialPosts.createdAt, twoWeeksAgo), lte(socialPosts.createdAt, oneWeekAgo))),
    db.select({ totalMembers: count() }).from(profiles).where(eq(profiles.approvalStatus, "approved")),
  ]);

  return {
    pendingApprovals,
    pendingReports,
    newMembersThisWeek,
    newMembersLastWeek,
    newMembersDelta: newMembersThisWeek - newMembersLastWeek,
    postsThisWeek,
    postsLastWeek,
    postsDelta: postsThisWeek - postsLastWeek,
    totalMembers,
  };
}

// ─── Members ──────────────────────────────────────────────────────────────────

export async function getMembersForAdmin(opts?: {
  status?: "pending" | "approved" | "rejected" | "suspended" | "all";
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const { status = "all", search, limit = 50, offset = 0 } = opts ?? {};

  const conditions = [];
  if (status !== "all") {
    conditions.push(eq(profiles.approvalStatus, status));
  }

  const rows = await db
    .select({
      userId: profiles.userId,
      username: profiles.username,
      fullName: profiles.fullName,
      photoUrl: profiles.photoUrl,
      email: users.email,
      ministry: profiles.ministry,
      role: profiles.role,
      approvalStatus: profiles.approvalStatus,
      rejectionReason: profiles.rejectionReason,
      approvedAt: profiles.approvedAt,
      createdAt: profiles.createdAt,
    })
    .from(profiles)
    .innerJoin(users, eq(profiles.userId, users.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(profiles.createdAt))
    .limit(limit)
    .offset(offset);

  if (search) {
    const q = search.toLowerCase();
    return rows.filter(
      (r) =>
        r.fullName.toLowerCase().includes(q) ||
        r.username.toLowerCase().includes(q) ||
        (r.email ?? "").toLowerCase().includes(q)
    );
  }

  return rows;
}

export async function getMemberDetail(userId: string) {
  const [profile] = await db
    .select({
      userId: profiles.userId,
      username: profiles.username,
      fullName: profiles.fullName,
      photoUrl: profiles.photoUrl,
      bio: profiles.bio,
      email: users.email,
      ministry: profiles.ministry,
      phone: profiles.phone,
      whatsappNumber: profiles.whatsappNumber,
      role: profiles.role,
      approvalStatus: profiles.approvalStatus,
      rejectionReason: profiles.rejectionReason,
      approvedAt: profiles.approvedAt,
      createdAt: profiles.createdAt,
    })
    .from(profiles)
    .innerJoin(users, eq(profiles.userId, users.id))
    .where(eq(profiles.userId, userId))
    .limit(1);

  return profile ?? null;
}

// ─── Reports ──────────────────────────────────────────────────────────────────

export async function getPendingReports() {
  const rows = await db
    .select({
      id: contentReports.id,
      reason: contentReports.reason,
      notes: contentReports.notes,
      status: contentReports.status,
      createdAt: contentReports.createdAt,
      reportedPostId: contentReports.reportedPostId,
      reportedCommentId: contentReports.reportedCommentId,
      reporterUsername: profiles.username,
      reporterName: profiles.fullName,
    })
    .from(contentReports)
    .innerJoin(profiles, eq(contentReports.reporterId, profiles.userId))
    .where(eq(contentReports.status, "pending"))
    .orderBy(desc(contentReports.createdAt))
    .limit(100);

  // Fetch post content for each report
  const withContent = await Promise.all(
    rows.map(async (r) => {
      if (r.reportedPostId) {
        const [post] = await db
          .select({ content: socialPosts.content, authorId: socialPosts.authorId })
          .from(socialPosts)
          .where(eq(socialPosts.id, r.reportedPostId))
          .limit(1);
        return { ...r, postContent: post?.content ?? null };
      }
      return { ...r, postContent: null };
    })
  );

  return withContent;
}

// ─── Groups ───────────────────────────────────────────────────────────────────

export async function getGroupsForAdmin() {
  const rows = await db
    .select({
      id: groups.id,
      slug: groups.slug,
      name: groups.name,
      description: groups.description,
      groupType: groups.groupType,
      visibility: groups.visibility,
      memberCount: groups.memberCount,
      createdAt: groups.createdAt,
    })
    .from(groups)
    .orderBy(desc(groups.memberCount));

  return rows;
}

// ─── Audit log ────────────────────────────────────────────────────────────────

export async function getAuditLog(limit = 100) {
  const rows = await db
    .select({
      id: adminActions.id,
      actionType: adminActions.actionType,
      targetType: adminActions.targetType,
      targetId: adminActions.targetId,
      metadata: adminActions.metadata,
      createdAt: adminActions.createdAt,
      adminName: profiles.fullName,
      adminUsername: profiles.username,
    })
    .from(adminActions)
    .innerJoin(profiles, eq(adminActions.adminId, profiles.userId))
    .orderBy(desc(adminActions.createdAt))
    .limit(limit);

  return rows;
}

// ─── Recent activity ──────────────────────────────────────────────────────────

export async function getRecentActivity() {
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

  const [recentMembers, recentPosts, recentReports] = await Promise.all([
    db
      .select({ fullName: profiles.fullName, username: profiles.username, createdAt: profiles.createdAt, approvalStatus: profiles.approvalStatus })
      .from(profiles)
      .where(gte(profiles.createdAt, threeDaysAgo))
      .orderBy(desc(profiles.createdAt))
      .limit(5),
    db
      .select({ id: socialPosts.id, createdAt: socialPosts.createdAt, postType: socialPosts.postType, authorName: profiles.fullName })
      .from(socialPosts)
      .innerJoin(profiles, eq(socialPosts.authorId, profiles.userId))
      .where(gte(socialPosts.createdAt, threeDaysAgo))
      .orderBy(desc(socialPosts.createdAt))
      .limit(5),
    db
      .select({ id: contentReports.id, reason: contentReports.reason, createdAt: contentReports.createdAt, reporterName: profiles.fullName })
      .from(contentReports)
      .innerJoin(profiles, eq(contentReports.reporterId, profiles.userId))
      .where(gte(contentReports.createdAt, threeDaysAgo))
      .orderBy(desc(contentReports.createdAt))
      .limit(5),
  ]);

  return { recentMembers, recentPosts, recentReports };
}

// ─── Chart data ───────────────────────────────────────────────────────────────

export async function getMemberChartData() {
  // Last 30 days, new members per day
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const rows = await db
    .select({
      date: sql<string>`DATE(${profiles.createdAt})`.as("date"),
      count: count(),
    })
    .from(profiles)
    .where(and(eq(profiles.approvalStatus, "approved"), gte(profiles.createdAt, thirtyDaysAgo)))
    .groupBy(sql`DATE(${profiles.createdAt})`)
    .orderBy(sql`DATE(${profiles.createdAt})`);

  return rows;
}

export async function getPostChartData() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const rows = await db
    .select({
      date: sql<string>`DATE(${socialPosts.createdAt})`.as("date"),
      count: count(),
    })
    .from(socialPosts)
    .where(gte(socialPosts.createdAt, thirtyDaysAgo))
    .groupBy(sql`DATE(${socialPosts.createdAt})`)
    .orderBy(sql`DATE(${socialPosts.createdAt})`);

  return rows;
}

export async function getTopGroups() {
  const rows = await db
    .select({
      id: groups.id,
      name: groups.name,
      memberCount: groups.memberCount,
    })
    .from(groups)
    .orderBy(desc(groups.memberCount))
    .limit(5);

  return rows;
}

// ─── Weekly digest data ───────────────────────────────────────────────────────

export async function getWeeklyDigestData() {
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [newMembers, postsCount, pendingReports, topGroups] = await Promise.all([
    db.select({ count: count() }).from(profiles).where(and(eq(profiles.approvalStatus, "approved"), gte(profiles.createdAt, oneWeekAgo))),
    db.select({ count: count() }).from(socialPosts).where(gte(socialPosts.createdAt, oneWeekAgo)),
    db.select({ count: count() }).from(contentReports).where(eq(contentReports.status, "pending")),
    getTopGroups(),
  ]);

  return {
    newMembers: newMembers[0].count,
    postsCount: postsCount[0].count,
    pendingReports: pendingReports[0].count,
    topGroups,
  };
}
