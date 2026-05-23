import { z } from "zod";

export const createPostSchema = z.object({
  content: z.string().min(1, "Content is required").max(12000, "Content too long"),
  postType: z.enum(["regular", "prayer", "announcement", "testimony"]),
  groupId: z.string().optional().nullable(),
  mediaUrls: z.array(z.string().url()).max(4, "Max 4 images per post").optional(),
});

export const updatePostSchema = z.object({
  content: z.string().min(1, "Content is required").max(12000, "Content too long"),
});

export const createCommentSchema = z.object({
  content: z.string().min(1, "Comment is required").max(1000, "Comment must be under 1000 characters"),
  parentId: z.string().optional().nullable(),
});

export const updateCommentSchema = z.object({
  content: z.string().min(1, "Comment is required").max(1000, "Comment must be under 1000 characters"),
});

export const reactionSchema = z.object({
  type: z.enum(["like", "amen", "praying", "heart"]),
});

export const reportSchema = z.object({
  reason: z.enum(["spam", "inappropriate", "harassment", "misinformation", "other"]),
  notes: z.string().max(500).optional(),
});

export const listPostsSchema = z.object({
  groupId: z.string().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(50).default(20),
  postType: z.enum(["regular", "prayer", "announcement", "testimony"]).optional(),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type ReactionInput = z.infer<typeof reactionSchema>;
export type ReportInput = z.infer<typeof reportSchema>;
export type ListPostsInput = z.infer<typeof listPostsSchema>;
