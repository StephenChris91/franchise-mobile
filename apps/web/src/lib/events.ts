import { and, eq, gte, lte, desc, count, sql } from "drizzle-orm";
import { db, events, eventRsvps, profiles, users } from "../../db";

// ─── Public queries ───────────────────────────────────────────────────────────

export async function getPublishedEvents(upcomingOnly = false) {
  const conditions = [eq(events.isPublished, true)];
  if (upcomingOnly) {
    conditions.push(gte(events.endsAt, new Date()));
  }

  return db
    .select()
    .from(events)
    .where(and(...conditions))
    .orderBy(events.startsAt);
}

export async function getEventBySlug(slug: string) {
  const [event] = await db
    .select()
    .from(events)
    .where(and(eq(events.slug, slug), eq(events.isPublished, true)))
    .limit(1);

  return event ?? null;
}

export async function getEventBySlugAdmin(slug: string) {
  const [event] = await db
    .select()
    .from(events)
    .where(eq(events.slug, slug))
    .limit(1);

  return event ?? null;
}

export async function getEventById(id: string) {
  const [event] = await db.select().from(events).where(eq(events.id, id)).limit(1);
  return event ?? null;
}

// ─── RSVP queries ─────────────────────────────────────────────────────────────

export async function getUserRsvp(eventId: string, userId: string) {
  const [rsvp] = await db
    .select()
    .from(eventRsvps)
    .where(and(eq(eventRsvps.eventId, eventId), eq(eventRsvps.userId, userId)))
    .limit(1);

  return rsvp ?? null;
}

export async function getEventRsvpCounts(eventId: string) {
  const [{ going }] = await db
    .select({ going: count() })
    .from(eventRsvps)
    .where(and(eq(eventRsvps.eventId, eventId), eq(eventRsvps.status, "going")));

  const [{ interested }] = await db
    .select({ interested: count() })
    .from(eventRsvps)
    .where(and(eq(eventRsvps.eventId, eventId), eq(eventRsvps.status, "interested")));

  return { going, interested };
}

export async function getEventRsvpList(eventId: string) {
  return db
    .select({
      status: eventRsvps.status,
      guestsCount: eventRsvps.guestsCount,
      notes: eventRsvps.notes,
      createdAt: eventRsvps.createdAt,
      userId: profiles.userId,
      fullName: profiles.fullName,
      username: profiles.username,
      email: users.email,
      phone: profiles.phone,
    })
    .from(eventRsvps)
    .innerJoin(profiles, eq(eventRsvps.userId, profiles.userId))
    .innerJoin(users, eq(eventRsvps.userId, users.id))
    .where(eq(eventRsvps.eventId, eventId))
    .orderBy(eventRsvps.createdAt);
}

// ─── Admin queries ────────────────────────────────────────────────────────────

export async function getAllEventsAdmin() {
  return db
    .select({
      id: events.id,
      slug: events.slug,
      title: events.title,
      eventType: events.eventType,
      location: events.location,
      startsAt: events.startsAt,
      endsAt: events.endsAt,
      isPublished: events.isPublished,
      rsvpRequired: events.rsvpRequired,
      capacity: events.capacity,
      createdAt: events.createdAt,
    })
    .from(events)
    .orderBy(desc(events.startsAt));
}

// ─── Upcoming teaser for sidebar ──────────────────────────────────────────────

export async function getUpcomingEventTeaser(limit = 3) {
  return db
    .select({
      id: events.id,
      slug: events.slug,
      title: events.title,
      eventType: events.eventType,
      location: events.location,
      startsAt: events.startsAt,
      coverImageUrl: events.coverImageUrl,
    })
    .from(events)
    .where(and(eq(events.isPublished, true), gte(events.endsAt, new Date())))
    .orderBy(events.startsAt)
    .limit(limit);
}

// ─── Reminders (for cron) ─────────────────────────────────────────────────────

export async function getEventsStartingIn24h() {
  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const in25h = new Date(now.getTime() + 25 * 60 * 60 * 1000);

  return db
    .select()
    .from(events)
    .where(
      and(
        eq(events.isPublished, true),
        gte(events.startsAt, in24h),
        lte(events.startsAt, in25h)
      )
    );
}
