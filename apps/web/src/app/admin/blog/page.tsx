import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { Plus, Pencil, Eye, EyeOff, Star } from "lucide-react";
import DeletePostButton from "@/components/blog/DeletePostButton";
import { auth } from "../../../../auth";
import { getAllPostsAdmin } from "@/lib/blog";
import { togglePublished, setFeatured } from "@/lib/actions/admin-blog";
import { seedSamplePosts } from "@/lib/actions/seed-blog";
import { Badge } from "@/components/ui/badge";
import { CATEGORY_LABELS } from "@/lib/blog-constants";

export const dynamic = "force-dynamic";

export default async function AdminBlogPage() {
  const session = await auth();
  const role = session?.user?.role;

  if (role !== "admin" && role !== "pastor") notFound();

  const posts = await getAllPostsAdmin();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Blog Posts</h1>
            <p className="text-sm text-gray-500 mt-1">
              {posts.length} posts · {posts.filter((p) => p.isPublished).length} published
            </p>
          </div>
          <Link
            href="/admin/blog/new"
            className="flex items-center gap-2 rounded-lg bg-[#af601a] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#c47020] transition-colors"
          >
            <Plus size={16} />
            New Post
          </Link>
        </div>

        {/* Posts table */}
        {posts.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white px-8 py-16 text-center">
            <p className="text-gray-500 mb-2">No posts yet.</p>
            <p className="text-sm text-gray-400 mb-6">
              Start fresh or load the 3 sample posts to see the blog in action.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/admin/blog/new"
                className="inline-flex items-center gap-2 rounded-lg bg-[#af601a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#c47020] transition-colors"
              >
                <Plus size={14} />
                Write your first post
              </Link>
              <form
                action={async () => {
                  "use server";
                  await seedSamplePosts();
                }}
              >
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:border-[#af601a] hover:text-[#af601a] transition-colors cursor-pointer"
                >
                  Load sample posts
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Title</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 hidden md:table-cell">Category</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 hidden lg:table-cell">Date</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {posts.map((post) => (
                  <tr key={post.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900 line-clamp-1">{post.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">/{post.slug}</p>
                      </div>
                      {post.featured && (
                        <span className="inline-flex items-center gap-1 text-xs text-[#af601a] mt-1">
                          <Star size={10} fill="currentColor" /> Featured
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <Badge variant="secondary">
                        {CATEGORY_LABELS[post.category as keyof typeof CATEGORY_LABELS]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">
                      {format(new Date(post.createdAt), "dd MMM yyyy")}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                          post.isPublished
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {post.isPublished ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {/* Edit */}
                        <Link
                          href={`/admin/blog/${post.id}/edit`}
                          className="rounded p-1.5 text-gray-400 hover:text-[#af601a] hover:bg-orange-50 transition-colors"
                          title="Edit"
                        >
                          <Pencil size={15} />
                        </Link>

                        {/* Toggle published */}
                        <form
                          action={async () => {
                            "use server";
                            await togglePublished(post.id, post.isPublished);
                          }}
                        >
                          <button
                            type="submit"
                            className="rounded p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                            title={post.isPublished ? "Unpublish" : "Publish"}
                          >
                            {post.isPublished ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                        </form>

                        {/* Set featured */}
                        {!post.featured && post.isPublished && (
                          <form
                            action={async () => {
                              "use server";
                              await setFeatured(post.id);
                            }}
                          >
                            <button
                              type="submit"
                              className="rounded p-1.5 text-gray-400 hover:text-amber-500 hover:bg-amber-50 transition-colors cursor-pointer"
                              title="Set as featured"
                            >
                              <Star size={15} />
                            </button>
                          </form>
                        )}

                        {/* Delete */}
                        <DeletePostButton id={post.id} title={post.title} />

                        {/* Preview */}
                        {post.isPublished && (
                          <Link
                            href={`/blog/${post.slug}`}
                            target="_blank"
                            className="rounded p-1.5 text-gray-400 hover:text-gray-700 transition-colors"
                            title="View live"
                          >
                            <Eye size={15} />
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
