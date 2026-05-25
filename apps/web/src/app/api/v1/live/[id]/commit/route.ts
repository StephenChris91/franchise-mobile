import { NextRequest } from "next/server";
import { eq, and, count } from "drizzle-orm";
import { db, livestreams, prayerCommitments } from "@franchise/db";
import { ok, err, withApproved } from "@/lib/api/middleware";
import { pusherServer } from "@/lib/pusher";

export const dynamic = "force-dynamic";

// POST — toggle commitment on
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApproved(req, async (_, user) => {
    const { id } = await params;

    const [ls] = await db.select({ id: livestreams.id, serviceType: livestreams.serviceType })
      .from(livestreams).where(eq(livestreams.id, id)).limit(1);
    if (!ls) return err("NOT_FOUND", "Livestream not found", 404);
    if (ls.serviceType !== "friday_zoom") return err("BAD_REQUEST", "Commitments are for prayer sessions only", 400);

    // Upsert (idempotent)
    await db
      .insert(prayerCommitments)
      .values({ livestreamId: id, userId: user.sub })
      .onConflictDoNothing();

    const [{ value: total }] = await db
      .select({ value: count() })
      .from(prayerCommitments)
      .where(eq(prayerCommitments.livestreamId, id));

    pusherServer.trigger(`livestream-${id}`, "commitment-count", { count: total }).catch(() => {});

    return ok({ ok: true, committed: true, count: total });
  });
}

// DELETE — remove commitment
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApproved(req, async (_, user) => {
    const { id } = await params;

    await db
      .delete(prayerCommitments)
      .where(and(eq(prayerCommitments.livestreamId, id), eq(prayerCommitments.userId, user.sub)));

    const [{ value: total }] = await db
      .select({ value: count() })
      .from(prayerCommitments)
      .where(eq(prayerCommitments.livestreamId, id));

    pusherServer.trigger(`livestream-${id}`, "commitment-count", { count: total }).catch(() => {});

    return ok({ ok: true });
  });
}
