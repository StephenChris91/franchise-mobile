export type PostCategory =
  | "sermon"
  | "devotional"
  | "announcement"
  | "testimony"
  | "teaching";

export interface PostFrontmatter {
  title: string;
  slug: string;
  excerpt: string;
  author: string; // matches a username in profiles
  publishedAt: string; // ISO date string
  coverImage: string; // Cloudinary URL or local path (empty = gradient fallback)
  category: PostCategory;
  tags: string[];
  featured: boolean;
}

export interface BlogPost extends PostFrontmatter {
  id: string; // DB primary key — used for admin edit links
  readingTime: string; // e.g. "5 min read"
  wordCount: number;
}

export type ReactionType = "like" | "amen" | "praying";

export interface ReactionCount {
  reactionType: ReactionType;
  count: number;
}

export interface CommentWithAuthor {
  id: string;
  postSlug: string;
  userId: string;
  parentId: string | null;
  content: string;
  isHidden: boolean;
  isEdited: boolean;
  createdAt: Date;
  updatedAt: Date;
  authorName: string | null;
  authorUsername: string | null;
  authorPhoto: string | null;
}
