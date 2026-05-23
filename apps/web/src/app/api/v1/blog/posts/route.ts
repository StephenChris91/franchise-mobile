import { NextRequest } from "next/server";
import { db, blogPosts } from "@franchise/db";
import { eq, desc } from "drizzle-orm";
import { ok, withAuth } from "@/lib/api/middleware";

function readingTime(text: string) {
  const words = text.trim().split(/\s+/).length;
  return { text: `${Math.max(1, Math.round(words / 200))} min read`, words };
}

export async function GET(req: NextRequest) {
  return withAuth(req, async () => {
    const rows = await db.select().from(blogPosts).where(eq(blogPosts.isPublished, true)).orderBy(desc(blogPosts.publishedAt));
    const { text: rt, words: wc } = readingTime(rows.map((r) => r.content).join(" "));

    return ok(rows.map((r) => {
      const { text, words } = readingTime(r.content);
      return {
        id: r.id, slug: r.slug, title: r.title, excerpt: r.excerpt, author: r.author,
        coverImage: r.coverImage, category: r.category, featured: r.featured,
        tags: r.tags ? r.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
        publishedAt: (r.publishedAt ?? r.createdAt).toISOString(),
        readingTime: text, wordCount: words,
      };
    }));
  });
}
