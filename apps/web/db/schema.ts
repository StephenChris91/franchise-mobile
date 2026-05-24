import {
  pgTable,
  text,
  timestamp,
  boolean,
  pgEnum,
  primaryKey,
  integer,
  index,
  uniqueIndex,
  jsonb,
} from "drizzle-orm/pg-core";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import type { AdapterAccountType } from "next-auth/adapters";

// ─── Auth.js required tables ─────────────────────────────────────────────────

export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
  passwordHash: text("password_hash"),
});

export const accounts = pgTable(
  "accounts",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({ columns: [account.provider, account.providerAccountId] }),
  ]
);

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })]
);

// ─── Enums ────────────────────────────────────────────────────────────────────

export const ministryEnum = pgEnum("ministry", [
  "none",
  "choir",
  "ushers",
  "prayer_team",
  "media",
  "kids",
  "youth",
  "adults",
  "other",
]);

export const approvalStatusEnum = pgEnum("approval_status", [
  "pending",
  "approved",
  "rejected",
  "suspended",
]);

export const roleEnum = pgEnum("role", [
  "member",
  "group_leader",
  "admin",
  "pastor",
]);

// ─── Profiles ─────────────────────────────────────────────────────────────────

export const profiles = pgTable("profiles", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  username: text("username").unique().notNull(),
  fullName: text("full_name").notNull(),
  photoUrl: text("photo_url"),
  bio: text("bio"),
  ministry: ministryEnum("ministry").default("none").notNull(),
  phone: text("phone"),
  whatsappNumber: text("whatsapp_number"),
  approvalStatus: approvalStatusEnum("approval_status")
    .default("pending")
    .notNull(),
  role: roleEnum("role").default("member").notNull(),
  rejectionReason: text("rejection_reason"),
  approvedBy: text("approved_by").references(() => users.id, {
    onDelete: "set null",
  }),
  approvedAt: timestamp("approved_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  notificationPrefs: jsonb("notification_prefs")
    .$type<{
      comments: boolean;
      reactions: boolean;
      groupPosts: boolean;
      announcements: boolean;
      eventReminders: boolean;
    }>()
    .notNull()
    .default({ comments: true, reactions: true, groupPosts: true, announcements: true, eventReminders: true }),
});

// ─── Password reset tokens ────────────────────────────────────────────────────

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").unique().notNull(),
  expires: timestamp("expires", { mode: "date" }).notNull(),
  used: boolean("used").default(false).notNull(),
});

export type User = typeof users.$inferSelect;
export type Profile = typeof profiles.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type NewProfile = typeof profiles.$inferInsert;

// ─── Blog enums ───────────────────────────────────────────────────────────────

export const blogCategoryEnum = pgEnum("blog_category", [
  "sermon",
  "devotional",
  "announcement",
  "testimony",
  "teaching",
]);

export const reactionTypeEnum = pgEnum("reaction_type", [
  "like",
  "amen",
  "praying",
]);

// ─── Post views ───────────────────────────────────────────────────────────────

export const postViews = pgTable(
  "post_views",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    postSlug: text("post_slug").notNull(),
    sessionId: text("session_id").notNull(),
    userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
    viewedAt: timestamp("viewed_at", { mode: "date" }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("post_views_slug_session_idx").on(t.postSlug, t.sessionId),
    index("post_views_slug_idx").on(t.postSlug),
  ]
);

// ─── Post reactions ───────────────────────────────────────────────────────────

export const postReactions = pgTable(
  "post_reactions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    postSlug: text("post_slug").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    reactionType: reactionTypeEnum("reaction_type").notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("post_reactions_slug_user_type_idx").on(
      t.postSlug,
      t.userId,
      t.reactionType
    ),
    index("post_reactions_slug_idx").on(t.postSlug),
  ]
);

// ─── Post comments ────────────────────────────────────────────────────────────

export const postComments = pgTable(
  "post_comments",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    postSlug: text("post_slug").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    parentId: text("parent_id").references(
      (): AnyPgColumn => postComments.id,
      { onDelete: "cascade" }
    ),
    content: text("content").notNull(),
    isHidden: boolean("is_hidden").default(false).notNull(),
    isEdited: boolean("is_edited").default(false).notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (t) => [
    index("post_comments_slug_idx").on(t.postSlug),
    index("post_comments_parent_idx").on(t.parentId),
  ]
);

// ─── Blog posts (admin-managed) ───────────────────────────────────────────────

export const blogPosts = pgTable(
  "blog_posts",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    excerpt: text("excerpt").notNull().default(""),
    author: text("author").notNull().default("Franchise Church"),
    coverImage: text("cover_image").notNull().default(""),
    category: blogCategoryEnum("category").notNull(),
    tags: text("tags").notNull().default(""), // comma-separated
    content: text("content").notNull().default(""),
    featured: boolean("featured").default(false).notNull(),
    isPublished: boolean("is_published").default(false).notNull(),
    publishedAt: timestamp("published_at", { mode: "date" }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("blog_posts_slug_idx").on(t.slug),
    index("blog_posts_category_idx").on(t.category),
    index("blog_posts_published_idx").on(t.isPublished),
  ]
);

export type BlogPostRow = typeof blogPosts.$inferSelect;
export type NewBlogPost = typeof blogPosts.$inferInsert;

export type PostView = typeof postViews.$inferSelect;
export type PostReaction = typeof postReactions.$inferSelect;
export type PostComment = typeof postComments.$inferSelect;

// ─── Social enums ─────────────────────────────────────────────────────────────

export const groupTypeEnum = pgEnum("group_type", [
  "ministry",
  "interest",
  "small_group",
  "leadership",
]);

export const groupVisibilityEnum = pgEnum("group_visibility", [
  "public",
  "private",
]);

export const groupMemberRoleEnum = pgEnum("group_member_role", [
  "member",
  "moderator",
  "leader",
]);

export const socialPostTypeEnum = pgEnum("social_post_type", [
  "regular",
  "prayer",
  "announcement",
  "testimony",
]);

export const socialReactionTypeEnum = pgEnum("social_reaction_type", [
  "like",
  "amen",
  "praying",
  "heart",
]);

export const reportReasonEnum = pgEnum("report_reason", [
  "spam",
  "inappropriate",
  "harassment",
  "misinformation",
  "other",
]);

export const reportStatusEnum = pgEnum("report_status", [
  "pending",
  "resolved",
  "dismissed",
]);

export const notificationTypeEnum = pgEnum("notification_type", [
  "comment_on_post",
  "reaction_on_post",
  "group_join",
  "mention",
  "prayer_reaction",
  "new_post_in_group",
  "announcement",
  "event_reminder",
]);

export const notificationEntityTypeEnum = pgEnum("notification_entity_type", [
  "post",
  "comment",
  "group",
  "user",
]);

// ─── Groups ───────────────────────────────────────────────────────────────────

export const groups = pgTable(
  "groups",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    groupType: groupTypeEnum("group_type").notNull(),
    visibility: groupVisibilityEnum("visibility").notNull().default("public"),
    coverImageUrl: text("cover_image_url").notNull().default(""),
    createdBy: text("created_by").references(() => users.id, { onDelete: "set null" }),
    memberCount: integer("member_count").notNull().default(0),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("groups_slug_idx").on(t.slug),
    index("groups_type_idx").on(t.groupType),
  ]
);

export const groupMembers = pgTable(
  "group_members",
  {
    groupId: text("group_id")
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: groupMemberRoleEnum("role").notNull().default("member"),
    joinedAt: timestamp("joined_at", { mode: "date" }).defaultNow().notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.groupId, t.userId] }),
    index("group_members_user_idx").on(t.userId),
  ]
);

// ─── Social posts ─────────────────────────────────────────────────────────────

export const socialPosts = pgTable(
  "social_posts",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    authorId: text("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    groupId: text("group_id").references(() => groups.id, { onDelete: "cascade" }),
    content: text("content").notNull(), // Tiptap JSON string
    postType: socialPostTypeEnum("post_type").notNull().default("regular"),
    mediaUrls: jsonb("media_urls").$type<string[]>().notNull().default([]),
    isPinned: boolean("is_pinned").notNull().default(false),
    isHidden: boolean("is_hidden").notNull().default(false),
    reactionCount: integer("reaction_count").notNull().default(0),
    commentCount: integer("comment_count").notNull().default(0),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (t) => [
    index("social_posts_author_idx").on(t.authorId),
    index("social_posts_group_idx").on(t.groupId),
    index("social_posts_type_idx").on(t.postType),
    index("social_posts_created_idx").on(t.createdAt),
  ]
);

export const socialPostReactions = pgTable(
  "social_post_reactions",
  {
    postId: text("post_id")
      .notNull()
      .references(() => socialPosts.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    reactionType: socialReactionTypeEnum("reaction_type").notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.postId, t.userId, t.reactionType] }),
    index("social_reactions_post_idx").on(t.postId),
  ]
);

export const socialPostComments = pgTable(
  "social_post_comments",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    postId: text("post_id")
      .notNull()
      .references(() => socialPosts.id, { onDelete: "cascade" }),
    authorId: text("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    parentId: text("parent_id").references(
      (): AnyPgColumn => socialPostComments.id,
      { onDelete: "cascade" }
    ),
    content: text("content").notNull(),
    isHidden: boolean("is_hidden").notNull().default(false),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (t) => [
    index("social_comments_post_idx").on(t.postId),
    index("social_comments_parent_idx").on(t.parentId),
  ]
);

// ─── Content reports ──────────────────────────────────────────────────────────

export const contentReports = pgTable("content_reports", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  reporterId: text("reporter_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  reportedPostId: text("reported_post_id").references(() => socialPosts.id, {
    onDelete: "set null",
  }),
  reportedCommentId: text("reported_comment_id").references(
    () => socialPostComments.id,
    { onDelete: "set null" }
  ),
  reason: reportReasonEnum("reason").notNull(),
  notes: text("notes").notNull().default(""),
  status: reportStatusEnum("status").notNull().default("pending"),
  resolvedBy: text("resolved_by").references(() => users.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  resolvedAt: timestamp("resolved_at", { mode: "date" }),
});

// ─── Notifications ────────────────────────────────────────────────────────────

export const notifications = pgTable(
  "notifications",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    actorId: text("actor_id").references(() => users.id, { onDelete: "set null" }),
    notificationType: notificationTypeEnum("notification_type").notNull(),
    entityType: notificationEntityTypeEnum("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    isRead: boolean("is_read").notNull().default(false),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (t) => [
    index("notifications_user_idx").on(t.userId),
    index("notifications_read_idx").on(t.userId, t.isRead),
  ]
);

// ─── Events ───────────────────────────────────────────────────────────────────

export const eventTypeEnum = pgEnum("event_type", [
  "service",
  "conference",
  "outreach",
  "social",
  "training",
  "prayer",
  "other",
]);

export const rsvpStatusEnum = pgEnum("rsvp_status", [
  "going",
  "interested",
  "not_going",
]);

export const events = pgTable(
  "events",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    coverImageUrl: text("cover_image_url"),
    eventType: eventTypeEnum("event_type").notNull().default("service"),
    location: text("location").notNull().default(""),
    locationUrl: text("location_url"),
    startsAt: timestamp("starts_at", { mode: "date" }).notNull(),
    endsAt: timestamp("ends_at", { mode: "date" }).notNull(),
    capacity: integer("capacity"),
    rsvpRequired: boolean("rsvp_required").notNull().default(false),
    isPublished: boolean("is_published").notNull().default(false),
    createdBy: text("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("events_slug_idx").on(t.slug),
    index("events_starts_idx").on(t.startsAt),
    index("events_published_idx").on(t.isPublished),
  ]
);

export const eventRsvps = pgTable(
  "event_rsvps",
  {
    eventId: text("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: rsvpStatusEnum("status").notNull(),
    guestsCount: integer("guests_count").notNull().default(0),
    notes: text("notes"),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.eventId, t.userId] }),
    index("event_rsvps_event_idx").on(t.eventId),
    index("event_rsvps_user_idx").on(t.userId),
  ]
);

// ─── Admin audit log ──────────────────────────────────────────────────────────

export const adminActions = pgTable(
  "admin_actions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    adminId: text("admin_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    actionType: text("action_type").notNull(),
    targetType: text("target_type").notNull(),
    targetId: text("target_id").notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (t) => [
    index("admin_actions_admin_idx").on(t.adminId),
    index("admin_actions_created_idx").on(t.createdAt),
  ]
);

// ─── Refresh tokens (JWT auth for mobile) ────────────────────────────────────

export const refreshTokens = pgTable(
  "refresh_tokens",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    deviceInfo: text("device_info"),
    expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    lastUsedAt: timestamp("last_used_at", { mode: "date" }).defaultNow().notNull(),
    revoked: boolean("revoked").notNull().default(false),
  },
  (t) => [
    index("refresh_tokens_user_idx").on(t.userId),
    index("refresh_tokens_hash_idx").on(t.tokenHash),
  ]
);

// ─── Push notification tokens ─────────────────────────────────────────────────

export const pushTokens = pgTable(
  "push_tokens",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: text("token").notNull(),
    platform: text("platform").notNull(), // "ios" | "android"
    deviceName: text("device_name"),
    lastUsedAt: timestamp("last_used_at", { mode: "date" }).defaultNow().notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("push_tokens_token_idx").on(t.token),
    index("push_tokens_user_idx").on(t.userId),
  ]
);

// ─── Social types ─────────────────────────────────────────────────────────────

export type Group = typeof groups.$inferSelect;
export type GroupMember = typeof groupMembers.$inferSelect;
export type SocialPost = typeof socialPosts.$inferSelect;
export type SocialPostReaction = typeof socialPostReactions.$inferSelect;
export type SocialPostComment = typeof socialPostComments.$inferSelect;
export type ContentReport = typeof contentReports.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type Event = typeof events.$inferSelect;
export type EventRsvp = typeof eventRsvps.$inferSelect;
export type AdminAction = typeof adminActions.$inferSelect;
export type RefreshToken = typeof refreshTokens.$inferSelect;
export type PushToken = typeof pushTokens.$inferSelect;
