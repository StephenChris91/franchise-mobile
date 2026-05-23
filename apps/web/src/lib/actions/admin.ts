"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "../../../auth";
import {
  db,
  profiles,
  users,
  contentReports,
  socialPosts,
  adminActions,
  groups,
  groupMembers,
} from "../../../db";
import { sendWelcomeEmail, sendRejectionEmail } from "@/lib/email";

// ─── Auth helper ──────────────────────────────────────────────────────────────

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  const role = session.user.role;
  if (role !== "admin" && role !== "pastor") throw new Error("Unauthorized");
  return session.user;
}

async function requirePastor() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  if (session.user.role !== "pastor") throw new Error("Unauthorized — pastor only");
  return session.user;
}

async function logAction(adminId: string, actionType: string, targetType: string, targetId: string, metadata: Record<string, unknown> = {}) {
  await db.insert(adminActions).values({ adminId, actionType, targetType, targetId, metadata });
}

// ─── Member management ────────────────────────────────────────────────────────

export async function approveMember(userId: string) {
  const admin = await requireAdmin();

  // Fetch member details for welcome email
  const [member] = await db
    .select({ fullName: profiles.fullName, email: users.email })
    .from(profiles)
    .innerJoin(users, eq(profiles.userId, users.id))
    .where(eq(profiles.userId, userId))
    .limit(1);

  if (!member) throw new Error("Member not found");

  await db
    .update(profiles)
    .set({
      approvalStatus: "approved",
      approvedBy: admin.id,
      approvedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(profiles.userId, userId));

  // Auto-add to "New Members" group if it exists
  const [newMembersGroup] = await db
    .select({ id: groups.id })
    .from(groups)
    .where(eq(groups.slug, "new-members"))
    .limit(1);

  if (newMembersGroup) {
    await db
      .insert(groupMembers)
      .values({ groupId: newMembersGroup.id, userId })
      .onConflictDoNothing();
  }

  // Send welcome email
  if (member.email) {
    await sendWelcomeEmail({ to: member.email, fullName: member.fullName }).catch(() => {});
  }

  await logAction(admin.id!, "approve_member", "user", userId, { fullName: member.fullName });
  revalidatePath("/admin/members");
  return { ok: true };
}

export async function rejectMember(userId: string, reason: string) {
  const admin = await requireAdmin();

  const [member] = await db
    .select({ fullName: profiles.fullName, email: users.email })
    .from(profiles)
    .innerJoin(users, eq(profiles.userId, users.id))
    .where(eq(profiles.userId, userId))
    .limit(1);

  if (!member) throw new Error("Member not found");

  await db
    .update(profiles)
    .set({
      approvalStatus: "rejected",
      rejectionReason: reason,
      updatedAt: new Date(),
    })
    .where(eq(profiles.userId, userId));

  if (member.email) {
    await sendRejectionEmail({ to: member.email, fullName: member.fullName, reason }).catch(() => {});
  }

  await logAction(admin.id!, "reject_member", "user", userId, { reason, fullName: member.fullName });
  revalidatePath("/admin/members");
  return { ok: true };
}

export async function suspendMember(userId: string, reason: string) {
  const admin = await requireAdmin();

  const [member] = await db
    .select({ fullName: profiles.fullName })
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1);

  if (!member) throw new Error("Member not found");

  await db
    .update(profiles)
    .set({ approvalStatus: "suspended", updatedAt: new Date() })
    .where(eq(profiles.userId, userId));

  await logAction(admin.id!, "suspend_member", "user", userId, { reason, fullName: member.fullName });
  revalidatePath("/admin/members");
  return { ok: true };
}

export async function unsuspendMember(userId: string) {
  const admin = await requireAdmin();

  await db
    .update(profiles)
    .set({ approvalStatus: "approved", updatedAt: new Date() })
    .where(eq(profiles.userId, userId));

  await logAction(admin.id!, "unsuspend_member", "user", userId, {});
  revalidatePath("/admin/members");
  return { ok: true };
}

export async function changeMemberRole(userId: string, role: "member" | "group_leader" | "admin" | "pastor") {
  const admin = await requireAdmin();

  await db
    .update(profiles)
    .set({ role, updatedAt: new Date() })
    .where(eq(profiles.userId, userId));

  await logAction(admin.id!, "change_role", "user", userId, { role });
  revalidatePath("/admin/members");
  return { ok: true };
}

// ─── Report moderation ────────────────────────────────────────────────────────

export async function resolveReport(reportId: string, action: "hide_content" | "dismiss" | "hide_and_suspend") {
  const admin = await requireAdmin();

  const [report] = await db
    .select()
    .from(contentReports)
    .where(eq(contentReports.id, reportId))
    .limit(1);

  if (!report) throw new Error("Report not found");

  if (action === "hide_content" || action === "hide_and_suspend") {
    if (report.reportedPostId) {
      await db
        .update(socialPosts)
        .set({ isHidden: true })
        .where(eq(socialPosts.id, report.reportedPostId));
    }
  }

  if (action === "hide_and_suspend" && report.reportedPostId) {
    const [post] = await db
      .select({ authorId: socialPosts.authorId })
      .from(socialPosts)
      .where(eq(socialPosts.id, report.reportedPostId))
      .limit(1);

    if (post) {
      await db
        .update(profiles)
        .set({ approvalStatus: "suspended", updatedAt: new Date() })
        .where(eq(profiles.userId, post.authorId));
    }
  }

  await db
    .update(contentReports)
    .set({
      status: action === "dismiss" ? "dismissed" : "resolved",
      resolvedBy: admin.id,
      resolvedAt: new Date(),
    })
    .where(eq(contentReports.id, reportId));

  await logAction(admin.id!, `report_${action}`, "report", reportId, { action });
  revalidatePath("/admin/reports");
  return { ok: true };
}

// ─── Announcements ────────────────────────────────────────────────────────────

export async function postAnnouncement(opts: {
  content: string;
  pinDays?: number;
}) {
  const admin = await requireAdmin();
  const { content, pinDays = 0 } = opts;

  const [post] = await db
    .insert(socialPosts)
    .values({
      authorId: admin.id!,
      content,
      postType: "announcement",
      isPinned: pinDays > 0,
      mediaUrls: [],
    })
    .returning();

  await logAction(admin.id!, "post_announcement", "post", post.id, { pinDays });
  revalidatePath("/social");
  return { ok: true, postId: post.id };
}

// ─── Group management ─────────────────────────────────────────────────────────

export async function createGroup(data: {
  name: string;
  slug: string;
  description: string;
  groupType: "ministry" | "interest" | "small_group" | "leadership";
  visibility: "public" | "private";
}) {
  const admin = await requireAdmin();

  const [group] = await db
    .insert(groups)
    .values({ ...data, createdBy: admin.id })
    .returning();

  await logAction(admin.id!, "create_group", "group", group.id, { name: data.name });
  revalidatePath("/admin/groups");
  revalidatePath("/social/groups");
  return { ok: true, group };
}

export async function updateGroup(id: string, data: {
  name?: string;
  description?: string;
  visibility?: "public" | "private";
}) {
  const admin = await requireAdmin();

  await db
    .update(groups)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(groups.id, id));

  await logAction(admin.id!, "update_group", "group", id, data as Record<string, unknown>);
  revalidatePath("/admin/groups");
  revalidatePath("/social/groups");
  return { ok: true };
}
