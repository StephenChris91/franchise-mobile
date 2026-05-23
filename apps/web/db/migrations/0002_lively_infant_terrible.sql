CREATE TYPE "public"."blog_category" AS ENUM('sermon', 'devotional', 'announcement', 'testimony', 'teaching');--> statement-breakpoint
CREATE TABLE "blog_posts" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"excerpt" text DEFAULT '' NOT NULL,
	"author" text DEFAULT 'Franchise Church' NOT NULL,
	"cover_image" text DEFAULT '' NOT NULL,
	"category" "blog_category" NOT NULL,
	"tags" text DEFAULT '' NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "blog_posts_slug_idx" ON "blog_posts" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "blog_posts_category_idx" ON "blog_posts" USING btree ("category");--> statement-breakpoint
CREATE INDEX "blog_posts_published_idx" ON "blog_posts" USING btree ("is_published");