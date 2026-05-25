import { NextRequest } from "next/server";
import { eq, and, desc } from "drizzle-orm";
import { db, livestreams, serviceReminders, prayerCommitments, profiles } from "@franchise/db";
import { ok, err, withApproved } from "@/lib/api/middleware";
import { nextOccurrence } from "@/lib/live";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApproved(req, async (_, user) => {
    const { id } = await params;

    const [ls] = await db.select().from(livestreams).where(eq(livestreams.id, id)).limit(1);
    if (!ls) return err("NOT_FOUND", "Livestream not found", 404);

    // Reminder pref
    const [reminder] = await db
      .select()
      .from(serviceReminders)
      .where(and(eq(serviceReminders.userId, user.sub), eq(serviceReminders.serviceType, ls.serviceType)))
      .limit(1);

    // Prayer commitments (up to 5 member details)
    const commitmentRows = await db
      .select({
        userId: prayerCommitments.userId,
        username: profiles.username,
        fullName: profiles.fullName,
        photoUrl: profiles.photoUrl,
      })
      .from(prayerCommitments)
      .innerJoin(profiles, eq(prayerCommitments.userId, profiles.userId))
      .where(eq(prayerCommitments.livestreamId, id))
      .orderBy(desc(prayerCommitments.committedAt))
      .limit(50);

    const userCommitted = commitmentRows.some((c) => c.userId === user.sub);

    return ok({
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
      reminderActive: reminder?.isActive ?? false,
      prayerFocus: ls.prayerFocus,
      prayerVerse: ls.prayerVerse,
      commitmentCount: commitmentRows.length,
      committedMembers: commitmentRows.slice(0, 5).map((c) => ({
        userId: c.userId,
        username: c.username,
        fullName: c.fullName,
        photoUrl: c.photoUrl,
      })),
      userCommitted,
    });
  });
}
