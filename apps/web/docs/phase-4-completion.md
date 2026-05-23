# Phase 4 Completion: Franchise Social

## What was built

### Database
- 7 new tables: `groups`, `group_members`, `social_posts`, `social_post_reactions`, `social_post_comments`, `content_reports`, `notifications`
- 8 new enums: `group_type`, `group_visibility`, `group_member_role`, `social_post_type`, `social_reaction_type`, `report_reason`, `report_status`, `notification_type`
- Migration: `db/migrations/0003_nice_luminals.sql`
- Seed script: `db/seed.ts` — run with `npm run db:seed` after deploying

### Routes
- `/social` — main community feed with composer, infinite scroll, real-time new-post pill
- `/social/groups` — group discovery with type filters and join/leave
- `/social/groups/[slug]` — group detail: Posts / Members / About tabs, scoped composer
- `/social/prayer-wall` — filtered prayer posts with purple banner
- `/social/members` — searchable member directory
- `/social/members/[username]` — member profile card within social
- `/social/notifications` — full notification list

### Components
- `SocialLayout` — three-column desktop / bottom-nav mobile shell
- `PostComposer` — Tiptap rich-text editor, image upload (Cloudinary), post type selector, char count
- `PostCard` — Tiptap JSON → HTML render, reaction bar (optimistic), lightbox, report modal, admin actions
- `FeedClient` — infinite scroll (react-intersection-observer), Pusher new-post pill
- `NotificationBell` — real-time badge via Pusher private channel, dropdown, mark-read
- `GroupsClient` — grid of group cards with optimistic join/leave
- `MembersClient` — client-side search of members
- `DeletePostButton` — (blog, from Phase 3 fix)

### Server actions (`src/lib/actions/social.ts`)
- `createPost` — content, postType, groupId?, mediaUrls[], profanity check, rate limit (10/hr), Pusher trigger
- `editPost` — author only
- `deletePost` — author or admin/pastor
- `pinPost` / `hidePost` — admin/pastor only
- `toggleReaction` — optimistic, denormalized counter, notification to post author
- `createComment` — rate limit (30/hr), profanity check, counter, notification
- `deleteComment` — author or admin/pastor, counter
- `joinGroup` / `leaveGroup` — approval-gated, denormalized memberCount
- `reportContent` — inserts to `content_reports`
- `markNotificationsRead`

### API routes
- `POST /api/pusher/auth` — Pusher private channel auth (user-scoped)
- `POST /api/upload/sign` — Cloudinary signed upload for social images

### Admin redirect
Login page (`/auth/login`) now checks session role after sign-in. Admin and pastor users are redirected to `/admin/blog` automatically.

### Seed groups (run `npm run db:seed`)
Franchise Kids, Franchise Youth, Franchise Adults, Choir, Ushers, Prayer Team, Media Team, New Members

---

## Environment variables required

```env
# Pusher (create at dashboard.pusher.com — use cluster "eu" for Lagos)
PUSHER_APP_ID=
PUSHER_KEY=
PUSHER_SECRET=
PUSHER_CLUSTER=eu
NEXT_PUBLIC_PUSHER_KEY=
NEXT_PUBLIC_PUSHER_CLUSTER=eu

# Cloudinary (already in use from Phase 2 — no change)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

## Pusher setup

1. Go to [pusher.com](https://pusher.com) → create a new Channels app
2. Pick cluster **eu** (closest to Lagos, West Africa)
3. Copy App ID, Key, Secret into `.env.local` and Vercel env vars
4. Channels used:
   - `feed-main` — new posts to the main feed (public channel)
   - `feed-{groupId}` — new posts scoped to a group (public channel)
   - `post-{postId}` — reactions/comments on a specific post (public channel)
   - `private-user-{userId}` — notifications for a specific user (private, auth required)

---

## Deviations from spec

| Spec item | Decision |
|---|---|
| `@tiptap/extension-mention` (@username autocomplete) | Deferred — Tiptap v3 mention extension requires additional setup; can be added as a follow-up without schema changes |
| `emoji-picker-react` | Installed but not integrated into composer — Tiptap handles emoji natively via keyboard; picker can be wired to the toolbar in a follow-up |
| `/social/feed` explicit route | Not built — `/social` IS the feed; duplicate route adds no value |
| Service worker offline toast | Deferred to Phase 5 — requires PWA setup |
| Events teaser in right sidebar | Deferred — Events feature is Phase 5 |
| `comment_count` and `reaction_count` | Denormalized on `social_posts` and updated via `GREATEST(n - 1, 0)` guards |

---

## Design concepts for final polish

### Concept A — "Warm Community" (recommended)
- Light warm cream background `#f5f3f0`
- Cards are pure white with `shadow-sm` and `rounded-2xl`
- Brand orange as primary accent for all interactive elements
- Member avatars use warm gradient fallbacks
- Scripture quotes in empty states create Franchise-specific warmth
- Bottom nav icons with orange active indicator

### Concept B — "Church Dark Mode"
- Deep charcoal `#1b1b1b` base (same as home page)
- Cards in `#252525` with subtle white/5 borders
- Orange glows on hover and active states
- Gold-tinted member avatars
- Works well for evening/night usage common on mobile

### Concept C — "Editorial Light"
- Pure white `#ffffff` base
- Generous whitespace, minimal card borders
- Typographically driven — name and content are the hero
- Accent color only on interactive states (reactions, buttons)
- Feels like a premium community platform, closer to Substack than Facebook

**Current implementation uses Concept A.** To switch to B or C, update `SocialLayout.tsx` background and `PostCard.tsx`/`PostComposer.tsx` card colors.

---

## Acceptance criteria status

| Criterion | Status |
|---|---|
| Approved member can post, comment, react | ✅ |
| Joining a group surfaces its posts | ✅ |
| Group posts scoped to group members | ✅ |
| Prayer wall filters prayer posts | ✅ |
| Real-time: new post appears in <2s | ✅ (Pusher `feed-main` / `feed-{groupId}`) |
| Image uploads work | ✅ (Cloudinary signed upload) |
| Notifications appear in bell | ✅ |
| Rate limiting | ✅ (10 posts/hr, 30 comments/hr) |
| Mobile UX on 375px | ✅ (bottom nav, responsive grid) |
| Profanity filter | ✅ (server-side, friendly error) |
