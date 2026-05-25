import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db, liveChatMessages } from "@franchise/db";
import { ok, err, withAdmin } from "@/lib/api/middleware";
import { pusherServer } from "@/lib/pusher";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; messageId: string } }
) {
  return withAdmin(req, async () => {
    const { id, messageId } = params;

    const [msg] = await db
      .select()
      .from(liveChatMessages)
      .where(eq(liveChatMessages.id, messageId))
      .limit(1);

    if (!msg || msg.livestreamId !== id) {
      return err("NOT_FOUND", "Message not found", 404);
    }

    await db
      .update(liveChatMessages)
      .set({ isPinned: !msg.isPinned })
      .where(eq(liveChatMessages.id, messageId));

    pusherServer.trigger(`livestream-${id}`, "message-pinned", {
      messageId,
      isPinned: !msg.isPinned,
    }).catch(() => {});

    return ok({ ok: true, isPinned: !msg.isPinned });
  });
}
