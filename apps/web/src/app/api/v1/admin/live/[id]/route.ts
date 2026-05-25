import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db, livestreams, serviceReminders, pushTokens, profiles } from "@franchise/db";
import { ok, err, withAdmin } from "@/lib/api/middleware";
import { pusherServer } from "@/lib/pusher";
import { sendPushToUsers } from "@/lib/push/service";
import { z } from "zod";

export const dynamic = "force-dynamic";

const updateSchema = z.object({
  status: z.enum(["scheduled", "live", "ended"]).optional(),
  youtubeVideoId: z.string().max(20).nullable().optional(),
  replayUrl: z.string().url().nullable().optional(),
  prayerFocus: z.string().max(1000).nullable().optional(),
  prayerVerse: z.string().max(100).nullable().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAdmin(req, async (req) => {
    const { id } = params;

    let body: unknown;
    try { body = await req.json(); } catch { return err("BAD_REQUEST", "Invalid JSON", 400); }

    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return err("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input", 400);

    const [ls] = await db.select().from(livestreams).where(eq(livestreams.id, id)).limit(1);
    if (!ls) return err("NOT_FOUND", "Livestream not found", 404);

    const updateData: Partial<typeof livestreams.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (parsed.data.status !== undefined) updateData.status = parsed.data.status;
    if (parsed.data.youtubeVideoId !== undefined) updateData.youtubeVideoId = parsed.data.youtubeVideoId;
    if (parsed.data.replayUrl !== undefined) updateData.replayUrl = parsed.data.replayUrl;
    if (parsed.data.prayerFocus !== undefined) updateData.prayerFocus = parsed.data.prayerFocus;
    if (parsed.data.prayerVerse !== undefined) updateData.prayerVerse = parsed.data.prayerVerse;

    // Handle going live
    if (parsed.data.status === "live" && ls.status !== "live") {
      updateData.startedAt = new Date();
      updateData.endedAt = null;

      // Notify users with active reminders for this service type
      await triggerLiveNotification(id, ls.name, ls.serviceType);
    }

    // Handle ending stream
    if (parsed.data.status === "ended" && ls.status === "live") {
      updateData.endedAt = new Date();
      updateData.youtubeVideoId = null; // clear live video ID
    }

    await db.update(livestreams).set(updateData).where(eq(livestreams.id, id));

    // Broadcast status change via Pusher
    pusherServer.trigger(`livestream-${id}`, "status-change", {
      status: parsed.data.status ?? ls.status,
      youtubeVideoId: parsed.data.youtubeVideoId ?? ls.youtubeVideoId,
    }).catch(() => {});

    return ok({ ok: true });
  });
}

async function triggerLiveNotification(
  livestreamId: string,
  name: string,
  serviceType: string
) {
  try {
    // Find all users who have active reminders for this service type
    const reminderUsers = await db
      .select({ userId: serviceReminders.userId })
      .from(serviceReminders)
      .where(eq(serviceReminders.serviceType, serviceType as "sunday_youtube" | "wednesday_youtube" | "friday_zoom"))
      .then((rows) => rows.filter((r) => r.userId));

    if (!reminderUsers.length) return;

    const userIds = reminderUsers.map((r) => r.userId);

    const isPrayer = serviceType === "friday_zoom";

    await sendPushToUsers(userIds, {
      title: isPrayer ? "Friday Prayer is open 🙏" : `We're live! ${name} 🔴`,
      body: isPrayer
        ? "Friday Prayer is open — tap to join on Zoom"
        : `${name} has started — join the family now`,
      data: {
        type: isPrayer ? "prayer_now_open" : "service_now_live",
        livestreamId,
      },
    });
  } catch (e) {
    console.error("[live] notification error:", e);
  }
}
