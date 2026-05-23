import { NextRequest } from "next/server";
import { and, eq, gte, desc } from "drizzle-orm";
import { db, events } from "@franchise/db";
import { ok, withAuth } from "@/lib/api/middleware";

export async function GET(req: NextRequest) {
  return withAuth(req, async (req) => {
    const upcoming = req.nextUrl.searchParams.get("upcoming") === "true";

    const conditions = [eq(events.isPublished, true), ...(upcoming ? [gte(events.endsAt, new Date())] : [])].filter(Boolean) as Parameters<typeof and>;

    const rows = await db.select().from(events).where(and(...conditions)).orderBy(events.startsAt);

    return ok(rows.map((e) => ({
      id: e.id, slug: e.slug, title: e.title, description: e.description,
      coverImageUrl: e.coverImageUrl, eventType: e.eventType, location: e.location,
      locationUrl: e.locationUrl, startsAt: e.startsAt.toISOString(), endsAt: e.endsAt.toISOString(),
      capacity: e.capacity, rsvpRequired: e.rsvpRequired, createdAt: e.createdAt.toISOString(),
    })));
  });
}
