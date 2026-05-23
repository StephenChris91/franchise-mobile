"use client";

import React, { useState, useMemo } from "react";
import { Search } from "lucide-react";
import BlogCard from "./BlogCard";
import type { BlogPost, PostCategory } from "@/types/blog";
import { ALL_CATEGORIES } from "@/lib/blog-constants";


interface BlogIndexClientProps {
  posts: BlogPost[];
  featuredPost: BlogPost | null;
  initialCategory?: PostCategory | "all";
}

export default function BlogIndexClient({
  posts,
  featuredPost,
  initialCategory = "all",
}: BlogIndexClientProps) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<PostCategory | "all">(
    initialCategory
  );

  const filtered = useMemo(() => {
    return posts.filter((p) => {
      const matchCat =
        activeCategory === "all" || p.category === activeCategory;
      const q = query.toLowerCase();
      const matchQuery =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q));
      return matchCat && matchQuery;
    });
  }, [posts, activeCategory, query]);

  // If no filter active and there's a featured post, show it separately
  const showFeatured =
    activeCategory === "all" && !query && featuredPost;

  const listPosts = showFeatured
    ? filtered.filter((p) => p.slug !== featuredPost?.slug)
    : filtered;

  return (
    <>
      {/* Search + Category Filter */}
      <div className="flex flex-col gap-4 mb-10">
        {/* Search input */}
        <div className="relative max-w-md">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search articles…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-full border border-gray-200 bg-white py-2.5 pl-9 pr-4 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#af601a]/40"
          />
        </div>

        {/* Category pills — horizontal scroll on mobile */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
          {ALL_CATEGORIES.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setActiveCategory(value)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
                activeCategory === value
                  ? "bg-[#af601a] text-white"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-[#af601a] hover:text-[#af601a]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Featured post */}
      {showFeatured && (
        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#af601a] mb-4">
            Featured
          </p>
          <BlogCard post={featuredPost} featured />
        </div>
      )}

      {/* Post grid */}
      {listPosts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {listPosts.map((post) => (
            <BlogCard key={post.slug} post={post} />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center text-gray-400">
          <p className="text-lg">No articles found.</p>
          <button
            onClick={() => {
              setQuery("");
              setActiveCategory("all");
            }}
            className="mt-4 text-sm text-[#af601a] hover:underline cursor-pointer"
          >
            Clear filters
          </button>
        </div>
      )}
    </>
  );
}
