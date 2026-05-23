import Link from "next/link";
import Image from "next/image";
import { Calendar, Clock } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { CATEGORY_GRADIENTS, CATEGORY_LABELS } from "@/lib/blog-constants";
import type { BlogPost } from "@/types/blog";
import { cn } from "@/lib/utils";

interface BlogCardProps {
  post: BlogPost;
  featured?: boolean;
}

export default function BlogCard({ post, featured = false }: BlogCardProps) {
  const gradient = CATEGORY_GRADIENTS[post.category];
  const hasCover = Boolean(post.coverImage);

  if (featured) {
    return (
      <Link
        href={`/blog/${post.slug}`}
        className="group block rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow bg-white"
      >
        {/* Cover */}
        <div className={cn("relative h-72 w-full bg-gradient-to-br", gradient)}>
          {hasCover && (
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

          {/* Category + Reading time over image */}
          <div className="absolute bottom-4 left-4 flex items-center gap-2">
            <Badge>{CATEGORY_LABELS[post.category]}</Badge>
            <span className="text-white/80 text-xs flex items-center gap-1">
              <Clock size={12} />
              {post.readingTime}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-xs text-gray-500 flex items-center gap-1.5 mb-3">
            <Calendar size={12} />
            {format(new Date(post.publishedAt), "dd MMMM yyyy")}
          </p>
          <h2 className="text-2xl font-bold text-gray-900 leading-tight mb-3 group-hover:text-[#af601a] transition-colors line-clamp-2">
            {post.title}
          </h2>
          <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
            {post.excerpt}
          </p>
          <p className="mt-4 text-sm font-semibold text-[#af601a]">
            Read more →
          </p>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex flex-col rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white border border-gray-100"
    >
      {/* Cover thumbnail */}
      <div className={cn("relative h-44 w-full bg-gradient-to-br", gradient)}>
        {hasCover && (
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <div className="absolute bottom-3 left-3">
          <Badge>{CATEGORY_LABELS[post.category]}</Badge>
        </div>
      </div>

      {/* Text */}
      <div className="flex flex-col flex-1 p-4">
        <p className="text-xs text-gray-400 flex items-center gap-1 mb-2">
          <Calendar size={11} />
          {format(new Date(post.publishedAt), "dd MMM yyyy")}
          <span className="mx-1">·</span>
          <Clock size={11} />
          {post.readingTime}
        </p>
        <h3 className="text-base font-bold text-gray-900 leading-snug group-hover:text-[#af601a] transition-colors line-clamp-2 flex-1">
          {post.title}
        </h3>
        <p className="mt-2 text-sm text-gray-500 line-clamp-2 leading-relaxed">
          {post.excerpt}
        </p>
        {post.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {post.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[11px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
