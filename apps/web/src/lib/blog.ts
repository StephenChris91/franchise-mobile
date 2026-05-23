// Server-only — DB queries. Do NOT import in Client Components.
// Import constants (CATEGORY_GRADIENTS etc.) from "@/lib/blog-constants" in client code.
import { eq, desc, and, ne } from "drizzle-orm";
import { db, blogPosts } from "../../db";
import type { BlogPostRow } from "../../db/schema";
import type { BlogPost, PostCategory } from "@/types/blog";
import { CATEGORY_GRADIENTS, CATEGORY_LABELS } from "./blog-constants";

export { CATEGORY_GRADIENTS, CATEGORY_LABELS };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function estimateReadingTime(text: string): { text: string; words: number } {
  const words = text.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.round(words / 200));
  return { text: `${minutes} min read`, words };
}

function rowToPost(row: BlogPostRow): BlogPost {
  const { text: readingTime, words: wordCount } = estimateReadingTime(
    row.content
  );
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    author: row.author,
    publishedAt: (row.publishedAt ?? row.createdAt).toISOString(),
    coverImage: row.coverImage,
    category: row.category as PostCategory,
    tags: row.tags
      ? row.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : [],
    featured: row.featured,
    readingTime,
    wordCount,
  };
}

// ─── Public read functions ────────────────────────────────────────────────────

export async function getAllPosts(): Promise<BlogPost[]> {
  const rows = await db
    .select()
    .from(blogPosts)
    .where(eq(blogPosts.isPublished, true))
    .orderBy(desc(blogPosts.publishedAt));
  return rows.map(rowToPost);
}

export async function getPostBySlug(
  slug: string
): Promise<{ post: BlogPost; source: string } | null> {
  const rows = await db
    .select()
    .from(blogPosts)
    .where(and(eq(blogPosts.slug, slug), eq(blogPosts.isPublished, true)))
    .limit(1);

  if (!rows[0]) return null;
  const post = rowToPost(rows[0]);
  return { post, source: rows[0].content };
}

export async function getRelatedPosts(
  currentSlug: string,
  category: PostCategory,
  limit = 3
): Promise<BlogPost[]> {
  const rows = await db
    .select()
    .from(blogPosts)
    .where(
      and(
        eq(blogPosts.isPublished, true),
        eq(blogPosts.category, category),
        ne(blogPosts.slug, currentSlug)
      )
    )
    .orderBy(desc(blogPosts.publishedAt))
    .limit(limit);
  return rows.map(rowToPost);
}

export async function getPostsByCategory(
  category: PostCategory
): Promise<BlogPost[]> {
  const rows = await db
    .select()
    .from(blogPosts)
    .where(
      and(eq(blogPosts.isPublished, true), eq(blogPosts.category, category))
    )
    .orderBy(desc(blogPosts.publishedAt));
  return rows.map(rowToPost);
}

export async function getFeaturedPost(): Promise<BlogPost | null> {
  const rows = await db
    .select()
    .from(blogPosts)
    .where(
      and(eq(blogPosts.isPublished, true), eq(blogPosts.featured, true))
    )
    .orderBy(desc(blogPosts.publishedAt))
    .limit(1);
  return rows[0] ? rowToPost(rows[0]) : null;
}

// ─── Admin read functions (includes drafts) ───────────────────────────────────

export async function getAllPostsAdmin(): Promise<BlogPostRow[]> {
  return db.select().from(blogPosts).orderBy(desc(blogPosts.createdAt));
}

export async function getPostByIdAdmin(
  id: string
): Promise<BlogPostRow | null> {
  const rows = await db
    .select()
    .from(blogPosts)
    .where(eq(blogPosts.id, id))
    .limit(1);
  return rows[0] ?? null;
}
