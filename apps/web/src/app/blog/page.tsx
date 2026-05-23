import type { Metadata } from "next";
import { Rss } from "lucide-react";
import Link from "next/link";
import { getAllPosts, getFeaturedPost } from "@/lib/blog";
import BlogIndexClient from "@/components/blog/BlogIndexClient";

export const metadata: Metadata = {
  title: "Blog | Franchise Church",
  description:
    "Life-transforming messages, devotionals, teachings, and announcements from Franchise Church Lagos.",
  openGraph: {
    title: "Blog | Franchise Church",
    description:
      "Life-transforming messages, devotionals, teachings, and announcements from Franchise Church Lagos.",
    type: "website",
  },
};

export const dynamic = "force-dynamic";

export default async function BlogIndexPage() {
  const [posts, featuredPost] = await Promise.all([
    getAllPosts(),
    getFeaturedPost(),
  ]);

  return (
    <div className="min-h-screen bg-[#f7f5f2]">
      {/* Hero banner */}
      <section className="bg-[#1b1b1b] px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#af601a] mb-3">
            Words &amp; Wisdom
          </p>
          <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-4 max-w-2xl">
            Life Giving{" "}
            <span className="text-[#af601a]">Articles</span>
          </h1>
          <p className="text-white/60 text-base max-w-lg leading-relaxed">
            Sermons, devotionals, teachings, and updates from the Franchise
            Church pastoral team — designed to build your faith and grow your
            walk with God.
          </p>
          <div className="mt-6 flex items-center gap-4">
            <span className="text-white/40 text-sm">{posts.length} articles</span>
            <Link
              href="/blog/rss.xml"
              className="flex items-center gap-1.5 text-sm text-white/40 hover:text-[#af601a] transition-colors"
              aria-label="RSS Feed"
            >
              <Rss size={14} />
              RSS
            </Link>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <BlogIndexClient posts={posts} featuredPost={featuredPost} />
      </section>
    </div>
  );
}
