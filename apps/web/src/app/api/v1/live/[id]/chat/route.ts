import { NextRequest } from "next/server";
import { eq, and, lt, desc } from "drizzle-orm";
import { db, livestreams, liveChatMessages, profiles } from "@franchise/db";
import { ok, err, withApproved, decodeCursor, encodeCursor } from "@/lib/api/middleware";
import { pusherServer } from "@/lib/pusher";
import { z } from "zod";

export const dynamic = "force-dynamic";

const CHAT_REACTION_TYPES = ["amen", "praying", "love", "fire", "receiving"] as const;

const sendSchema = z.object({
  content: z.string().min(1).max(300),
  reactionType: z.enum(CHAT_REACTION_TYPES).optional(),
});

// GET /api/v1/live/:id/chat — paginated history
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApproved(req, async (req) => {
    const { id } = await params;
    const cursor = req.nextUrl.searchParams.get("cursor");
    const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") ?? 50), 100);

    const [ls] = await db.select({ id: livestreams.id }).from(livestreams).where(eq(livestreams.id, id)).limit(1);
    if (!ls) return err("NOT_FOUND", "Livestream not found", 404);

    const cursorData = cursor ? decodeCursor(cursor) : null;

    const rows = await db
      .select({
        id: liveChatMessages.id,
        content: liveChatMessages.content,
        reactionType: liveChatMessages.reactionType,
        isPinned: liveChatMessages.isPinned,
        createdAt: liveChatMessages.createdAt,
        userId: liveChatMessages.userId,
        username: profiles.username,
        fullName: profiles.fullName,
        photoUrl: profiles.photoUrl,
        role: profiles.role,
      })
      .from(liveChatMessages)
      .innerJoin(profiles, eq(liveChatMessages.userId, profiles.userId))
      .where(
        and(
          eq(liveChatMessages.livestreamId, id),
          eq(liveChatMessages.isHidden, false),
          ...(cursorData
            ? [lt(liveChatMessages.createdAt, cursorData.createdAt)]
            : [])
        )
      )
      .orderBy(desc(liveChatMessages.createdAt))
      .limit(limit + 1);

    const hasMore = rows.length > limit;
    const items = rows.slice(0, limit).reverse(); // newest-last for chat

    const nextCursor = hasMore
      ? encodeCursor(items[0]!.id, items[0]!.createdAt)
      : null;

    return ok({
      data: items.map((r) => ({
        id: r.id,
        content: r.content,
        reactionType: r.reactionType,
        isPinned: r.isPinned,
        createdAt: r.createdAt.toISOString(),
        author: {
          userId: r.userId,
          username: r.username,
          fullName: r.fullName,
          photoUrl: r.photoUrl,
          role: r.role,
        },
      })),
      nextCursor,
      hasMore,
    });
  });
}

// POST /api/v1/live/:id/chat — send message or reaction
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApproved(req, async (req, user) => {
    const { id } = await params;

    let body: unknown;
    try { body = await req.json(); } catch { return err("BAD_REQUEST", "Invalid JSON", 400); }

    const parsed = sendSchema.safeParse(body);
    if (!parsed.success) return err("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input", 400);

    const [ls] = await db.select({ id: livestreams.id }).from(livestreams).where(eq(livestreams.id, id)).limit(1);
    if (!ls) return err("NOT_FOUND", "Livestream not found", 404);

    const [profile] = await db.select().from(profiles).where(eq(profiles.userId, user.sub)).limit(1);
    if (!profile) return err("NOT_FOUND", "Profile not found", 404);

    const [msg] = await db
      .insert(liveChatMessages)
      .values({
        livestreamId: id,
        userId: user.sub,
        content: parsed.data.content,
        reactionType: parsed.data.reactionType ?? null,
      })
      .returning();

    const msgPayload = {
      id: msg!.id,
      content: msg!.content,
      reactionType: msg!.reactionType,
      isPinned: false,
      createdAt: msg!.createdAt.toISOString(),
      author: {
        userId: user.sub,
        username: profile.username,
        fullName: profile.fullName,
        photoUrl: profile.photoUrl,
        role: profile.role,
      },
    };

    // Broadcast via Pusher
    pusherServer.trigger(`livestream-${id}`, "new-message", msgPayload).catch(() => {});

    return ok(msgPayload, 201);
  });
}
