"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, postReactions, postComments } from "../../../db";
import { auth } from "../../../auth";
import type { ReactionType } from "@/types/blog";

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function requireApprovedUser() {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");
  if (session.user.approvalStatus !== "approved")
    throw new Error("Your account is pending approval");
  return session.user;
}

// ─── Reactions ────────────────────────────────────────────────────────────────

export async function toggleReaction(slug: string, reactionType: ReactionType) {
  const user = await requireApprovedUser();

  const existing = await db
    .select({ id: postReactions.id })
    .from(postReactions)
    .where(
      and(
        eq(postReactions.postSlug, slug),
        eq(postReactions.userId, user.id!),
        eq(postReactions.reactionType, reactionType)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    await db.delete(postReactions).where(eq(postReactions.id, existing[0].id));
  } else {
    await db.insert(postReactions).values({
      postSlug: slug,
      userId: user.id!,
      reactionType,
    });
  }

  revalidatePath(`/blog/${slug}`);
  return { ok: true };
}

// ─── Comments ─────────────────────────────────────────────────────────────────

export async function createComment(
  slug: string,
  content: string,
  parentId?: string
) {
  const user = await requireApprovedUser();

  const trimmed = content.trim();
  if (!trimmed || trimmed.length > 2000) {
    throw new Error("Comment must be between 1 and 2000 characters");
  }

  await db.insert(postComments).values({
    postSlug: slug,
    userId: user.id!,
    parentId: parentId ?? null,
    content: trimmed,
  });

  revalidatePath(`/blog/${slug}`);
  return { ok: true };
}

export async function editComment(commentId: string, content: string) {
  const user = await requireApprovedUser();

  const rows = await db
    .select()
    .from(postComments)
    .where(eq(postComments.id, commentId))
    .limit(1);

  const comment = rows[0];
  if (!comment) throw new Error("Comment not found");
  if (comment.userId !== user.id) throw new Error("Not your comment");

  // 10-minute edit window
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
  if (comment.createdAt < tenMinutesAgo) {
    throw new Error("Edit window has passed (10 minutes)");
  }

  const trimmed = content.trim();
  if (!trimmed || trimmed.length > 2000) {
    throw new Error("Comment must be between 1 and 2000 characters");
  }

  await db
    .update(postComments)
    .set({ content: trimmed, isEdited: true, updatedAt: new Date() })
    .where(eq(postComments.id, commentId));

  revalidatePath(`/blog/${comment.postSlug}`);
  return { ok: true };
}

export async function deleteComment(commentId: string) {
  const user = await requireApprovedUser();

  const rows = await db
    .select()
    .from(postComments)
    .where(eq(postComments.id, commentId))
    .limit(1);

  const comment = rows[0];
  if (!comment) throw new Error("Comment not found");
  if (comment.userId !== user.id) throw new Error("Not your comment");

  // Soft delete — preserve thread structure
  await db
    .update(postComments)
    .set({ content: "[deleted]", updatedAt: new Date() })
    .where(eq(postComments.id, commentId));

  revalidatePath(`/blog/${comment.postSlug}`);
  return { ok: true };
}

export async function hideComment(commentId: string) {
  // Admin/pastor only
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");
  const role = session.user.role;
  if (role !== "admin" && role !== "pastor") throw new Error("Unauthorized");

  const rows = await db
    .select()
    .from(postComments)
    .where(eq(postComments.id, commentId))
    .limit(1);

  const comment = rows[0];
  if (!comment) throw new Error("Comment not found");

  await db
    .update(postComments)
    .set({ isHidden: true, updatedAt: new Date() })
    .where(eq(postComments.id, commentId));

  revalidatePath(`/blog/${comment.postSlug}`);
  return { ok: true };
}
