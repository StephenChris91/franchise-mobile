import { NextRequest } from "next/server";
import { and, eq, count } from "drizzle-orm";
import { db, events, eventRsvps } from "@franchise/db";
import { ok, err, withAuth } from "@/lib/api/middleware";

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  return withAuth(req, async (_, user) => {
    const { slug } = await params;
    const [event] = await db.select().from(events).where(and(eq(events.slug, slug), eq(events.isPublished, true))).limit(1);
    if (!event) return err("NOT_FOUND", "Event not found", 404);

    const [going] = await db.select({ count: count() }).from(eventRsvps).where(and(eq(eventRsvps.eventId, event.id), eq(eventRsvps.status, "going")));
    const [interested] = await db.select({ count: count() }).from(eventRsvps).where(and(eq(eventRsvps.eventId, event.id), eq(eventRsvps.status, "interested")));
    const [userRsvp] = await db.select({ status: eventRsvps.status, guestsCount: eventRsvps.guestsCount }).from(eventRsvps).where(and(eq(eventRsvps.eventId, event.id), eq(eventRsvps.userId, user.sub))).limit(1);

    return ok({
      id: event.id, slug: event.slug, title: event.title, description: event.description,
      coverImageUrl: event.coverImageUrl, eventType: event.eventType, location: event.location,
      locationUrl: event.locationUrl, startsAt: event.startsAt.toISOString(), endsAt: event.endsAt.toISOString(),
      capacity: event.capacity, rsvpRequired: event.rsvpRequired, createdAt: event.createdAt.toISOString(),
      rsvpCounts: { going: going?.count ?? 0, interested: interested?.count ?? 0 },
      userRsvp: userRsvp ?? null,
    });
  });
}
