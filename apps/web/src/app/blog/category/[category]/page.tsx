import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPostsByCategory, CATEGORY_LABELS, getAllPosts } from "@/lib/blog";
import BlogIndexClient from "@/components/blog/BlogIndexClient";
import type { PostCategory } from "@/types/blog";

const VALID_CATEGORIES: PostCategory[] = [
  "sermon",
  "teaching",
  "devotional",
  "announcement",
  "testimony",
];

interface Props {
  params: Promise<{ category: string }>;
}

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  return VALID_CATEGORIES.map((category) => ({ category }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const label =
    CATEGORY_LABELS[category as PostCategory] ?? category;
  return {
    title: `${label} | Franchise Church Blog`,
    description: `Browse all ${label.toLowerCase()} posts from Franchise Church Lagos.`,
  };
}

export default async function CategoryPage({ params }: Props) {
  const { category } = await params;

  if (!VALID_CATEGORIES.includes(category as PostCategory)) {
    notFound();
  }

  const cat = category as PostCategory;
  const [posts, allPosts] = await Promise.all([
    getPostsByCategory(cat),
    getAllPosts(),
  ]);
  const label = CATEGORY_LABELS[cat];

  return (
    <div className="min-h-screen bg-[#f7f5f2]">
      {/* Hero */}
      <section className="bg-[#1b1b1b] px-6 py-16">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#af601a] mb-3">
            Category
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-white">
            {label}
          </h1>
          <p className="mt-2 text-white/50 text-sm">
            {posts.length} {posts.length === 1 ? "article" : "articles"}
          </p>
        </div>
      </section>

      {/* Grid */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <BlogIndexClient
          posts={allPosts}
          featuredPost={null}
          initialCategory={cat}
        />
      </section>
    </div>
  );
}
