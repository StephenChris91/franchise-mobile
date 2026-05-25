/**
 * Cron: /api/cron/check-live-status
 * Runs every 5 minutes. During service windows, polls the YouTube Data API
 * to auto-detect live streams. Also sends "starting soon" push notifications.
 */
import { NextResponse } from "next/server";
import { eq, inArray } from "drizzle-orm";
import { db, livestreams, serviceReminders } from "@franchise/db";
import { sendPushToUsers } from "@/lib/push/service";
import { isServiceWindow } from "@/lib/live";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID;

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allStreams = await db.select().from(livestreams);
  const results: string[] = [];

  for (const ls of allStreams) {
    const inWindow = isServiceWindow(ls.dayOfWeek, ls.scheduledTime, ls.durationMins);

    // ── YouTube auto-detection ──────────────────────────────────────────────
    if (
      ls.platform === "youtube" &&
      inWindow &&
      ls.status !== "live" &&
      YOUTUBE_API_KEY &&
      YOUTUBE_CHANNEL_ID
    ) {
      try {
        const ytUrl = new URL("https://www.googleapis.com/youtube/v3/search");
        ytUrl.searchParams.set("part", "snippet");
        ytUrl.searchParams.set("channelId", YOUTUBE_CHANNEL_ID);
        ytUrl.searchParams.set("eventType", "live");
        ytUrl.searchParams.set("type", "video");
        ytUrl.searchParams.set("key", YOUTUBE_API_KEY);

        const ytRes = await fetch(ytUrl.toString());
        const ytData = await ytRes.json() as { items?: { id: { videoId: string } }[] };
        const videoId = ytData.items?.[0]?.id?.videoId;

        if (videoId) {
          await db
            .update(livestreams)
            .set({ status: "live", youtubeVideoId: videoId, startedAt: new Date(), updatedAt: new Date() })
            .where(eq(livestreams.id, ls.id));

          await sendStartingNotification(ls.id, ls.name, ls.serviceType, false);
          results.push(`${ls.name}: auto-detected live (${videoId})`);
        }
      } catch (e) {
        console.error("[cron] YouTube poll error:", e);
      }
    }

    // ── Auto-end streams that ran past their window ─────────────────────────
    if (ls.status === "live" && !inWindow) {
      await db
        .update(livestreams)
        .set({ status: "ended", endedAt: new Date(), youtubeVideoId: null, updatedAt: new Date() })
        .where(eq(livestreams.id, ls.id));
      results.push(`${ls.name}: auto-ended`);
    }
  }

  return NextResponse.json({ ok: true, results });
}

async function sendStartingNotification(
  livestreamId: string,
  name: string,
  serviceType: string,
  isSoon: boolean
) {
  try {
    const reminderRows = await db
      .select({ userId: serviceReminders.userId })
      .from(serviceReminders)
      .where(eq(serviceReminders.serviceType, serviceType as "sunday_youtube" | "wednesday_youtube" | "friday_zoom"));

    const userIds = reminderRows.map((r) => r.userId);
    if (!userIds.length) return;

    const isPrayer = serviceType === "friday_zoom";

    await sendPushToUsers(userIds, {
      title: isSoon
        ? (isPrayer ? "Friday Prayer starts soon 🙏" : `${name} starts in 15 minutes 🙌`)
        : (isPrayer ? "Friday Prayer is open 🙏" : `We're live! ${name} 🔴`),
      body: isSoon
        ? (isPrayer ? "Join the family for intercession in 15 minutes" : "Get ready — service starts soon")
        : (isPrayer ? "Tap to join on Zoom — meeting is open" : `${name} has started — join now`),
      data: {
        type: isSoon
          ? (isPrayer ? "prayer_starting_soon" : "service_starting_soon")
          : (isPrayer ? "prayer_now_open" : "service_now_live"),
        livestreamId,
      },
    });
  } catch (e) {
    console.error("[cron] push notification error:", e);
  }
}
