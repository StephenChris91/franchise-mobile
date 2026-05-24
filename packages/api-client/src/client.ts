import type {
  LoginResponse, SignupResponse, RefreshResponse, AuthUser, ProfileResponse,
  CloudinarySignResponse, PostResponse, CommentResponse, GroupResponse, GroupMemberResponse,
  EventResponse, BlogPostResponse, BlogPostDetailResponse, NotificationResponse,
  MemberResponse, PaginatedResponse, SearchResponse, AppVersionResponse,
} from "@franchise/types";
import type { LoginInput, SignupInput } from "@franchise/validators";

export interface FranchiseAPIConfig {
  baseUrl: string;
  /** Return the current access token (called on every authenticated request) */
  getToken: () => Promise<string | null>;
  /**
   * Return the current refresh token.
   * On web, falls back to localStorage if omitted.
   * Required for React Native.
   */
  getRefreshToken?: () => Promise<string | null>;
  /**
   * Called after a successful token rotation with the new token pair.
   * Use this to persist the new tokens (SecureStore, localStorage, etc.).
   */
  onTokensRefreshed?: (accessToken: string, refreshToken: string) => void | Promise<void>;
  /** Called when authentication fails and cannot be recovered (logout the user). */
  onUnauthorized: () => void;
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  signal?: AbortSignal;
  skipAuth?: boolean;
};

export class FranchiseAPI {
  private config: FranchiseAPIConfig;
  private refreshPromise: Promise<string | null> | null = null;

  constructor(config: FranchiseAPIConfig) {
    this.config = config;
  }

  private async request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
    const { method = "GET", body, signal, skipAuth = false } = opts;
    const headers: Record<string, string> = { "Content-Type": "application/json" };

    if (!skipAuth) {
      const token = await this.config.getToken();
      if (token) headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${this.config.baseUrl}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });

    if (res.status === 401 && !skipAuth) {
      const newToken = await this.refreshOnce();
      if (!newToken) { this.config.onUnauthorized(); throw new Error("Unauthorized"); }

      const retryRes = await fetch(`${this.config.baseUrl}${path}`, {
        method,
        headers: { ...headers, Authorization: `Bearer ${newToken}` },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal,
      });
      if (retryRes.status === 401) { this.config.onUnauthorized(); throw new Error("Unauthorized"); }
      return this.parseResponse<T>(retryRes);
    }

    return this.parseResponse<T>(res);
  }

  private async parseResponse<T>(res: Response): Promise<T> {
    const json = (await res.json()) as { data?: T; error?: { code: string; message: string } };
    if (!res.ok) throw Object.assign(new Error(json.error?.message ?? "Request failed"), { code: json.error?.code, status: res.status });
    return json.data as T;
  }

  private async refreshOnce(): Promise<string | null> {
    if (this.refreshPromise) return this.refreshPromise;

    this.refreshPromise = (async () => {
      try {
        // Prefer the callback (React Native), fall back to localStorage (web)
        let storedRefresh: string | null = null;
        if (this.config.getRefreshToken) {
          storedRefresh = await this.config.getRefreshToken();
        } else if (
          typeof window !== "undefined" &&
          typeof (window as Window & typeof globalThis & { localStorage?: Storage }).localStorage !== "undefined"
        ) {
          storedRefresh = localStorage.getItem("franchise_refresh_token");
        }

        if (!storedRefresh) return null;

        const res = await fetch(`${this.config.baseUrl}/api/v1/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: storedRefresh }),
        });
        if (!res.ok) return null;

        const data = (await res.json()) as { data: RefreshResponse };
        const { accessToken, refreshToken } = data.data;

        // Persist the new token pair
        if (this.config.onTokensRefreshed) {
          await this.config.onTokensRefreshed(accessToken, refreshToken);
        } else if (
          typeof window !== "undefined" &&
          typeof (window as Window & typeof globalThis & { localStorage?: Storage }).localStorage !== "undefined"
        ) {
          localStorage.setItem("franchise_refresh_token", refreshToken);
        }

        return accessToken;
      } catch {
        return null;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  // ─── Auth ──────────────────────────────────────────────────────────────────

  auth = {
    login: (input: LoginInput) =>
      this.request<LoginResponse>("/api/v1/auth/login", { method: "POST", body: input, skipAuth: true }),

    signup: (input: SignupInput) =>
      this.request<SignupResponse>("/api/v1/auth/signup", { method: "POST", body: input, skipAuth: true }),

    refresh: (refreshToken: string) =>
      this.request<RefreshResponse>("/api/v1/auth/refresh", { method: "POST", body: { refreshToken }, skipAuth: true }),

    logout: (refreshToken: string) =>
      this.request<{ message: string }>("/api/v1/auth/logout", { method: "POST", body: { refreshToken } }),

    forgotPassword: (email: string) =>
      this.request<{ message: string }>("/api/v1/auth/forgot-password", { method: "POST", body: { email }, skipAuth: true }),

    resetPassword: (token: string, password: string, confirmPassword: string) =>
      this.request<{ message: string }>("/api/v1/auth/reset-password", { method: "POST", body: { token, password, confirmPassword }, skipAuth: true }),

    me: (signal?: AbortSignal) =>
      this.request<AuthUser>("/api/v1/auth/me", { signal }),
  };

  // ─── Profile ───────────────────────────────────────────────────────────────

  profile = {
    me: (signal?: AbortSignal) =>
      this.request<ProfileResponse>("/api/v1/profile/me", { signal }),

    updateMe: (data: Partial<ProfileResponse>, signal?: AbortSignal) =>
      this.request<ProfileResponse>("/api/v1/profile/me", { method: "PATCH", body: data, signal }),

    get: (username: string, signal?: AbortSignal) =>
      this.request<ProfileResponse>(`/api/v1/profile/${username}`, { signal }),

    signUploadUrl: (paramsToSign: Record<string, unknown>) =>
      this.request<CloudinarySignResponse>("/api/v1/profile/upload-photo", { method: "POST", body: { paramsToSign } }),
  };

  // ─── Posts ─────────────────────────────────────────────────────────────────

  posts = {
    list: (params: { groupId?: string; cursor?: string; limit?: number; postType?: string } = {}, signal?: AbortSignal) => {
      const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])).toString();
      return this.request<PaginatedResponse<PostResponse>>(`/api/v1/posts${qs ? `?${qs}` : ""}`, { signal });
    },

    get: (id: string, signal?: AbortSignal) =>
      this.request<PostResponse>(`/api/v1/posts/${id}`, { signal }),

    create: (data: { content: string; postType: string; groupId?: string; mediaUrls?: string[] }) =>
      this.request<PostResponse>("/api/v1/posts", { method: "POST", body: data }),

    update: (id: string, content: string) =>
      this.request<{ ok: boolean }>(`/api/v1/posts/${id}`, { method: "PATCH", body: { content } }),

    delete: (id: string) =>
      this.request<{ ok: boolean }>(`/api/v1/posts/${id}`, { method: "DELETE" }),

    react: (id: string, type: "like" | "amen" | "praying" | "heart") =>
      this.request<{ ok: boolean; toggled: boolean }>(`/api/v1/posts/${id}/reactions`, { method: "POST", body: { type } }),

    unreact: (id: string, type: string) =>
      this.request<{ ok: boolean }>(`/api/v1/posts/${id}/reactions/${type}`, { method: "DELETE" }),

    comments: {
      list: (postId: string, signal?: AbortSignal) =>
        this.request<CommentResponse[]>(`/api/v1/posts/${postId}/comments`, { signal }),

      create: (postId: string, content: string, parentId?: string) =>
        this.request<CommentResponse>(`/api/v1/posts/${postId}/comments`, { method: "POST", body: { content, parentId } }),

      update: (commentId: string, content: string) =>
        this.request<{ ok: boolean }>(`/api/v1/comments/${commentId}`, { method: "PATCH", body: { content } }),

      delete: (commentId: string) =>
        this.request<{ ok: boolean }>(`/api/v1/comments/${commentId}`, { method: "DELETE" }),
    },

    report: (id: string, reason: string, notes?: string) =>
      this.request<{ ok: boolean }>(`/api/v1/posts/${id}/report`, { method: "POST", body: { reason, notes } }),
  };

  // ─── Prayer wall ───────────────────────────────────────────────────────────

  prayerWall = {
    list: (params: { cursor?: string; limit?: number } = {}, signal?: AbortSignal) => {
      const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])).toString();
      return this.request<PaginatedResponse<PostResponse>>(`/api/v1/prayer-wall${qs ? `?${qs}` : ""}`, { signal });
    },
  };

  // ─── Groups ────────────────────────────────────────────────────────────────

  groups = {
    list: (signal?: AbortSignal) =>
      this.request<GroupResponse[]>("/api/v1/groups", { signal }),

    get: (slug: string, signal?: AbortSignal) =>
      this.request<GroupResponse>(`/api/v1/groups/${slug}`, { signal }),

    join: (slug: string) =>
      this.request<{ ok: boolean }>(`/api/v1/groups/${slug}/join`, { method: "POST" }),

    leave: (slug: string) =>
      this.request<{ ok: boolean }>(`/api/v1/groups/${slug}/leave`, { method: "POST" }),

    members: (slug: string, signal?: AbortSignal) =>
      this.request<GroupMemberResponse[]>(`/api/v1/groups/${slug}/members`, { signal }),
  };

  // ─── Events ────────────────────────────────────────────────────────────────

  events = {
    list: (upcoming = false, signal?: AbortSignal) =>
      this.request<EventResponse[]>(`/api/v1/events${upcoming ? "?upcoming=true" : ""}`, { signal }),

    get: (slug: string, signal?: AbortSignal) =>
      this.request<EventResponse>(`/api/v1/events/${slug}`, { signal }),

    rsvp: (slug: string, data: { status: string; guestsCount?: number; notes?: string }) =>
      this.request<{ ok: boolean }>(`/api/v1/events/${slug}/rsvp`, { method: "POST", body: data }),

    cancelRsvp: (slug: string) =>
      this.request<{ ok: boolean }>(`/api/v1/events/${slug}/rsvp`, { method: "DELETE" }),
  };

  // ─── Blog ──────────────────────────────────────────────────────────────────

  blog = {
    list: (signal?: AbortSignal) =>
      this.request<BlogPostResponse[]>("/api/v1/blog/posts", { signal }),

    get: (slug: string, signal?: AbortSignal) =>
      this.request<BlogPostDetailResponse>(`/api/v1/blog/posts/${slug}`, { signal }),

    react: (slug: string, type: string) =>
      this.request<{ ok: boolean }>(`/api/v1/blog/posts/${slug}/reactions`, { method: "POST", body: { type } }),

    comments: {
      list: (slug: string, signal?: AbortSignal) =>
        this.request<CommentResponse[]>(`/api/v1/blog/posts/${slug}/comments`, { signal }),

      create: (slug: string, content: string, parentId?: string) =>
        this.request<CommentResponse>(`/api/v1/blog/posts/${slug}/comments`, { method: "POST", body: { content, parentId } }),
    },
  };

  // ─── Notifications ─────────────────────────────────────────────────────────

  notifications = {
    list: (params: { cursor?: string; limit?: number } = {}, signal?: AbortSignal) => {
      const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])).toString();
      return this.request<PaginatedResponse<NotificationResponse>>(`/api/v1/notifications${qs ? `?${qs}` : ""}`, { signal });
    },

    read: (id: string) =>
      this.request<{ ok: boolean }>(`/api/v1/notifications/${id}/read`, { method: "POST" }),

    readAll: () =>
      this.request<{ ok: boolean }>("/api/v1/notifications/read-all", { method: "POST" }),

    unreadCount: (signal?: AbortSignal) =>
      this.request<{ count: number }>("/api/v1/notifications/unread-count", { signal }),
  };

  // ─── Members ───────────────────────────────────────────────────────────────

  members = {
    list: (params: { search?: string; ministry?: string; cursor?: string; limit?: number } = {}, signal?: AbortSignal) => {
      const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])).toString();
      return this.request<MemberResponse[]>(`/api/v1/members${qs ? `?${qs}` : ""}`, { signal });
    },

    get: (username: string, signal?: AbortSignal) =>
      this.request<MemberResponse>(`/api/v1/members/${username}`, { signal }),
  };

  // ─── Push tokens ───────────────────────────────────────────────────────────

  pushTokens = {
    register: (token: string, platform: "ios" | "android", deviceName?: string) =>
      this.request<{ ok: boolean }>("/api/v1/push-tokens", { method: "POST", body: { token, platform, deviceName } }),

    unregister: (token: string) =>
      this.request<{ ok: boolean }>(`/api/v1/push-tokens/${token}`, { method: "DELETE" }),
  };

  // ─── Search ────────────────────────────────────────────────────────────────

  search = {
    query: (q: string, type?: "all" | "posts" | "events" | "groups" | "members", signal?: AbortSignal) => {
      const qs = new URLSearchParams({ q, ...(type && type !== "all" ? { type } : {}) }).toString();
      return this.request<SearchResponse>(`/api/v1/search?${qs}`, { signal });
    },
  };

  // ─── App ───────────────────────────────────────────────────────────────────

  app = {
    version: (clientVersion?: string, signal?: AbortSignal) => {
      const qs = clientVersion ? `?v=${encodeURIComponent(clientVersion)}` : "";
      return this.request<AppVersionResponse>(`/api/v1/app/version${qs}`, { signal, skipAuth: true });
    },
  };

  // ─── Contact ───────────────────────────────────────────────────────────────

  contact = {
    pastor: (subject: string, message: string) =>
      this.request<{ ok: boolean }>("/api/v1/contact/pastor", { method: "POST", body: { subject, message } }),
  };
}
