// ⚠️ Client-safe: no fs/path imports — only plain data.
// Import constants from here in Client Components.
import type { PostCategory } from "@/types/blog";

export const CATEGORY_GRADIENTS: Record<PostCategory, string> = {
  sermon: "from-amber-900 via-orange-800 to-amber-700",
  teaching: "from-blue-900 via-blue-800 to-indigo-700",
  devotional: "from-purple-900 via-violet-800 to-purple-700",
  announcement: "from-teal-900 via-emerald-800 to-teal-700",
  testimony: "from-rose-900 via-pink-800 to-rose-700",
};

export const CATEGORY_LABELS: Record<PostCategory, string> = {
  sermon: "Sermon",
  teaching: "Teaching",
  devotional: "Devotional",
  announcement: "Announcement",
  testimony: "Testimony",
};

export const ALL_CATEGORIES: Array<{ value: "all" | PostCategory; label: string }> = [
  { value: "all", label: "All" },
  { value: "sermon", label: "Sermons" },
  { value: "teaching", label: "Teachings" },
  { value: "devotional", label: "Devotionals" },
  { value: "announcement", label: "Announcements" },
  { value: "testimony", label: "Testimonies" },
];
