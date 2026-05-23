# Phase 3 Completion — Blog with MDX, Comments, Likes & Shares

## What was built

- **3 blog pages** — `/blog` (index), `/blog/[slug]` (post), `/blog/category/[category]`
- **MDX rendering** via `next-mdx-remote/rsc` (server-side, zero client JS for content)
- **3 sample posts** in `content/blog/` (sermon teaching, devotional, announcement)
- **Reactions** — 👍 Like / 🙌 Amen / 🙏 Praying with optimistic UI; sign-in sheet for logged-out users
- **Comments** — threaded (1 level), edit within 10 min, soft delete, admin hide
- **ShareBar** — WhatsApp (primary), Twitter/X, Facebook, copy link; Web Share API on mobile
- **Sticky mobile reaction bar** — appears after 300 px scroll, fixed at bottom on mobile
- **View tracking** — client-side session ID in localStorage → `/api/posts/[slug]/view`
- **RSS feed** — `/blog/rss.xml` (standard RSS 2.0)
- **Sitemap** — `/sitemap.xml` via `src/app/sitemap.ts` (all static + all blog posts)
- **SEO** — OG tags, Twitter card, JSON-LD Article structured data per post
- **Navbar + Footer** — "Blog" link added to both

---

## New database tables

| Table | Purpose |
|-------|---------|
| `post_views` | Anonymous view tracking (unique per post_slug + session_id) |
| `post_reactions` | Per-user reactions (like / amen / praying), unique per slug+user+type |
| `post_comments` | Threaded comments with soft delete + admin hide |

Migration: `db/migrations/0001_broad_moondragon.sql` — already applied.

---

## How to add a new blog post

1. Create a `.mdx` file in `content/blog/` with this frontmatter:

```mdx
---
title: "Your Post Title"
slug: "your-post-slug"   # must be unique, URL-safe
excerpt: "Short description (max 200 chars)"
author: "author-username"  # matches a profile username
publishedAt: "2025-06-01"
coverImage: ""  # Cloudinary URL or leave empty for gradient fallback
category: "sermon"  # sermon | teaching | devotional | announcement | testimony
tags: ["faith", "prayer"]
featured: false  # only one post should have featured: true
---

Your MDX content here. Full Markdown + JSX supported.
```

2. The post is live immediately (no restart needed — reads from the filesystem).
3. Update `featured: true` on whichever post you want to appear at the top of the index.
4. To add a cover image, upload to Cloudinary and paste the full `https://res.cloudinary.com/...` URL.

---

## New packages installed

| Package | Purpose |
|---------|---------|
| `next-mdx-remote` | Server-side MDX compilation in App Router |
| `gray-matter` | YAML frontmatter parsing |
| `reading-time` | Automatic reading time estimation |
| `date-fns` | Date formatting |
| `remark-gfm` | GitHub Flavoured Markdown (tables, strikethrough, etc.) |
| `rehype-slug` | Adds `id` attributes to headings |
| `rehype-autolink-headings` | Adds anchor links to headings |
| `@tailwindcss/typography` | `prose` utility classes for MDX content |

---

## New UI components

| Component | Path |
|-----------|------|
| `Separator` | `src/components/ui/separator.tsx` |
| `Badge` | `src/components/ui/badge.tsx` |
| `Sheet` | `src/components/ui/sheet.tsx` (framer-motion slide-up panel) |

---

## No new environment variables required

All existing env vars are reused. The `NEXT_PUBLIC_APP_URL` variable is used to build share URLs and JSON-LD — make sure it is set to `https://thefranchiselagos.com.ng` in production.

---

## Deviations from spec

| Item | Change | Why |
|------|--------|-----|
| Tooltip | Not built as a separate component | Used native `title` attributes on reaction buttons; no visual tooltip library needed |
| Share count table | Omitted | Client-side share events are difficult to track reliably; can be added in Phase 5 with analytics |
| ISR revalidation | Blog index + category pages use `revalidate = 3600` (1 hr) | Posts are served statically; adding a post requires no server restart — just add the MDX file and wait 1 hour for ISR, or manually trigger a redeploy |

---

## Known follow-ups (post Phase 3)

1. **Admin UI for blog** — Currently posts are managed via MDX files in the repo. A CMS panel (Phase 5) would let pastors write and publish without touching code.
2. **Comment notifications** — Notify post author or thread participants when a reply is posted (Phase 6).
3. **Reaction summary on blog cards** — Show aggregated reaction counts on the index page cards (requires a DB query per card; deferred for performance).
4. **Analytics on shares** — Add a `post_shares` table or integrate with an analytics provider (Phase 5).
5. **`author` field resolution** — The `author` frontmatter field is a plain string (username). A future enhancement could join with the `profiles` table to display the author's avatar and full name in the post hero.
