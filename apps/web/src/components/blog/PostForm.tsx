"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { BlogPostFormData } from "@/lib/actions/admin-blog";

// Plain interface — no DB import needed in this client component
interface InitialPostData {
  title: string;
  slug: string;
  excerpt: string;
  author: string;
  coverImage: string;
  category: string;
  tags: string;
  content: string;
  featured: boolean;
  isPublished: boolean;
}

const CATEGORIES = [
  { value: "sermon", label: "Sermon" },
  { value: "teaching", label: "Teaching" },
  { value: "devotional", label: "Devotional" },
  { value: "announcement", label: "Announcement" },
  { value: "testimony", label: "Testimony" },
];

interface PostFormProps {
  initialData?: InitialPostData;
  onSubmit: (data: BlogPostFormData) => Promise<void>;
  submitLabel: string;
}

function slugify(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function PostForm({ initialData, onSubmit, submitLabel }: PostFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const [form, setForm] = useState<BlogPostFormData>({
    title: initialData?.title ?? "",
    slug: initialData?.slug ?? "",
    excerpt: initialData?.excerpt ?? "",
    author: initialData?.author ?? "Pastor Tosin Martins",
    coverImage: initialData?.coverImage ?? "",
    category: initialData?.category ?? "sermon",
    tags: initialData?.tags ?? "",
    content: initialData?.content ?? "",
    featured: initialData?.featured ?? false,
    isPublished: initialData?.isPublished ?? false,
  });

  const handleTitleChange = (title: string) => {
    setForm((prev) => ({
      ...prev,
      title,
      // Auto-fill slug only if user hasn't manually edited it
      slug: prev.slug === slugify(prev.title) || prev.slug === "" ? slugify(title) : prev.slug,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.title.trim()) { setError("Title is required"); return; }
    if (!form.slug.trim()) { setError("Slug is required"); return; }
    if (!form.content.trim()) { setError("Content is required"); return; }
    if (!form.category) { setError("Category is required"); return; }

    startTransition(async () => {
      try {
        await onSubmit(form);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  };

  const fieldClass = "rounded-sm border-gray-300 bg-gray-50 text-gray-900 focus-visible:ring-[#af601a]";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Title */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="title" className="text-gray-700">Title *</Label>
        <Input
          id="title"
          value={form.title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="e.g. Walking in the Spirit"
          required
          className={fieldClass}
        />
      </div>

      {/* Slug */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="slug" className="text-gray-700">
          Slug * <span className="text-xs font-normal text-gray-400">(URL: /blog/your-slug)</span>
        </Label>
        <Input
          id="slug"
          value={form.slug}
          onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
          placeholder="walking-in-the-spirit"
          required
          className={fieldClass}
        />
      </div>

      {/* Two columns: Category + Author */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="category" className="text-gray-700">Category *</Label>
          <select
            id="category"
            value={form.category}
            onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
            required
            className={`h-10 w-full rounded-sm border border-gray-300 bg-gray-50 px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#af601a]/40 ${fieldClass}`}
          >
            {CATEGORIES.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="author" className="text-gray-700">Author</Label>
          <Input
            id="author"
            value={form.author}
            onChange={(e) => setForm((p) => ({ ...p, author: e.target.value }))}
            placeholder="Pastor Tosin Martins"
            className={fieldClass}
          />
        </div>
      </div>

      {/* Excerpt */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="excerpt" className="text-gray-700">
          Excerpt <span className="text-xs font-normal text-gray-400">(shown on blog index and in SEO)</span>
        </Label>
        <Textarea
          id="excerpt"
          value={form.excerpt}
          onChange={(e) => setForm((p) => ({ ...p, excerpt: e.target.value }))}
          placeholder="A brief, compelling summary of this post (1-2 sentences)."
          rows={2}
          maxLength={300}
          className={`${fieldClass} resize-none`}
        />
        <p className="text-xs text-gray-400 text-right">{form.excerpt.length}/300</p>
      </div>

      {/* Cover Image */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="coverImage" className="text-gray-700">
          Cover Image URL <span className="text-xs font-normal text-gray-400">(Cloudinary URL — leave blank for gradient)</span>
        </Label>
        <Input
          id="coverImage"
          value={form.coverImage}
          onChange={(e) => setForm((p) => ({ ...p, coverImage: e.target.value }))}
          placeholder="https://res.cloudinary.com/your-cloud/image/upload/..."
          className={fieldClass}
        />
      </div>

      {/* Tags */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="tags" className="text-gray-700">
          Tags <span className="text-xs font-normal text-gray-400">(comma-separated)</span>
        </Label>
        <Input
          id="tags"
          value={form.tags}
          onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))}
          placeholder="e.g. faith, prayer, kingdom"
          className={fieldClass}
        />
      </div>

      {/* Content */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="content" className="text-gray-700">
          Content * <span className="text-xs font-normal text-gray-400">(Markdown supported — headings, bold, lists, blockquotes, tables)</span>
        </Label>
        <Textarea
          id="content"
          value={form.content}
          onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
          placeholder={`## Your Heading\n\nYour content here. You can use **bold**, *italic*, > blockquotes, and more.\n\n---\n\n## Another Section\n\nContinue writing...`}
          rows={20}
          className={`${fieldClass} font-mono text-xs`}
        />
        <p className="text-xs text-gray-400">
          {form.content.split(/\s+/).filter(Boolean).length} words
        </p>
      </div>

      {/* Checkboxes */}
      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.featured}
            onChange={(e) => setForm((p) => ({ ...p, featured: e.target.checked }))}
            className="h-4 w-4 rounded border-gray-300 text-[#af601a] focus:ring-[#af601a]"
          />
          <span className="text-sm text-gray-700">
            Featured post <span className="text-gray-400">(appears prominently on blog index)</span>
          </span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.isPublished}
            onChange={(e) => setForm((p) => ({ ...p, isPublished: e.target.checked }))}
            className="h-4 w-4 rounded border-gray-300 text-[#af601a] focus:ring-[#af601a]"
          />
          <span className="text-sm text-gray-700">
            Published <span className="text-gray-400">(uncheck to save as draft)</span>
          </span>
        </label>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex items-center gap-4">
        <Button type="submit" disabled={isPending} className="gap-2">
          {isPending ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Saving…
            </>
          ) : (
            submitLabel
          )}
        </Button>
        <a
          href="/admin/blog"
          className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}
