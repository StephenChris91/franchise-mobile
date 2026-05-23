import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { auth } from "../../../../../../auth";
import { getPostByIdAdmin } from "@/lib/blog";
import { updatePost } from "@/lib/actions/admin-blog";
import PostForm from "@/components/blog/PostForm";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditPostPage({ params }: Props) {
  const { id } = await params;

  const session = await auth();
  const role = session?.user?.role;
  if (role !== "admin" && role !== "pastor") notFound();

  const post = await getPostByIdAdmin(id);
  if (!post) notFound();

  const initialData = {
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    author: post.author,
    coverImage: post.coverImage,
    category: post.category,
    tags: post.tags,
    content: post.content,
    featured: post.featured,
    isPublished: post.isPublished,
  };

  const updateWithId = updatePost.bind(null, id);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link
          href="/admin/blog"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-8 transition-colors"
        >
          <ChevronLeft size={15} />
          Back to posts
        </Link>

        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <h1 className="text-xl font-bold text-gray-900 mb-1">Edit Post</h1>
          <p className="text-sm text-gray-500 mb-6">/{post.slug}</p>
          <PostForm
            initialData={initialData}
            onSubmit={updateWithId}
            submitLabel="Save changes"
          />
        </div>
      </div>
    </div>
  );
}
