CREATE TYPE "public"."reaction_type" AS ENUM('like', 'amen', 'praying');--> statement-breakpoint
CREATE TABLE "post_comments" (
	"id" text PRIMARY KEY NOT NULL,
	"post_slug" text NOT NULL,
	"user_id" text NOT NULL,
	"parent_id" text,
	"content" text NOT NULL,
	"is_hidden" boolean DEFAULT false NOT NULL,
	"is_edited" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "post_reactions" (
	"id" text PRIMARY KEY NOT NULL,
	"post_slug" text NOT NULL,
	"user_id" text NOT NULL,
	"reaction_type" "reaction_type" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "post_views" (
	"id" text PRIMARY KEY NOT NULL,
	"post_slug" text NOT NULL,
	"session_id" text NOT NULL,
	"user_id" text,
	"viewed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "post_comments" ADD CONSTRAINT "post_comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_comments" ADD CONSTRAINT "post_comments_parent_id_post_comments_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."post_comments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_reactions" ADD CONSTRAINT "post_reactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_views" ADD CONSTRAINT "post_views_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "post_comments_slug_idx" ON "post_comments" USING btree ("post_slug");--> statement-breakpoint
CREATE INDEX "post_comments_parent_idx" ON "post_comments" USING btree ("parent_id");--> statement-breakpoint
CREATE UNIQUE INDEX "post_reactions_slug_user_type_idx" ON "post_reactions" USING btree ("post_slug","user_id","reaction_type");--> statement-breakpoint
CREATE INDEX "post_reactions_slug_idx" ON "post_reactions" USING btree ("post_slug");--> statement-breakpoint
CREATE UNIQUE INDEX "post_views_slug_session_idx" ON "post_views" USING btree ("post_slug","session_id");--> statement-breakpoint
CREATE INDEX "post_views_slug_idx" ON "post_views" USING btree ("post_slug");