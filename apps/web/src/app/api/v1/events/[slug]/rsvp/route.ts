import { NextRequest } from "next/server";
import { and, eq, count } from "drizzle-orm";
import { db, events, eventRsvps } from "@franchise/db";
import { rsvpSchema } from "@franchise/validators";
import { ok, err, withApproved } from "@/lib/api/middleware";
import { sendRsvpConfirmation } from "@/lib/email";

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  return withApproved(req, async (req, user) => {
    const { slug } = await params;
    let body: unknown;
    try { body = await req.json(); } catch { return err("BAD_REQUEST", "Invalid JSON", 400); }

    const parsed = rsvpSchema.safeParse(body);
    if (!parsed.success) return err("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input", 400);

    const [event] = await db.select().from(events).where(and(eq(events.slug, slug), eq(events.isPublished, true))).limit(1);
    if (!event) return err("NOT_FOUND", "Event not found", 404);

    const { status, guestsCount, notes } = parsed.data;

    if (status === "going" && event.capacity) {
      const [{ count: goingCount }] = await db.select({ count: count() }).from(eventRsvps).where(and(eq(eventRsvps.eventId, event.id), eq(eventRsvps.status, "going")));
      const [existing] = await db.select().from(eventRsvps).where(and(eq(eventRsvps.eventId, event.id), eq(eventRsvps.userId, user.sub))).limit(1);
      const isUpgrade = existing && existing.status !== "going";
      if (goingCount >= event.capacity && isUpgrade) return err("CONFLICT", "Event is at capacity", 409);
    }

    await db.insert(eventRsvps).values({ eventId: event.id, userId: user.sub, status, guestsCount, notes: notes ?? null })
      .onConflictDoUpdate({ target: [eventRsvps.eventId, eventRsvps.userId], set: { status, guestsCount, notes: notes ?? null, updatedAt: new Date() } });

    if (status === "going") {
      // We can't call auth() from an API route safely in the mobile context;
      // just use data we have from the JWT.
      sendRsvpConfirmation({ to: user.email, fullName: user.username, event }).catch(() => {});
    }

    return ok({ ok: true });
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  return withApproved(req, async (_, user) => {
    const { slug } = await params;
    const [event] = await db.select().from(events).where(eq(events.slug, slug)).limit(1);
    if (!event) return err("NOT_FOUND", "Event not found", 404);

    await db.delete(eventRsvps).where(and(eq(eventRsvps.eventId, event.id), eq(eventRsvps.userId, user.sub)));
    return ok({ ok: true });
  });
}
