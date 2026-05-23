import { NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { db, blogPosts } from "@franchise/db";
import { ok, err, withAuth } from "@/lib/api/middleware";

function readingTime(text: string) {
  const words = text.trim().split(/\s+/).length;
  return { text: `${Math.max(1, Math.round(words / 200))} min read`, words };
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  return withAuth(req, async () => {
    const { slug } = await params;
    const [row] = await db.select().from(blogPosts).where(and(eq(blogPosts.slug, slug), eq(blogPosts.isPublished, true))).limit(1);
    if (!row) return err("NOT_FOUND", "Post not found", 404);

    const { text, words } = readingTime(row.content);

    return ok({
      id: row.id, slug: row.slug, title: row.title, excerpt: row.excerpt, author: row.author,
      coverImage: row.coverImage, category: row.category, featured: row.featured,
      tags: row.tags ? row.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
      publishedAt: (row.publishedAt ?? row.createdAt).toISOString(),
      readingTime: text, wordCount: words,
      // The full MDX content — mobile can render this with a markdown renderer
      content: row.content,
    });
  });
}
