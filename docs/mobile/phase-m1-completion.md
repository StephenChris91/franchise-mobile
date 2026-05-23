# Phase M1 — Monorepo Migration & API Hardening: Completion Notes

## Overview

Converted the Franchise Church codebase into a Turborepo monorepo (`franchise-mobile` repo) with a complete typed JSON API at `/api/v1/*` designed for mobile app consumption. The existing web app at `https://thefranchiselagos.com.ng` remains untouched in the `franchise` repo.

---

## Monorepo Structure

```
franchise-mobile/
├── apps/
│   └── web/                   # Next.js 15 web app (@franchise/web)
├── packages/
│   ├── db/                    # @franchise/db  — Drizzle schema + client
│   ├── auth/                  # @franchise/auth — JWT sign/verify, refresh token lifecycle
│   ├── types/                 # @franchise/types — shared TypeScript types
│   ├── validators/            # @franchise/validators — Zod v4 schemas
│   ├── api-client/            # @franchise/api-client — FranchiseAPI typed client class
│   └── config/                # @franchise/config — shared tsconfig presets
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

---

## New Environment Variables Required

Add these to your Vercel project settings (in addition to all existing env vars):

| Variable | Purpose | How to generate |
|---|---|---|
| `JWT_SECRET` | Signs mobile API access/refresh tokens | `openssl rand -base64 32` |

All existing env vars (`DATABASE_URL`, `AUTH_SECRET`, `RESEND_API_KEY`, etc.) are unchanged.

---

## New Database Tables

Migration `0005_mobile_tokens.sql` adds:

### `refresh_tokens`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | auto |
| `user_id` | text FK → users | cascade delete |
| `token_hash` | text unique | SHA-256 hash of the raw token |
| `expires_at` | timestamp | 30 days from issue |
| `revoked` | boolean | set true on logout/rotation |
| `created_at` | timestamp | |

### `push_tokens`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | auto |
| `user_id` | text FK → users | cascade delete |
| `token` | text unique | Expo push token or FCM token |
| `platform` | text | `ios` / `android` |
| `created_at` | timestamp | |

**To apply the migration against your Neon database:**
```bash
# from packages/db
DATABASE_URL_UNPOOLED=<your-neon-unpooled-url> pnpm drizzle-kit migrate
```

---

## Mobile API Endpoints (`/api/v1/*`)

All endpoints return `{ success: true, data: ... }` on success or `{ success: false, error: { code, message } }` on failure.

Authentication: `Authorization: Bearer <accessToken>` header.

Pagination: cursor-based via `?cursor=<base64>` and `?limit=<n>`.

### Auth
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/auth/login` | none | Email+password → tokens |
| POST | `/api/v1/auth/signup` | none | Create account |
| POST | `/api/v1/auth/refresh` | none | Rotate refresh token |
| POST | `/api/v1/auth/logout` | ✓ | Revoke refresh token |
| POST | `/api/v1/auth/forgot-password` | none | Send reset email |
| POST | `/api/v1/auth/reset-password` | none | Consume reset token |
| GET  | `/api/v1/auth/me` | ✓ | Current user from JWT |

### Profile
| Method | Path | Auth | Description |
|---|---|---|---|
| GET/PATCH | `/api/v1/profile/me` | ✓ | Own profile read/update |
| GET | `/api/v1/profile/:username` | ✓ | Public profile |
| POST | `/api/v1/profile/upload-photo` | ✓ | Cloudinary signature |

### Social Posts
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/posts` | ✓ | Paginated feed |
| POST | `/api/v1/posts` | ✓ approved | Create post |
| GET/PATCH/DELETE | `/api/v1/posts/:id` | ✓ | Post CRUD |
| POST | `/api/v1/posts/:id/reactions` | ✓ approved | Toggle reaction |
| DELETE | `/api/v1/posts/:id/reactions/:type` | ✓ | Remove reaction |
| GET/POST | `/api/v1/posts/:id/comments` | ✓ | Comments |
| PATCH/DELETE | `/api/v1/comments/:id` | ✓ | Edit/delete comment |
| POST | `/api/v1/posts/:id/report` | ✓ | Report content |
| GET | `/api/v1/prayer-wall` | ✓ | Prayer posts only |

### Groups
| Method | Path | Auth |
|---|---|---|
| GET | `/api/v1/groups` | ✓ |
| GET | `/api/v1/groups/:slug` | ✓ |
| POST | `/api/v1/groups/:slug/join` | ✓ approved |
| POST | `/api/v1/groups/:slug/leave` | ✓ |
| GET | `/api/v1/groups/:slug/members` | ✓ |

### Events
| Method | Path | Auth |
|---|---|---|
| GET | `/api/v1/events` | ✓ |
| GET | `/api/v1/events/:slug` | ✓ |
| POST | `/api/v1/events/:slug/rsvp` | ✓ approved |
| DELETE | `/api/v1/events/:slug/rsvp` | ✓ |

### Blog
| Method | Path | Auth |
|---|---|---|
| GET | `/api/v1/blog/posts` | none |
| GET | `/api/v1/blog/posts/:slug` | none |
| POST | `/api/v1/blog/posts/:slug/reactions` | ✓ |
| GET/POST | `/api/v1/blog/posts/:slug/comments` | none / ✓ |

### Notifications
| Method | Path |
|---|---|
| GET | `/api/v1/notifications` |
| POST | `/api/v1/notifications/:id/read` |
| POST | `/api/v1/notifications/read-all` |
| GET | `/api/v1/notifications/unread-count` |

### Members
| Method | Path |
|---|---|
| GET | `/api/v1/members` |
| GET | `/api/v1/members/:username` |

### Push & Realtime
| Method | Path | Description |
|---|---|---|
| POST | `/api/v1/push-tokens` | Register device push token |
| DELETE | `/api/v1/push-tokens/:token` | Unregister token |
| POST | `/api/v1/pusher/auth` | Pusher private channel auth via JWT |

---

## JWT Token Design

- **Access token**: HS256, 15-minute TTL, payload: `{ sub, email, role, approvalStatus }`
- **Refresh token**: HS256, 30-day TTL, stored as SHA-256 hash in `refresh_tokens` table
- **Rotation**: old refresh token is revoked on each `/auth/refresh` call; new pair issued
- **Secret**: `JWT_SECRET` env var (separate from `AUTH_SECRET` used by Auth.js)

---

## FranchiseAPI Client (`@franchise/api-client`)

```ts
import { FranchiseAPI } from "@franchise/api-client";

const api = new FranchiseAPI({
  baseUrl: "https://thefranchiselagos.com.ng",
  // Optionally: accessToken, onTokenRefreshed, onAuthFailure
});

// Tokens set after login:
api.setTokens(accessToken, refreshToken);

// Auto-refreshes on 401 — transparent to the caller:
const feed = await api.posts.list({ limit: 20 });
const me = await api.profile.getMe();
```

---

## Vercel Configuration

Update the Vercel project for `franchise-mobile`:

1. **Root Directory**: `apps/web`
2. **Build Command**: `pnpm build` (Turbo handles caching)
3. **Install Command**: `pnpm install`
4. **Environment Variables**: copy from existing project + add `JWT_SECRET`

The `apps/web/vercel.json` (if present) sets cron jobs for event reminders and weekly digest.

---

## How to Add a New API Endpoint

1. Create `apps/web/src/app/api/v1/<domain>/<path>/route.ts`
2. Import helpers from `@/lib/api/middleware`:
   ```ts
   import { withAuth, withApproved, ok, err } from "@/lib/api/middleware";
   ```
3. Add Zod schema to the relevant `packages/validators/src/<domain>.ts`
4. Add response types to `packages/types/src/api.ts`
5. Add a method to the matching domain object in `packages/api-client/src/client.ts`

---

## Known Issues / Deviations from Spec

- **No service layer extraction (Step 9)**: Server actions in `src/lib/actions/` and the API routes share direct DB queries rather than a shared service layer. This was deferred to keep the migration non-breaking. Extracting common DB calls to `packages/db/src/services/` is the next recommended step.
- **Supabase for sermons**: The sermons feature uses Supabase storage (not Neon) for audio and thumbnails. This is intentional and unchanged.
- **React 19 / Next.js 15**: The spec referenced Next.js 14 and React 18 but the actual codebase uses Next.js 15.5.x + React 19. All code targets the actual version.
- **`pnpm.onlyBuiltDependencies`**: Added to root `package.json` for `esbuild`, `ffmpeg-static`, `sharp`, `unrs-resolver` to suppress pnpm's native build approval prompts.
