import { NextRequest } from "next/server";
import { pusherServer } from "@/lib/pusher";
import { ok, err, withAuth } from "@/lib/api/middleware";

export async function POST(req: NextRequest) {
  return withAuth(req, async (req, user) => {
    const body = await req.text();
    const params = new URLSearchParams(body);
    const socketId = params.get("socket_id");
    const channel = params.get("channel_name");

    if (!socketId || !channel) return err("BAD_REQUEST", "Missing socket_id or channel_name", 400);

    if (channel !== `private-user-${user.sub}`) {
      return err("FORBIDDEN", "Channel not allowed", 403);
    }

    const authResponse = pusherServer.authorizeChannel(socketId, channel);
    return ok(authResponse);
  });
}
