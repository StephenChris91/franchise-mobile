import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db, livestreams, serviceReminders } from "@franchise/db";
import { ok, withApproved } from "@/lib/api/middleware";
import { nextOccurrence } from "@/lib/live";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return withApproved(req, async (_, user) => {
    const rows = await db.select().from(livestreams).orderBy(livestreams.dayOfWeek);

    // Fetch this user's reminder prefs in one query
    const reminders = await db
      .select()
      .from(serviceReminders)
      .where(eq(serviceReminders.userId, user.sub));

    const reminderMap = new Map(reminders.map((r) => [r.serviceType, r.isActive]));

    return ok(
      rows.map((ls) => ({
        id: ls.id,
        name: ls.name,
        serviceType: ls.serviceType,
        platform: ls.platform,
        status: ls.status,
        dayOfWeek: ls.dayOfWeek,
        scheduledTime: ls.scheduledTime,
        durationMins: ls.durationMins,
        nextOccurrence: nextOccurrence(ls.dayOfWeek, ls.scheduledTime).toISOString(),
        youtubeVideoId: ls.youtubeVideoId,
        zoomMeetingId: ls.zoomMeetingId,
        zoomPasscode: ls.zoomPasscode,
        replayUrl: ls.replayUrl,
        startedAt: ls.startedAt?.toISOString() ?? null,
        reminderActive: reminderMap.get(ls.serviceType) ?? false,
      }))
    );
  });
}
