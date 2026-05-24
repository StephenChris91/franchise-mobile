/**
 * Pusher real-time client.
 *
 * Set these env vars in apps/mobile/.env.local:
 *   EXPO_PUBLIC_PUSHER_KEY=your_key
 *   EXPO_PUBLIC_PUSHER_CLUSTER=eu   (or your cluster)
 */
import Pusher from "pusher-js";
import { getAccessToken } from "../auth/storage";

const PUSHER_KEY = process.env.EXPO_PUBLIC_PUSHER_KEY ?? "";
const PUSHER_CLUSTER = process.env.EXPO_PUBLIC_PUSHER_CLUSTER ?? "eu";
const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "https://thefranchiselagos.com.ng";

// Lazy singleton — created only when first imported
let _client: Pusher | null = null;

export function getPusherClient(): Pusher {
  if (_client) return _client;

  _client = new Pusher(PUSHER_KEY, {
    cluster: PUSHER_CLUSTER,
    // Private channels need JWT authorisation via the server
    channelAuthorization: {
      endpoint: `${API_URL}/api/v1/pusher/auth`,
      transport: "ajax",
      customHandler: async ({ socketId, channelName }, callback) => {
        try {
          const token = await getAccessToken();
          const res = await fetch(`${API_URL}/api/v1/pusher/auth`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({
              socket_id: socketId,
              channel_name: channelName,
            }),
          });
          if (!res.ok) throw new Error("Pusher auth failed");
          const data = await res.json();
          callback(null, data as { auth: string });
        } catch (err) {
          callback(err instanceof Error ? err : new Error("Pusher auth failed"), null);
        }
      },
    },
  });

  return _client;
}

/** Disconnect and wipe the singleton (call on logout). */
export function disconnectPusher() {
  _client?.disconnect();
  _client = null;
}
