import { NextResponse } from "next/server";
import { db, eventRsvps, profiles, users } from "../../../../../db";
import { and, eq, inArray } from "drizzle-orm";
import { getEventsStartingIn24h } from "@/lib/events";
import { sendEventReminder } from "@/lib/email";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  // Verify Vercel cron secret
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const upcomingEvents = await getEventsStartingIn24h();

    if (upcomingEvents.length === 0) {
      return NextResponse.json({ ok: true, sent: 0, message: "No events starting in 24h" });
    }

    let totalSent = 0;

    for (const event of upcomingEvents) {
      // Get all "going" RSVPs for this event
      const rsvps = await db
        .select({
          userId: eventRsvps.userId,
        })
        .from(eventRsvps)
        .where(
          and(
            eq(eventRsvps.eventId, event.id),
            eq(eventRsvps.status, "going")
          )
        );

      if (rsvps.length === 0) continue;

      const userIds = rsvps.map((r) => r.userId);

      // Fetch user emails and names
      const attendees = await db
        .select({
          email: users.email,
          fullName: profiles.fullName,
        })
        .from(users)
        .innerJoin(profiles, eq(users.id, profiles.userId))
        .where(inArray(users.id, userIds));

      // Send reminder emails
      const sends = attendees
        .filter((a) => a.email)
        .map((a) =>
          sendEventReminder({
            to: a.email!,
            fullName: a.fullName,
            eventTitle: event.title,
            startsAt: event.startsAt,
            location: event.location,
            slug: event.slug,
          }).catch((err) => {
            console.error(`Failed to send reminder to ${a.email}:`, err);
          })
        );

      await Promise.allSettled(sends);
      totalSent += sends.length;
    }

    return NextResponse.json({
      ok: true,
      sent: totalSent,
      events: upcomingEvents.length,
    });
  } catch (err) {
    console.error("event-reminders cron error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
