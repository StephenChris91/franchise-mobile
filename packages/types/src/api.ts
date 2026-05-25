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
  refreshToken: string; // rotated — must be persisted after each refresh
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

// ─── Search ───────────────────────────────────────────────────────────────────

export interface SearchResultItem {
  type: "post" | "event" | "group" | "member";
  id: string;
  title: string;
  subtitle?: string;
  imageUrl?: string | null;
  slug?: string | null;
}

export interface SearchResponse {
  query: string;
  results: SearchResultItem[];
}

// ─── Live services ────────────────────────────────────────────────────────────

export type ServiceType = "sunday_youtube" | "wednesday_youtube" | "friday_zoom";
export type LivePlatform = "youtube" | "zoom";
export type LivestreamStatus = "scheduled" | "live" | "ended";
export type ChatReactionType = "amen" | "praying" | "love" | "fire" | "receiving";

export interface LivestreamScheduleItem {
  id: string;
  name: string;
  serviceType: ServiceType;
  platform: LivePlatform;
  status: LivestreamStatus;
  dayOfWeek: number;
  scheduledTime: string;          // "HH:MM" WAT
  durationMins: number;
  nextOccurrence: string;         // ISO — next scheduled datetime (WAT→UTC)
  youtubeVideoId: string | null;
  zoomMeetingId: string | null;
  zoomPasscode: string | null;
  replayUrl: string | null;
  startedAt: string | null;
  reminderActive: boolean;        // current user's reminder pref
}

export interface CommittedMember {
  userId: string;
  username: string;
  fullName: string;
  photoUrl: string | null;
}

export interface LivestreamDetailResponse extends LivestreamScheduleItem {
  prayerFocus: string | null;
  prayerVerse: string | null;
  commitmentCount: number;
  committedMembers: CommittedMember[]; // up to 5
  userCommitted: boolean;
}

export interface LiveChatMessageResponse {
  id: string;
  content: string;
  reactionType: ChatReactionType | null;
  isPinned: boolean;
  createdAt: string;
  author: {
    userId: string;
    username: string;
    fullName: string;
    photoUrl: string | null;
    role: string;
  };
}

export interface ServiceReminderResponse {
  serviceType: ServiceType;
  isActive: boolean;
  minutesBefore: number;
}

// ─── App version ──────────────────────────────────────────────────────────────

export interface AppVersionResponse {
  currentVersion: string;
  minimumVersion: string;
  clientVersion: string;
  updateAvailable: boolean;
  updateRequired: boolean;
  storeUrl: {
    ios: string;
    android: string;
  };
  message: string | null;
}
