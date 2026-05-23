import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { Calendar, Clock, Eye, User } from "lucide-react";
import { compileMDX } from "next-mdx-remote/rsc";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import remarkGfm from "remark-gfm";
import { and, eq, desc, count, sql } from "drizzle-orm";

import { auth } from "../../../../auth";
import { db, postViews, postReactions, postComments, profiles } from "../../../../db";
import {
  getAllPosts,
  getPostBySlug,
  getRelatedPosts,
  CATEGORY_GRADIENTS,
  CATEGORY_LABELS,
} from "@/lib/blog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import ReactionBar from "@/components/blog/ReactionBar";
import StickyReactionBar from "@/components/blog/StickyReactionBar";
import ShareBar from "@/components/blog/ShareBar";
import CommentSection from "@/components/blog/CommentSection";
import RelatedPosts from "@/components/blog/RelatedPosts";
import ViewTracker from "@/components/blog/ViewTracker";
import type { ReactionCount, ReactionType, CommentWithAuthor } from "@/types/blog";
import { cn } from "@/lib/utils";

interface Props {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  try {
    const posts = await getAllPosts();
    return posts.map((post) => ({ slug: post.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const result = await getPostBySlug(slug);
  if (!result) return { title: "Post not found" };

  const { post } = result;
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://thefranchiselagos.com.ng";
  const postUrl = `${appUrl}/blog/${slug}`;

  return {
    title: `${post.title} | Franchise Church`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url: postUrl,
      type: "article",
      publishedTime: post.publishedAt,
      images: post.coverImage ? [{ url: post.coverImage }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: post.coverImage ? [post.coverImage] : [],
    },
    alternates: { canonical: postUrl },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;

  const result = await getPostBySlug(slug);
  if (!result) notFound();
  const { post, source } = result;

  // Auth
  const session = await auth();
  const userId = session?.user?.id;
  const isLoggedIn = Boolean(session?.user);
  const isApproved = session?.user?.approvalStatus === "approved";

  // Compile MDX
  const { content } = await compileMDX({
    source,
    options: {
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [
          rehypeSlug,
          [rehypeAutolinkHeadings, { behavior: "wrap" }],
        ],
      },
    },
  });

  // View count
  const viewResult = await db
    .select({ count: count() })
    .from(postViews)
    .where(eq(postViews.postSlug, slug));
  const viewCount = viewResult[0]?.count ?? 0;

  // Reaction counts
  const reactionRows = await db
    .select({
      reactionType: postReactions.reactionType,
      count: sql<number>`count(*)::int`,
    })
    .from(postReactions)
    .where(eq(postReactions.postSlug, slug))
    .groupBy(postReactions.reactionType);

  const reactionCounts: ReactionCount[] = reactionRows.map((r) => ({
    reactionType: r.reactionType as ReactionType,
    count: r.count,
  }));

  // Current user's reactions
  const userReactionRows = userId
    ? await db
        .select({ reactionType: postReactions.reactionType })
        .from(postReactions)
        .where(
          and(
            eq(postReactions.postSlug, slug),
            eq(postReactions.userId, userId)
          )
        )
    : [];
  const userReactions = userReactionRows.map(
    (r) => r.reactionType as ReactionType
  );

  // Comments (with author profile)
  const commentRows = await db
    .select({
      id: postComments.id,
      postSlug: postComments.postSlug,
      userId: postComments.userId,
      parentId: postComments.parentId,
      content: postComments.content,
      isHidden: postComments.isHidden,
      isEdited: postComments.isEdited,
      createdAt: postComments.createdAt,
      updatedAt: postComments.updatedAt,
      authorName: profiles.fullName,
      authorUsername: profiles.username,
      authorPhoto: profiles.photoUrl,
    })
    .from(postComments)
    .leftJoin(profiles, eq(postComments.userId, profiles.userId))
    .where(
      and(
        eq(postComments.postSlug, slug),
        eq(postComments.isHidden, false)
      )
    )
    .orderBy(desc(postComments.createdAt));

  const comments: CommentWithAuthor[] = commentRows as CommentWithAuthor[];

  // Related posts
  const relatedPosts = await getRelatedPosts(slug, post.category, 3);

  const gradient = CATEGORY_GRADIENTS[post.category];
  const hasCover = Boolean(post.coverImage);
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://thefranchiselagos.com.ng";
  const postUrl = `${appUrl}/blog/${slug}`;

  // JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.publishedAt,
    author: { "@type": "Person", name: post.author },
    publisher: {
      "@type": "Organization",
      name: "Franchise Church",
      url: appUrl,
    },
    url: postUrl,
    ...(post.coverImage && { image: post.coverImage }),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* View tracker (client) */}
      <ViewTracker slug={slug} />

      {/* Sticky mobile reaction bar */}
      <StickyReactionBar
        slug={slug}
        counts={reactionCounts}
        userReactions={userReactions}
        isLoggedIn={isLoggedIn}
        isApproved={isApproved}
      />

      <article className="min-h-screen bg-white pb-24 md:pb-0">
        {/* Hero */}
        <div
          className={cn(
            "relative w-full h-72 md:h-96 bg-gradient-to-br",
            gradient
          )}
        >
          {hasCover && (
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              priority
              className="object-cover"
              sizes="100vw"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

          {/* Category badge */}
          <div className="absolute top-6 left-6">
            <Badge>{CATEGORY_LABELS[post.category]}</Badge>
          </div>

          {/* Meta over image */}
          <div className="absolute bottom-0 left-0 right-0 px-6 pb-8 md:px-12">
            <div className="max-w-3xl mx-auto">
              <h1 className="text-2xl md:text-4xl font-bold text-white leading-tight mb-3">
                {post.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-white/70 text-sm">
                <span className="flex items-center gap-1.5">
                  <User size={13} />
                  {post.author}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar size={13} />
                  {format(new Date(post.publishedAt), "dd MMMM yyyy")}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock size={13} />
                  {post.readingTime}
                </span>
                <span className="flex items-center gap-1.5">
                  <Eye size={13} />
                  {viewCount} {viewCount === 1 ? "view" : "views"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="max-w-3xl mx-auto px-6 py-10">
          {/* Excerpt */}
          <p className="text-lg text-gray-600 leading-relaxed mb-8 border-l-4 border-[#af601a] pl-4 italic">
            {post.excerpt}
          </p>

          {/* MDX content */}
          <div className="prose prose-lg max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-p:text-gray-700 prose-p:leading-relaxed prose-a:text-[#af601a] prose-a:no-underline hover:prose-a:underline prose-blockquote:border-[#af601a] prose-blockquote:bg-amber-50 prose-blockquote:py-1 prose-strong:text-gray-900 prose-li:text-gray-700 prose-hr:border-gray-200 prose-table:text-sm">
            {content}
          </div>

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="mt-10 flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-3 py-1 bg-gray-100 text-gray-500 rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <Separator className="my-10" />

          {/* Reactions */}
          <div className="mb-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
              React to this post
            </p>
            <ReactionBar
              slug={slug}
              counts={reactionCounts}
              userReactions={userReactions}
              isLoggedIn={isLoggedIn}
              isApproved={isApproved}
            />
          </div>

          {/* Share */}
          <ShareBar title={post.title} url={postUrl} />

          <Separator className="my-10" />

          {/* Comments */}
          <CommentSection
            slug={slug}
            comments={comments}
            currentUserId={userId}
            currentUserRole={session?.user?.role}
            currentApprovalStatus={session?.user?.approvalStatus}
            isLoggedIn={isLoggedIn}
          />

          {/* Related posts */}
          <RelatedPosts posts={relatedPosts} category={CATEGORY_LABELS[post.category]} />
        </div>
      </article>
    </>
  );
}
