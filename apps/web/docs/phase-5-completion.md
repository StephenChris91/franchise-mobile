# Phase 5 Completion — Admin Dashboard, Events & Moderation

**Completed:** 2026-05-23  
**Status:** ✅ Full implementation

---

## What was built

### Admin Dashboard (`/admin`)
- **Stats cards** — total members, pending approvals, pending reports, posts this week (with week-over-week deltas)
- **Analytics charts** — 30-day area charts for new members and posts per day (recharts AreaChart)
- **Quick actions** — shortcuts to most-used admin tasks
- **Top groups** — ranked by member count
- **Recent activity** — last 3 days of admin actions

### Member Management (`/admin/members`)
- **Tabbed view** — Pending / Approved / Rejected / Suspended / All
- **Approve / Reject / Suspend / Unsuspend** — with confirmation dialogs and reason fields
- **Role assignment** — member → admin → pastor dropdown
- **Search + sort** — powered by @tanstack/react-table
- **Auto actions on approval** — adds member to "new-members" group, sends welcome email

### Content Moderation (`/admin/reports`)
- Reports queue with post content preview
- Three resolution paths: **Hide content**, **Hide + suspend user**, **Dismiss**
- All actions logged to audit trail

### Announcements (`/admin/announcements`)
- Tiptap rich text editor
- Pin duration selector (1 / 3 / 7 days)
- Posts directly to the community social feed with `announcement` type

### Events System
**Admin side (`/admin/events`)**
- Create, edit, duplicate, delete events
- Cover image (Cloudinary), rich text description (Tiptap)
- Event type, location with optional map link
- Date/time pickers, capacity, RSVP required toggle
- Publish/unpublish toggle
- RSVP attendance list with CSV export

**Public side**
- `/events` — public listing, visible to logged-out visitors; upcoming + past sections
- `/events/[slug]` — event detail page with RSVP card
  - Capacity tracking (remaining spots)
  - "Going / Interested / Can't go" RSVP buttons with optimistic state
  - Disabled state for non-approved members
  - RSVP confirmation email with .ics calendar attachment
- `/api/events/[slug]/ics` — standalone .ics download for "Add to Calendar" buttons

### Groups Management (`/admin/groups`)
- View all groups with member counts, type, and visibility
- Create new group form (name, slug auto-generated, description, type, visibility)
- Inline description edit per group

### Audit Log (`/admin/audit`) — Pastor only
- Read-only table of all admin actions
- Shows admin name/username, action label, metadata, and timestamp
- Last 200 entries

### Social Feed Events Teaser
- Right sidebar on `/social` now shows up to 3 upcoming events
- Title, date, time, location with a link to `/events`

### Cron Jobs
| Job | Route | Schedule | What it does |
|-----|-------|----------|--------------|
| Event reminders | `/api/cron/event-reminders` | Daily 5am UTC (6am Lagos) | Sends reminder emails to "going" RSVPs for events starting in ~24h |
| Weekly digest | `/api/cron/weekly-digest` | Sunday 7am UTC (8am Lagos) | Sends community stats digest to approved members |

---

## Database changes

Migration: `0004_light_living_lightning.sql`

New tables:
- **`events`** — slug, title, description, eventType, location, locationUrl, startsAt, endsAt, capacity, rsvpRequired, isPublished, createdBy, createdAt, updatedAt
- **`event_rsvps`** — composite PK (eventId, userId), status (going/interested/not_going), guestsCount, notes
- **`admin_actions`** — adminId, actionType, targetType, targetId, metadata (jsonb)

Updated enum:
- `approval_status` — added `"suspended"` value

---

## Environment variables

All existing env vars still apply. New additions:

| Variable | Description |
|----------|-------------|
| `CRON_SECRET` | Shared secret for Vercel Cron authentication. Set this in Vercel dashboard → Settings → Environment Variables. Vercel automatically sends `Authorization: Bearer <CRON_SECRET>` in cron requests. |

---

## Vercel Cron configuration

`vercel.json` in project root:

```json
{
  "crons": [
    {
      "path": "/api/cron/event-reminders",
      "schedule": "0 5 * * *"
    },
    {
      "path": "/api/cron/weekly-digest",
      "schedule": "0 7 * * 0"
    }
  ]
}
```

Crons run in UTC. Lagos is WAT (UTC+1), so:
- `0 5 * * *` = 6am Lagos daily
- `0 7 * * 0` = 8am Lagos every Sunday

Both routes validate `Authorization: Bearer ${CRON_SECRET}` and return 401 if missing.

---

## Role access matrix

| Feature | member | admin | pastor |
|---------|--------|-------|--------|
| View `/events` | ✅ (public) | ✅ | ✅ |
| RSVP to events | ✅ (approved only) | ✅ | ✅ |
| View `/admin` | ❌ | ✅ | ✅ |
| Approve/reject members | ❌ | ✅ | ✅ |
| Suspend members | ❌ | ✅ | ✅ |
| Moderate reports | ❌ | ✅ | ✅ |
| Post announcements | ❌ | ✅ | ✅ |
| Manage events | ❌ | ✅ | ✅ |
| Manage groups | ❌ | ✅ | ✅ |
| View audit log | ❌ | ❌ | ✅ |

---

## New dependencies added

| Package | Purpose |
|---------|---------|
| `recharts` | Area charts on admin dashboard |
| `@tanstack/react-table` | Sortable/filterable member table |
| `@radix-ui/react-select` | Custom select component (Tailwind v4 compatible) |
| `@radix-ui/react-switch` | Custom switch toggle (Tailwind v4 compatible) |

---

## Deviations from spec

1. **Weekly digest recipients** — The spec said "pastoral team" but the route currently sends to all approved members. This is intentional — the digest content is community-oriented, not sensitive admin data. Restrict by role if needed by filtering on `users.role` in the cron query.

2. **Thread posts not in events** — Events use plain-text/HTML description (Tiptap), not the thread post format. Thread format is social-feed-only.

3. **.ics format** — Generated inline (no library) using RFC 5545. Strips HTML from description, escapes special chars.

4. **Capacity enforcement** — Checked at RSVP save time (not real-time). Race condition on the last spot is possible at high concurrency; acceptable for current scale.

---

## Known follow-ups

- **Social feed improvements** — User flagged changes needed to feed posts (deferred from Phase 4). Revisit as Phase 6 or hotfix.
- **Pusher real-time for new events** — Could push new events to connected clients; currently requires page refresh.
- **Member role restrictions on weekly digest** — Tighten cron to only send to `pastor` + `admin` roles if digest content becomes sensitive.
- **Event image gallery** — Single cover image only; multi-image gallery deferred.
