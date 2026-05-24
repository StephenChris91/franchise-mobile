import { NextRequest } from "next/server";
import { z } from "zod";
import { db, profiles } from "@franchise/db";
import { eq } from "drizzle-orm";
import { ok, err, withApproved } from "@/lib/api/middleware";
import { Resend } from "resend";

const bodySchema = z.object({
  subject: z.string().min(3).max(150),
  message: z.string().min(10).max(2000),
});

let _resend: Resend | undefined;
function getResend(): Resend {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY!);
  return _resend;
}

const PASTORAL_EMAIL = process.env.PASTORAL_CONTACT_EMAIL ?? process.env.ADMIN_NOTIFICATION_EMAILS?.split(",")[0] ?? "";

export async function POST(req: NextRequest) {
  return withApproved(req, async (req, user) => {
    let body: unknown;
    try { body = await req.json(); } catch { return err("BAD_REQUEST", "Invalid JSON", 400); }

    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) return err("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input", 400);

    if (!PASTORAL_EMAIL) {
      console.error("[contact/pastor] PASTORAL_CONTACT_EMAIL not configured");
      return err("SERVER_ERROR", "Contact feature not configured", 500);
    }

    const [profile] = await db
      .select({ fullName: profiles.fullName, username: profiles.username })
      .from(profiles)
      .where(eq(profiles.userId, user.sub))
      .limit(1);

    const senderName = profile?.fullName ?? `@${profile?.username ?? user.sub}`;

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Ubuntu,Helvetica,sans-serif;background:#1b1b1b;color:#fff;padding:40px 24px;max-width:560px;margin:0 auto;">
  <img src="${process.env.NEXT_PUBLIC_APP_URL ?? ""}/assets/logo.png" alt="Franchise Church" style="height:44px;margin-bottom:32px;display:block;">
  <h2 style="color:#af601a;font-size:20px;">Message from a Church Member</h2>
  <table style="width:100%;margin:24px 0;border-collapse:collapse;">
    <tr><td style="padding:8px 0;color:#9ca3af;font-size:14px;width:100px;">From</td><td style="padding:8px 0;color:#fff;font-size:14px;">${senderName} (${user.sub})</td></tr>
    <tr><td style="padding:8px 0;color:#9ca3af;font-size:14px;">Subject</td><td style="padding:8px 0;color:#fff;font-size:14px;">${parsed.data.subject}</td></tr>
  </table>
  <div style="background:#2d2d2d;border-left:4px solid #af601a;padding:16px 20px;border-radius:4px;margin-top:8px;">
    <p style="color:#e5e5e5;line-height:1.8;white-space:pre-wrap;margin:0;">${parsed.data.message}</p>
  </div>
  <p style="color:#6b7280;font-size:12px;margin-top:40px;">&copy; ${new Date().getFullYear()} Franchise Church, Lagos. Sent via the Franchise mobile app.</p>
</body>
</html>`;

    await getResend().emails.send({
      from: "Franchise Church App <noreply@thefranchiselagos.com.ng>",
      to: PASTORAL_EMAIL,
      replyTo: undefined, // can't reply to app users directly — they message via the app
      subject: `[Member Message] ${parsed.data.subject} — ${senderName}`,
      html,
    });

    return ok({ ok: true });
  });
}
