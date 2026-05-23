"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, blogPosts } from "../../../db";
import { auth } from "../../../auth";

// ─── Auth guard ───────────────────────────────────────────────────────────────

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");
  const role = session.user.role;
  if (role !== "admin" && role !== "pastor") throw new Error("Unauthorized");
  return session.user;
}

// ─── CRUD actions ─────────────────────────────────────────────────────────────

export interface BlogPostFormData {
  title: string;
  slug: string;
  excerpt: string;
  author: string;
  coverImage: string;
  category: string;
  tags: string; // comma-separated
  content: string;
  featured: boolean;
  isPublished: boolean;
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export async function createPost(data: BlogPostFormData) {
  await requireAdmin();

  const slug = data.slug || slugify(data.title);
  const publishedAt = data.isPublished ? new Date() : null;

  const [post] = await db
    .insert(blogPosts)
    .values({
      title: data.title.trim(),
      slug,
      excerpt: data.excerpt.trim(),
      author: data.author.trim() || "Franchise Church",
      coverImage: data.coverImage.trim(),
      category: data.category as "sermon" | "devotional" | "announcement" | "testimony" | "teaching",
      tags: data.tags.trim(),
      content: data.content,
      featured: data.featured,
      isPublished: data.isPublished,
      publishedAt,
    })
    .returning({ id: blogPosts.id });

  revalidatePath("/blog");
  revalidatePath("/admin/blog");
  redirect(`/admin/blog`);
}

export async function updatePost(id: string, data: BlogPostFormData) {
  await requireAdmin();

  const existing = await db
    .select({ isPublished: blogPosts.isPublished, publishedAt: blogPosts.publishedAt })
    .from(blogPosts)
    .where(eq(blogPosts.id, id))
    .limit(1);

  if (!existing[0]) throw new Error("Post not found");

  // Only set publishedAt when first publishing
  const publishedAt =
    data.isPublished && !existing[0].isPublished
      ? new Date()
      : existing[0].publishedAt;

  await db
    .update(blogPosts)
    .set({
      title: data.title.trim(),
      slug: data.slug || slugify(data.title),
      excerpt: data.excerpt.trim(),
      author: data.author.trim() || "Franchise Church",
      coverImage: data.coverImage.trim(),
      category: data.category as "sermon" | "devotional" | "announcement" | "testimony" | "teaching",
      tags: data.tags.trim(),
      content: data.content,
      featured: data.featured,
      isPublished: data.isPublished,
      publishedAt,
      updatedAt: new Date(),
    })
    .where(eq(blogPosts.id, id));

  revalidatePath("/blog");
  revalidatePath(`/blog/${data.slug}`);
  revalidatePath("/admin/blog");
  redirect(`/admin/blog`);
}

export async function deletePost(id: string) {
  await requireAdmin();

  const rows = await db
    .select({ slug: blogPosts.slug })
    .from(blogPosts)
    .where(eq(blogPosts.id, id))
    .limit(1);

  if (rows[0]) {
    await db.delete(blogPosts).where(eq(blogPosts.id, id));
    revalidatePath("/blog");
    revalidatePath(`/blog/${rows[0].slug}`);
    revalidatePath("/admin/blog");
  }
}

export async function togglePublished(id: string, currentState: boolean) {
  await requireAdmin();

  const nowPublished = !currentState;
  await db
    .update(blogPosts)
    .set({
      isPublished: nowPublished,
      publishedAt: nowPublished ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(blogPosts.id, id));

  revalidatePath("/blog");
  revalidatePath("/admin/blog");
}

export async function setFeatured(id: string) {
  await requireAdmin();

  // Un-feature all first, then feature the selected one
  await db.update(blogPosts).set({ featured: false });
  await db.update(blogPosts).set({ featured: true }).where(eq(blogPosts.id, id));

  revalidatePath("/blog");
  revalidatePath("/admin/blog");
}
