/**
 * Cron: /api/cron/service-reminders
 * Runs every 5 minutes. Sends "starting soon" push to users who set reminders.
 * Checks if any service starts within the next 15–20 minutes.
 */
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, livestreams, serviceReminders } from "@franchise/db";
import { sendPushToUsers } from "@/lib/push/service";
import { nextOccurrence } from "@/lib/live";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const allStreams = await db.select().from(livestreams);
  const notified: string[] = [];

  for (const ls of allStreams) {
    if (ls.status === "live" || ls.status === "ended") continue;

    const next = nextOccurrence(ls.dayOfWeek, ls.scheduledTime);
    const minutesUntil = (next.getTime() - now.getTime()) / 60_000;

    // Fire reminder if service starts in 13–18 minutes (5-min cron window ± buffer)
    if (minutesUntil >= 13 && minutesUntil <= 18) {
      const reminderRows = await db
        .select({
          userId: serviceReminders.userId,
          minutesBefore: serviceReminders.minutesBefore,
          isActive: serviceReminders.isActive,
        })
        .from(serviceReminders)
        .where(eq(serviceReminders.serviceType, ls.serviceType));

      const userIds = reminderRows
        .filter((r) => r.isActive && r.minutesBefore >= 13 && r.minutesBefore <= 18)
        .map((r) => r.userId);

      if (!userIds.length) continue;

      const isPrayer = ls.serviceType === "friday_zoom";

      await sendPushToUsers(userIds, {
        title: isPrayer ? "Friday Prayer starts in 15 minutes 🙏" : `${ls.name} starts soon 🙌`,
        body: isPrayer
          ? `${userIds.length} members are gathering. Will you join?`
          : "Join the family — service starts in 15 minutes",
        data: {
          type: isPrayer ? "prayer_starting_soon" : "service_starting_soon",
          livestreamId: ls.id,
        },
      });

      notified.push(ls.name);
    }
  }

  return NextResponse.json({ ok: true, notified });
}
