import Link from "next/link";
import BlogCard from "./BlogCard";
import type { BlogPost } from "@/types/blog";

interface RelatedPostsProps {
  posts: BlogPost[];
  category: string;
}

export default function RelatedPosts({ posts, category }: RelatedPostsProps) {
  if (posts.length === 0) return null;

  return (
    <section className="mt-16 pt-10 border-t border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">More {category} posts</h2>
        <Link
          href={`/blog/category/${category}`}
          className="text-sm text-[#af601a] hover:underline font-medium"
        >
          View all →
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => (
          <BlogCard key={post.slug} post={post} />
        ))}
      </div>
    </section>
  );
}
