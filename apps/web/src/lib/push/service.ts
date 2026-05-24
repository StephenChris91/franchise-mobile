import Expo, { ExpoPushMessage } from "expo-server-sdk";
import { db, pushTokens, profiles, users } from "@franchise/db";
import { eq, inArray } from "drizzle-orm";

// Lazy singleton
let _expo: Expo | undefined;
function getExpo(): Expo {
  if (!_expo) _expo = new Expo();
  return _expo;
}

export interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: "default" | null;
  badge?: number;
}

/**
 * Send push notification to a single user.
 * Silently skips if the user has no registered tokens or if the
 * notification type is muted in their notificationPrefs.
 */
export async function sendPushToUser(
  userId: string,
  payload: PushPayload,
  prefKey?: keyof NonNullable<typeof profiles.$inferSelect.notificationPrefs>
): Promise<void> {
  try {
    // Check notification preference if a key is provided
    if (prefKey) {
      const [profile] = await db
        .select({ notificationPrefs: profiles.notificationPrefs })
        .from(profiles)
        .where(eq(profiles.userId, userId))
        .limit(1);

      const prefs = profile?.notificationPrefs;
      if (prefs && prefs[prefKey] === false) return;
    }

    // Fetch all valid push tokens for this user
    const tokens = await db
      .select({ token: pushTokens.token })
      .from(pushTokens)
      .where(eq(pushTokens.userId, userId));

    if (!tokens.length) return;

    const validTokens = tokens
      .map((t) => t.token)
      .filter((t) => Expo.isExpoPushToken(t));

    if (!validTokens.length) return;

    const messages: ExpoPushMessage[] = validTokens.map((to) => ({
      to,
      title: payload.title,
      body: payload.body,
      data: payload.data ?? {},
      sound: payload.sound ?? "default",
      badge: payload.badge,
    }));

    const expo = getExpo();
    const chunks = expo.chunkPushNotifications(messages);

    for (const chunk of chunks) {
      const tickets = await expo.sendPushNotificationsAsync(chunk);

      // Collect tokens that are no longer valid and delete them
      const invalidTokens: string[] = [];
      for (let i = 0; i < tickets.length; i++) {
        const ticket = tickets[i];
        if (ticket?.status === "error") {
          if (
            ticket.details?.error === "DeviceNotRegistered" ||
            ticket.details?.error === "InvalidCredentials"
          ) {
            const token = messages[i]?.to as string;
            if (token) invalidTokens.push(token);
          }
        }
      }

      if (invalidTokens.length) {
        await db
          .delete(pushTokens)
          .where(inArray(pushTokens.token, invalidTokens));
      }
    }
  } catch (err) {
    // Never let push failures surface to callers — push is best-effort
    console.error("[push] sendPushToUser error:", err);
  }
}

/**
 * Send push notification to multiple users (batch).
 * Each user's token list is fetched and deduped.
 */
export async function sendPushToUsers(
  userIds: string[],
  payload: PushPayload
): Promise<void> {
  if (!userIds.length) return;
  await Promise.all(userIds.map((id) => sendPushToUser(id, payload)));
}
