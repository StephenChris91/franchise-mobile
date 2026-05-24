/**
 * Centralised TanStack Query key factory.
 * Every query key in the app lives here so invalidation is consistent.
 */
export const queryKeys = {
  // ── Posts ────────────────────────────────────────────────────────────────
  posts: {
    all: ["posts"] as const,
    list: (params?: { groupId?: string; postType?: string }) =>
      [...queryKeys.posts.all, "list", params ?? {}] as const,
    detail: (id: string) =>
      [...queryKeys.posts.all, "detail", id] as const,
    comments: (postId: string) =>
      [...queryKeys.posts.all, "comments", postId] as const,
  },

  // ── Prayer wall ──────────────────────────────────────────────────────────
  prayerWall: {
    all: ["prayerWall"] as const,
    list: () => [...queryKeys.prayerWall.all, "list"] as const,
  },

  // ── Groups ───────────────────────────────────────────────────────────────
  groups: {
    all: ["groups"] as const,
    list: () => [...queryKeys.groups.all, "list"] as const,
    detail: (slug: string) =>
      [...queryKeys.groups.all, "detail", slug] as const,
    members: (slug: string) =>
      [...queryKeys.groups.all, "members", slug] as const,
  },

  // ── Members ──────────────────────────────────────────────────────────────
  members: {
    all: ["members"] as const,
    list: (params?: { search?: string; ministry?: string }) =>
      [...queryKeys.members.all, "list", params ?? {}] as const,
    detail: (username: string) =>
      [...queryKeys.members.all, "detail", username] as const,
  },

  // ── Profile ──────────────────────────────────────────────────────────────
  profile: {
    all: ["profile"] as const,
    me: () => [...queryKeys.profile.all, "me"] as const,
    user: (username: string) =>
      [...queryKeys.profile.all, "user", username] as const,
  },

  // ── Notifications ────────────────────────────────────────────────────────
  notifications: {
    all: ["notifications"] as const,
    list: () => [...queryKeys.notifications.all, "list"] as const,
    unreadCount: () => [...queryKeys.notifications.all, "unreadCount"] as const,
  },

  // ── Events ───────────────────────────────────────────────────────────────
  events: {
    all: ["events"] as const,
    list: (upcoming?: boolean) =>
      [...queryKeys.events.all, "list", upcoming ?? false] as const,
    detail: (slug: string) =>
      [...queryKeys.events.all, "detail", slug] as const,
  },

  // ── Search ───────────────────────────────────────────────────────────────
  search: {
    query: (q: string, type?: string) =>
      ["search", q, type ?? "all"] as const,
  },

  // ── App version ──────────────────────────────────────────────────────────
  appVersion: (clientVersion: string) =>
    ["app-version", clientVersion] as const,
} as const;
