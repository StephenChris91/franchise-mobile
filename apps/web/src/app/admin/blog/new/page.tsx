import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { auth } from "../../../../../auth";
import { createPost } from "@/lib/actions/admin-blog";
import PostForm from "@/components/blog/PostForm";

export const dynamic = "force-dynamic";

export default async function NewPostPage() {
  const session = await auth();
  const role = session?.user?.role;
  if (role !== "admin" && role !== "pastor") notFound();

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
          <h1 className="text-xl font-bold text-gray-900 mb-6">New Post</h1>
          <PostForm onSubmit={createPost} submitLabel="Publish post" />
        </div>
      </div>
    </div>
  );
}
