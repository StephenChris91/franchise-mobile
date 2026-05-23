# Phase 2 Completion — Authentication & Member Profiles

## What was built

- **Drizzle ORM schema** (`db/schema.ts`) — `users`, `accounts`, `sessions`, `verification_tokens`, `profiles`, `password_reset_tokens`
- **Auth.js v5** (`auth.ts`) — Credentials + Google providers, JWT strategy, approval status in session token
- **Route protection** (`middleware.ts`) — guards `/social/*`, `/profile/*`, `/admin/*`; redirects pending → `/auth/pending`, rejected → `/auth/rejected`, admin-only routes
- **Auth pages** — signup, login, pending, rejected, forgot-password, reset-password (all branded, mobile-first)
- **Profile pages** — view own profile, edit (photo/bio/ministry/phone), public profile by `@username`
- **Cloudinary photo upload** — signed upload endpoint at `/api/profile/upload-photo`, 5 MB client + server validation, circle crop transformation
- **Email (Resend)** — admin signup notification, welcome (on approval), rejection, password reset
- **Navbar** — auth state dropdown with profile link, Community link (approved users only), sign out
- **`/social`** — placeholder page, gated to `approvalStatus === 'approved'`

---

## Deviations from spec

| Item | Change | Why |
|------|--------|-----|
| shadcn/ui not installed | Used native Tailwind inputs styled to match brand | The project uses Tailwind v4 + flowbite-react; shadcn expects Tailwind v3 config format and would require significant compatibility shims |
| `next-cloudinary` `<CldImage>` | Used standard `next/image` with Cloudinary URLs | `CldImage` requires `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` at build time; standard `next/image` with `remotePatterns` achieves the same result with less config |
| React Email components | Used `renderToStaticMarkup` instead of `@react-email/components` | Avoids an extra dependency; output is identical for simple HTML emails |
| Auth route chrome | `SiteChrome` client wrapper suppresses global Navbar/Footer on `/auth/*` | Avoids restructuring the existing page tree into route groups |

---

## Environment variables to set in Vercel

| Variable | Description |
|---|---|
| `DATABASE_URL` | Neon pooled connection string (from Neon dashboard → Connection string → Pooled) |
| `DATABASE_URL_UNPOOLED` | Neon direct connection string (for Drizzle migrations) |
| `AUTH_SECRET` | Random 32-byte base64 string: `openssl rand -base64 32` |
| `AUTH_GOOGLE_ID` | Google OAuth client ID (Google Cloud Console) |
| `AUTH_GOOGLE_SECRET` | Google OAuth client secret |
| `RESEND_API_KEY` | From resend.com dashboard |
| `ADMIN_NOTIFICATION_EMAILS` | Comma-separated list, e.g. `pastor@thefranchiselagos.com.ng,admin@thefranchiselagos.com.ng` |
| `NEXT_PUBLIC_APP_URL` | `https://thefranchiselagos.com.ng` |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Your Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |

**Google OAuth setup note:** Add both `http://localhost:3000/api/auth/callback/google` (dev) and `https://thefranchiselagos.com.ng/api/auth/callback/google` (prod) as authorized redirect URIs in Google Cloud Console.

**Resend note:** Verify your sending domain (`thefranchiselagos.com.ng`) in the Resend dashboard before going live.

---

## Running database migrations

```bash
# 1. Copy .env.local.example → .env.local and fill in your values
# 2. Generate the migration SQL from the schema
npm run db:generate

# 3. Apply to the database
npm run db:migrate

# 4. (Optional) Browse data in Drizzle Studio
npm run db:studio
```

---

## How to manually approve a user (before Phase 5 admin dashboard)

```sql
-- Find a user's profile
SELECT u.email, p.username, p.approval_status, p.role
FROM profiles p
JOIN users u ON u.id = p.user_id
WHERE u.email = 'member@example.com';

-- Approve them
UPDATE profiles
SET approval_status = 'approved',
    approved_at = NOW()
WHERE user_id = (SELECT id FROM users WHERE email = 'member@example.com');

-- Grant admin/pastor role
UPDATE profiles
SET role = 'pastor'
WHERE user_id = (SELECT id FROM users WHERE email = 'pastor@example.com');
```

> **Note:** After manually approving via SQL, the user must **sign out and sign back in** to get a fresh JWT with the new `approvalStatus`. The session token is cached for the lifetime of the browser session.

---

## Known issues / follow-ups

1. **JWT cache after approval** — Approval status is baked into the JWT on sign-in. A manually approved user sees the pending page until they log out and back in. Phase 5 admin dashboard should trigger `signOut()` on the user's side, or a short JWT expiry (e.g. 30 min) can be set in `auth.ts`.

2. **Google OAuth signup profile** — Users who sign up via Google get a placeholder username (`user_xxxxxxxx`). They are redirected to `/auth/pending` but cannot edit their profile until approved. Consider adding a "complete your profile" step between Google OAuth and the pending screen in a future iteration.

3. **Resend sender domain** — Until `thefranchiselagos.com.ng` is verified in Resend, emails will show "sent via resend.com." Add the required DNS TXT/MX records in your registrar.

4. **Password reset token cleanup** — Expired tokens accumulate in `password_reset_tokens`. Add a cron job (Vercel Cron, Phase 5) to purge tokens older than 24 hours: `DELETE FROM password_reset_tokens WHERE expires < NOW()`.

5. **Photo upload error UX** — If Cloudinary is misconfigured, the upload silently fails and the old photo is kept. A toast notification would improve this.
