CREATE TYPE "public"."group_member_role" AS ENUM('member', 'moderator', 'leader');--> statement-breakpoint
CREATE TYPE "public"."group_type" AS ENUM('ministry', 'interest', 'small_group', 'leadership');--> statement-breakpoint
CREATE TYPE "public"."group_visibility" AS ENUM('public', 'private');--> statement-breakpoint
CREATE TYPE "public"."notification_entity_type" AS ENUM('post', 'comment', 'group', 'user');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('comment_on_post', 'reaction_on_post', 'group_join', 'mention', 'prayer_reaction', 'new_post_in_group');--> statement-breakpoint
CREATE TYPE "public"."report_reason" AS ENUM('spam', 'inappropriate', 'harassment', 'misinformation', 'other');--> statement-breakpoint
CREATE TYPE "public"."report_status" AS ENUM('pending', 'resolved', 'dismissed');--> statement-breakpoint
CREATE TYPE "public"."social_post_type" AS ENUM('regular', 'prayer', 'announcement', 'testimony');--> statement-breakpoint
CREATE TYPE "public"."social_reaction_type" AS ENUM('like', 'amen', 'praying', 'heart');--> statement-breakpoint
CREATE TABLE "content_reports" (
	"id" text PRIMARY KEY NOT NULL,
	"reporter_id" text NOT NULL,
	"reported_post_id" text,
	"reported_comment_id" text,
	"reason" "report_reason" NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"status" "report_status" DEFAULT 'pending' NOT NULL,
	"resolved_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"resolved_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "group_members" (
	"group_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" "group_member_role" DEFAULT 'member' NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "group_members_group_id_user_id_pk" PRIMARY KEY("group_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "groups" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"group_type" "group_type" NOT NULL,
	"visibility" "group_visibility" DEFAULT 'public' NOT NULL,
	"cover_image_url" text DEFAULT '' NOT NULL,
	"created_by" text,
	"member_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"actor_id" text,
	"notification_type" "notification_type" NOT NULL,
	"entity_type" "notification_entity_type" NOT NULL,
	"entity_id" text NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "social_post_comments" (
	"id" text PRIMARY KEY NOT NULL,
	"post_id" text NOT NULL,
	"author_id" text NOT NULL,
	"parent_id" text,
	"content" text NOT NULL,
	"is_hidden" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "social_post_reactions" (
	"post_id" text NOT NULL,
	"user_id" text NOT NULL,
	"reaction_type" "social_reaction_type" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "social_post_reactions_post_id_user_id_reaction_type_pk" PRIMARY KEY("post_id","user_id","reaction_type")
);
--> statement-breakpoint
CREATE TABLE "social_posts" (
	"id" text PRIMARY KEY NOT NULL,
	"author_id" text NOT NULL,
	"group_id" text,
	"content" text NOT NULL,
	"post_type" "social_post_type" DEFAULT 'regular' NOT NULL,
	"media_urls" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_pinned" boolean DEFAULT false NOT NULL,
	"is_hidden" boolean DEFAULT false NOT NULL,
	"reaction_count" integer DEFAULT 0 NOT NULL,
	"comment_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "content_reports" ADD CONSTRAINT "content_reports_reporter_id_users_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_reports" ADD CONSTRAINT "content_reports_reported_post_id_social_posts_id_fk" FOREIGN KEY ("reported_post_id") REFERENCES "public"."social_posts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_reports" ADD CONSTRAINT "content_reports_reported_comment_id_social_post_comments_id_fk" FOREIGN KEY ("reported_comment_id") REFERENCES "public"."social_post_comments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_reports" ADD CONSTRAINT "content_reports_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "groups" ADD CONSTRAINT "groups_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_post_comments" ADD CONSTRAINT "social_post_comments_post_id_social_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."social_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_post_comments" ADD CONSTRAINT "social_post_comments_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_post_comments" ADD CONSTRAINT "social_post_comments_parent_id_social_post_comments_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."social_post_comments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_post_reactions" ADD CONSTRAINT "social_post_reactions_post_id_social_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."social_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_post_reactions" ADD CONSTRAINT "social_post_reactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_posts" ADD CONSTRAINT "social_posts_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_posts" ADD CONSTRAINT "social_posts_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "group_members_user_idx" ON "group_members" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "groups_slug_idx" ON "groups" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "groups_type_idx" ON "groups" USING btree ("group_type");--> statement-breakpoint
CREATE INDEX "notifications_user_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notifications_read_idx" ON "notifications" USING btree ("user_id","is_read");--> statement-breakpoint
CREATE INDEX "social_comments_post_idx" ON "social_post_comments" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "social_comments_parent_idx" ON "social_post_comments" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "social_reactions_post_idx" ON "social_post_reactions" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "social_posts_author_idx" ON "social_posts" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "social_posts_group_idx" ON "social_posts" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "social_posts_type_idx" ON "social_posts" USING btree ("post_type");--> statement-breakpoint
CREATE INDEX "social_posts_created_idx" ON "social_posts" USING btree ("created_at");