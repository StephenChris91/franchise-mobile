import { Resend } from "resend";

// Lazy getter so the Resend client isn't constructed at module load time
// (prevents build errors when RESEND_API_KEY is absent)
let _resend: Resend | undefined;
function getResend(): Resend {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY!);
  return _resend;
}

const FROM = "Franchise Church <noreply@thefranchiselagos.com.ng>";
const APP_URL = () => process.env.NEXT_PUBLIC_APP_URL ?? "https://thefranchiselagos.com.ng";

// ─── Shared layout wrapper ────────────────────────────────────────────────────

function wrap(body: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#1b1b1b;font-family:Ubuntu,Helvetica,sans-serif;color:#ffffff;">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
    <img src="${APP_URL()}/assets/logo.png" alt="Franchise Church" style="height:44px;width:auto;margin-bottom:32px;display:block;">
    ${body}
    <p style="margin-top:40px;color:#6b7280;font-size:12px;">
      &copy; ${new Date().getFullYear()} Franchise Church, Lagos.
    </p>
  </div>
</body>
</html>`;
}

function btn(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;margin-top:28px;padding:12px 28px;background:#af601a;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:700;font-size:14px;">${label}</a>`;
}

// ─── Email builders ───────────────────────────────────────────────────────────

function adminNotificationHtml(opts: { fullName: string; email: string; username: string }) {
  return wrap(`
    <h2 style="color:#af601a;font-size:20px;margin-bottom:16px;">New Member Signup</h2>
    <p style="color:#e5e5e5;line-height:1.6;">A new member has registered and is awaiting approval.</p>
    <table style="width:100%;margin-top:24px;border-collapse:collapse;">
      <tr><td style="padding:8px 0;color:#9ca3af;font-size:14px;">Full Name</td><td style="padding:8px 0;color:#fff;font-size:14px;">${opts.fullName}</td></tr>
      <tr><td style="padding:8px 0;color:#9ca3af;font-size:14px;">Email</td><td style="padding:8px 0;color:#fff;font-size:14px;">${opts.email}</td></tr>
      <tr><td style="padding:8px 0;color:#9ca3af;font-size:14px;">Username</td><td style="padding:8px 0;color:#fff;font-size:14px;">@${opts.username}</td></tr>
    </table>
    ${btn(`${APP_URL()}/admin/members`, "Review in Admin Dashboard")}
  `);
}

function welcomeHtml(opts: { fullName: string }) {
  return wrap(`
    <h1 style="color:#af601a;font-size:24px;margin-bottom:16px;">Welcome to Franchise Church Online</h1>
    <p style="color:#e5e5e5;line-height:1.8;font-size:16px;">Hi ${opts.fullName},</p>
    <p style="color:#e5e5e5;line-height:1.8;font-size:16px;">Your membership has been approved! You now have full access to the Franchise Church community, sermon library, and member features.</p>
    <p style="color:#e5e5e5;line-height:1.8;font-size:16px;font-style:italic;">We envision all men celebrating endless life in Christ.</p>
    ${btn(`${APP_URL()}/social`, "Explore the Community")}
  `);
}

function rejectionHtml(opts: { fullName: string; reason: string }) {
  const reasonBlock = opts.reason
    ? `<div style="background:#2d2d2d;border-left:4px solid #af601a;padding:16px;margin:24px 0;border-radius:4px;"><p style="color:#e5e5e5;margin:0;font-size:14px;">${opts.reason}</p></div>`
    : "";
  return wrap(`
    <h2 style="color:#af601a;font-size:20px;margin-bottom:16px;">Regarding Your Membership Application</h2>
    <p style="color:#e5e5e5;line-height:1.8;">Hi ${opts.fullName},</p>
    <p style="color:#e5e5e5;line-height:1.8;">After review, we are unable to approve your membership application at this time.</p>
    ${reasonBlock}
    <p style="color:#e5e5e5;line-height:1.8;">If you believe this is in error or would like to speak with our pastoral team, please reach out.</p>
    ${btn(`${APP_URL()}/pages/counselling`, "Contact Us")}
  `);
}

function passwordResetHtml(opts: { fullName: string; resetUrl: string }) {
  return wrap(`
    <h2 style="color:#af601a;font-size:20px;margin-bottom:16px;">Reset Your Password</h2>
    <p style="color:#e5e5e5;line-height:1.8;">Hi ${opts.fullName},</p>
    <p style="color:#e5e5e5;line-height:1.8;">We received a request to reset your password. Click the button below. This link expires in 1 hour.</p>
    ${btn(opts.resetUrl, "Reset Password")}
    <p style="margin-top:24px;color:#9ca3af;font-size:13px;">If you didn't request this, you can safely ignore this email.</p>
  `);
}

// ─── Public send functions ────────────────────────────────────────────────────

export async function sendAdminNotification(opts: {
  fullName: string;
  email: string;
  username: string;
}) {
  const adminEmails = (process.env.ADMIN_NOTIFICATION_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);

  if (!adminEmails.length) return;

  await getResend().emails.send({
    from: FROM,
    to: adminEmails,
    subject: `New member signup: ${opts.fullName} (${opts.email})`,
    html: adminNotificationHtml(opts),
  });
}

export async function sendWelcomeEmail(opts: { to: string; fullName: string }) {
  await getResend().emails.send({
    from: FROM,
    to: opts.to,
    subject: "Welcome to Franchise Church Online",
    html: welcomeHtml({ fullName: opts.fullName }),
  });
}

export async function sendRejectionEmail(opts: {
  to: string;
  fullName: string;
  reason: string;
}) {
  await getResend().emails.send({
    from: FROM,
    to: opts.to,
    subject: "Your Franchise Church membership application",
    html: rejectionHtml({ fullName: opts.fullName, reason: opts.reason }),
  });
}

export async function sendPasswordResetEmail(opts: {
  to: string;
  fullName: string;
  token: string;
}) {
  const resetUrl = `${APP_URL()}/auth/reset-password?token=${opts.token}`;
  await getResend().emails.send({
    from: FROM,
    to: opts.to,
    subject: "Reset your Franchise Church password",
    html: passwordResetHtml({ fullName: opts.fullName, resetUrl }),
  });
}

// ─── ICS generator ────────────────────────────────────────────────────────────

function formatIcsDate(d: Date): string {
  return d
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

function generateIcs(opts: {
  title: string;
  description?: string;
  location?: string;
  startsAt: Date;
  endsAt: Date;
  url?: string;
}): string {
  const uid = `event-${Date.now()}@thefranchiselagos.com.ng`;
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Franchise Church//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTART:${formatIcsDate(opts.startsAt)}`,
    `DTEND:${formatIcsDate(opts.endsAt)}`,
    `SUMMARY:${opts.title}`,
    opts.description ? `DESCRIPTION:${opts.description.replace(/\n/g, "\\n").substring(0, 500)}` : "",
    opts.location ? `LOCATION:${opts.location}` : "",
    opts.url ? `URL:${opts.url}` : "",
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
}

// ─── RSVP confirmation ────────────────────────────────────────────────────────

function rsvpConfirmationHtml(opts: {
  fullName: string;
  eventTitle: string;
  startsAt: Date;
  location: string;
  eventUrl: string;
}) {
  const dateStr = opts.startsAt.toLocaleDateString("en-NG", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
  const timeStr = opts.startsAt.toLocaleTimeString("en-NG", {
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
  return wrap(`
    <h2 style="color:#af601a;font-size:20px;margin-bottom:16px;">You&apos;re going! 🎉</h2>
    <p style="color:#e5e5e5;line-height:1.8;">Hi ${opts.fullName},</p>
    <p style="color:#e5e5e5;line-height:1.8;">Your RSVP for <strong>${opts.eventTitle}</strong> is confirmed.</p>
    <table style="width:100%;margin:24px 0;border-collapse:collapse;">
      <tr><td style="padding:8px 0;color:#9ca3af;font-size:14px;">Date</td><td style="padding:8px 0;color:#fff;font-size:14px;">${dateStr}</td></tr>
      <tr><td style="padding:8px 0;color:#9ca3af;font-size:14px;">Time</td><td style="padding:8px 0;color:#fff;font-size:14px;">${timeStr}</td></tr>
      <tr><td style="padding:8px 0;color:#9ca3af;font-size:14px;">Location</td><td style="padding:8px 0;color:#fff;font-size:14px;">${opts.location}</td></tr>
    </table>
    <p style="color:#e5e5e5;font-size:13px;">A calendar invite is attached to this email.</p>
    ${btn(opts.eventUrl, "View Event Details")}
  `);
}

export async function sendRsvpConfirmation(opts: {
  to: string;
  fullName: string;
  event: { title: string; startsAt: Date; endsAt: Date; location: string; slug: string; description: string };
}) {
  const eventUrl = `${APP_URL()}/events/${opts.event.slug}`;
  const ics = generateIcs({
    title: opts.event.title,
    description: opts.event.description,
    location: opts.event.location,
    startsAt: opts.event.startsAt,
    endsAt: opts.event.endsAt,
    url: eventUrl,
  });

  await getResend().emails.send({
    from: FROM,
    to: opts.to,
    subject: `You're going to ${opts.event.title}!`,
    html: rsvpConfirmationHtml({
      fullName: opts.fullName,
      eventTitle: opts.event.title,
      startsAt: opts.event.startsAt,
      location: opts.event.location,
      eventUrl,
    }),
    attachments: [
      {
        filename: "event.ics",
        content: Buffer.from(ics, "utf-8"),
      },
    ],
  });
}

// ─── Event reminder ───────────────────────────────────────────────────────────

function eventReminderHtml(opts: { fullName: string; eventTitle: string; startsAt: Date; location: string; eventUrl: string }) {
  const timeStr = opts.startsAt.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit", hour12: true });
  return wrap(`
    <h2 style="color:#af601a;font-size:20px;margin-bottom:16px;">Reminder: ${opts.eventTitle} is tomorrow</h2>
    <p style="color:#e5e5e5;line-height:1.8;">Hi ${opts.fullName},</p>
    <p style="color:#e5e5e5;line-height:1.8;">Just a reminder that <strong>${opts.eventTitle}</strong> starts tomorrow at <strong>${timeStr}</strong> at ${opts.location}.</p>
    ${btn(opts.eventUrl, "View Event")}
  `);
}

export async function sendEventReminder(opts: {
  to: string;
  fullName: string;
  eventTitle: string;
  startsAt: Date;
  location: string;
  slug: string;
}) {
  await getResend().emails.send({
    from: FROM,
    to: opts.to,
    subject: `Reminder: ${opts.eventTitle} is tomorrow`,
    html: eventReminderHtml({ ...opts, eventUrl: `${APP_URL()}/events/${opts.slug}` }),
  });
}

// ─── Weekly digest ────────────────────────────────────────────────────────────

function weeklyDigestHtml(opts: {
  newMembers: number;
  postsCount: number;
  pendingReports: number;
  topGroups: { name: string; memberCount: number }[];
}) {
  const groups = opts.topGroups
    .map((g) => `<tr><td style="padding:6px 0;color:#e5e5e5;">${g.name}</td><td style="padding:6px 0;color:#9ca3af;">${g.memberCount} members</td></tr>`)
    .join("");

  return wrap(`
    <h2 style="color:#af601a;font-size:20px;margin-bottom:16px;">Weekly Community Digest</h2>
    <p style="color:#e5e5e5;">Here&apos;s what happened in Franchise Church Online this week.</p>
    <table style="width:100%;margin:24px 0;border-collapse:collapse;">
      <tr><td style="padding:8px 0;color:#9ca3af;">New members</td><td style="padding:8px 0;color:#fff;font-weight:700;">${opts.newMembers}</td></tr>
      <tr><td style="padding:8px 0;color:#9ca3af;">Community posts</td><td style="padding:8px 0;color:#fff;font-weight:700;">${opts.postsCount}</td></tr>
      <tr><td style="padding:8px 0;color:#9ca3af;">Pending reports</td><td style="padding:8px 0;color:${opts.pendingReports > 0 ? "#f87171" : "#fff"};font-weight:700;">${opts.pendingReports}</td></tr>
    </table>
    ${opts.topGroups.length > 0 ? `
      <h3 style="color:#af601a;font-size:16px;margin-top:28px;">Top Groups</h3>
      <table style="width:100%;border-collapse:collapse;">${groups}</table>
    ` : ""}
    ${btn(`${APP_URL()}/admin`, "View Admin Dashboard")}
  `);
}

export async function sendWeeklyDigest(opts: {
  to: string;
  newMembers: number;
  postsCount: number;
  pendingReports: number;
  topGroups: { name: string; memberCount: number }[];
}) {
  await getResend().emails.send({
    from: FROM,
    to: opts.to,
    subject: `Franchise Church — Weekly Digest`,
    html: weeklyDigestHtml(opts),
  });
}
