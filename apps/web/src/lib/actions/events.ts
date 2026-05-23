"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "../../../auth";
import { db, events, eventRsvps, adminActions } from "../../../db";
import { sendRsvpConfirmation } from "@/lib/email";
import { getEventById } from "@/lib/events";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  if (session.user.role !== "admin" && session.user.role !== "pastor")
    throw new Error("Unauthorized");
  return session.user;
}

async function requireApproved() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  if (session.user.approvalStatus !== "approved")
    throw new Error("Account pending approval");
  return session.user;
}

async function logAction(adminId: string, actionType: string, targetId: string, metadata: Record<string, unknown> = {}) {
  await db.insert(adminActions).values({ adminId, actionType, targetType: "event", targetId, metadata });
}

// ─── Admin event CRUD ─────────────────────────────────────────────────────────

export async function createEvent(data: {
  title: string;
  slug: string;
  description: string;
  eventType: "service" | "conference" | "outreach" | "social" | "training" | "prayer" | "other";
  location: string;
  locationUrl?: string;
  startsAt: Date;
  endsAt: Date;
  capacity?: number;
  rsvpRequired: boolean;
  isPublished: boolean;
  coverImageUrl?: string;
}) {
  const admin = await requireAdmin();

  const [event] = await db
    .insert(events)
    .values({ ...data, createdBy: admin.id })
    .returning();

  await logAction(admin.id!, "create_event", event.id, { title: data.title });
  revalidatePath("/admin/events");
  revalidatePath("/events");
  return { ok: true, event };
}

export async function updateEvent(id: string, data: Partial<{
  title: string;
  slug: string;
  description: string;
  eventType: "service" | "conference" | "outreach" | "social" | "training" | "prayer" | "other";
  location: string;
  locationUrl: string | null;
  startsAt: Date;
  endsAt: Date;
  capacity: number | null;
  rsvpRequired: boolean;
  isPublished: boolean;
  coverImageUrl: string | null;
}>) {
  const admin = await requireAdmin();

  await db
    .update(events)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(events.id, id));

  await logAction(admin.id!, "update_event", id, data as Record<string, unknown>);
  revalidatePath("/admin/events");
  revalidatePath("/events");
  return { ok: true };
}

export async function deleteEvent(id: string) {
  const admin = await requireAdmin();

  await db.delete(events).where(eq(events.id, id));

  await logAction(admin.id!, "delete_event", id, {});
  revalidatePath("/admin/events");
  revalidatePath("/events");
  return { ok: true };
}

export async function duplicateEvent(id: string) {
  const admin = await requireAdmin();
  const event = await getEventById(id);
  if (!event) throw new Error("Event not found");

  const newSlug = `${event.slug}-copy-${Date.now()}`;
  const [newEvent] = await db
    .insert(events)
    .values({
      ...event,
      id: undefined as unknown as string,
      slug: newSlug,
      title: `${event.title} (Copy)`,
      isPublished: false,
      createdBy: admin.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  revalidatePath("/admin/events");
  return { ok: true, event: newEvent };
}

// ─── RSVP ─────────────────────────────────────────────────────────────────────

export async function upsertRsvp(eventId: string, status: "going" | "interested" | "not_going") {
  const user = await requireApproved();

  const event = await getEventById(eventId);
  if (!event || !event.isPublished) throw new Error("Event not found");

  // Check capacity for "going" RSVPs
  if (status === "going" && event.capacity) {
    const [{ count }] = await db
      .select({ count: db.$count(eventRsvps, and(eq(eventRsvps.eventId, eventId), eq(eventRsvps.status, "going"))) })
      .from(eventRsvps)
      .where(and(eq(eventRsvps.eventId, eventId), eq(eventRsvps.status, "going")));

    const existing = await db
      .select()
      .from(eventRsvps)
      .where(and(eq(eventRsvps.eventId, eventId), eq(eventRsvps.userId, user.id!)))
      .limit(1);

    const isUpgrade = existing.length > 0 && existing[0].status !== "going";
    if (Number(count) >= event.capacity && isUpgrade) {
      throw new Error("Event is at capacity");
    }
  }

  await db
    .insert(eventRsvps)
    .values({ eventId, userId: user.id!, status })
    .onConflictDoUpdate({
      target: [eventRsvps.eventId, eventRsvps.userId],
      set: { status, updatedAt: new Date() },
    });

  // Send confirmation email for "going" RSVPs
  if (status === "going") {
    const session = await auth();
    const email = session?.user?.email;
    const name = session?.user?.name ?? "Member";
    if (email) {
      await sendRsvpConfirmation({ to: email, fullName: name, event }).catch(() => {});
    }
  }

  revalidatePath(`/events/${event.slug}`);
  revalidatePath("/events");
  return { ok: true };
}

export async function cancelRsvp(eventId: string) {
  const user = await requireApproved();

  await db
    .delete(eventRsvps)
    .where(and(eq(eventRsvps.eventId, eventId), eq(eventRsvps.userId, user.id!)));

  revalidatePath("/events");
  return { ok: true };
}
