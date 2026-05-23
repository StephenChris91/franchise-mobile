// Shared API request/response types used by both the web app and the api-client.

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

// ─── API envelope ─────────────────────────────────────────────────────────────

export interface ApiSuccess<T> {
  data: T;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  username: string;
  fullName: string;
  photoUrl: string | null;
  role: "member" | "group_leader" | "admin" | "pastor";
  approvalStatus: "pending" | "approved" | "rejected" | "suspended";
  ministry: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface SignupResponse {
  message: string;
  user: { id: string; email: string; username: string };
}

export interface RefreshResponse {
  accessToken: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  approvalStatus: string;
  username: string;
  iat: number;
  exp: number;
}

// ─── Profile ──────────────────────────────────────────────────────────────────

export interface ProfileResponse {
  userId: string;
  username: string;
  fullName: string;
  photoUrl: string | null;
  bio: string | null;
  ministry: string;
  phone: string | null;
  whatsappNumber: string | null;
  role: string;
  approvalStatus: string;
  createdAt: string;
}

export interface CloudinarySignResponse {
  signature: string;
  apiKey: string;
  cloudName: string;
  timestamp: number;
  folder: string;
}

// ─── Social posts ─────────────────────────────────────────────────────────────

export interface PostAuthor {
  userId: string;
  username: string;
  fullName: string;
  photoUrl: string | null;
}

export interface PostGroup {
  id: string;
  name: string;
  slug: string;
}

export interface ReactionCounts {
  like: number;
  amen: number;
  praying: number;
  heart: number;
}

export interface PostResponse {
  id: string;
  content: string;
  postType: "regular" | "prayer" | "announcement" | "testimony";
  mediaUrls: string[];
  isPinned: boolean;
  reactionCount: number;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
  author: PostAuthor;
  group: PostGroup | null;
  reactionCounts: ReactionCounts;
  userReactions: string[];
}

export interface CommentResponse {
  id: string;
  content: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  author: PostAuthor;
}

// ─── Groups ───────────────────────────────────────────────────────────────────

export interface GroupResponse {
  id: string;
  slug: string;
  name: string;
  description: string;
  groupType: string;
  visibility: string;
  coverImageUrl: string;
  memberCount: number;
  createdAt: string;
  isMember?: boolean;
  userRole?: string | null;
}

export interface GroupMemberResponse {
  userId: string;
  role: string;
  joinedAt: string;
  profile: {
    username: string;
    fullName: string;
    photoUrl: string | null;
  };
}

// ─── Events ───────────────────────────────────────────────────────────────────

export interface EventResponse {
  id: string;
  slug: string;
  title: string;
  description: string;
  coverImageUrl: string | null;
  eventType: string;
  location: string;
  locationUrl: string | null;
  startsAt: string;
  endsAt: string;
  capacity: number | null;
  rsvpRequired: boolean;
  createdAt: string;
  rsvpCounts?: { going: number; interested: number };
  userRsvp?: { status: string; guestsCount: number } | null;
}

// ─── Blog ─────────────────────────────────────────────────────────────────────

export interface BlogPostResponse {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  author: string;
  coverImage: string;
  category: string;
  tags: string[];
  featured: boolean;
  publishedAt: string;
  readingTime: string;
  wordCount: number;
}

export interface BlogPostDetailResponse extends BlogPostResponse {
  content: string;
}

// ─── Notifications ────────────────────────────────────────────────────────────

export interface NotificationResponse {
  id: string;
  notificationType: string;
  entityType: string;
  entityId: string;
  isRead: boolean;
  createdAt: string;
  actorId: string | null;
  actorName: string | undefined;
}

// ─── Members ─────────────────────────────────────────────────────────────────

export interface MemberResponse {
  userId: string;
  username: string;
  fullName: string;
  photoUrl: string | null;
  ministry: string;
  bio: string | null;
}
