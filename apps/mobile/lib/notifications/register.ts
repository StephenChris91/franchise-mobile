import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { api } from "@/lib/api/client";

/**
 * Request push notification permissions and register the Expo push token
 * with the backend. Safe to call on every app launch — the server upserts.
 *
 * @returns The Expo push token string, or null if not supported / denied.
 */
export async function registerPushToken(): Promise<string | null> {
  // Push notifications only work on physical devices
  if (!Device.isDevice) {
    console.log("[push] skipped — not a physical device");
    return null;
  }

  // Request permission (iOS shows a system prompt the first time)
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("[push] permission not granted");
    return null;
  }

  // Android: create a default notification channel
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Franchise Church",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#d4a64a",
      sound: "default",
    });
  }

  // Get the Expo push token
  const tokenData = await Notifications.getExpoPushTokenAsync();
  const pushToken = tokenData.data;

  const platform: "ios" | "android" = Platform.OS === "ios" ? "ios" : "android";
  const deviceName = Device.deviceName ?? undefined;

  // Register with our backend (fire-and-forget)
  api.pushTokens.register(pushToken, platform, deviceName).catch((err) => {
    console.error("[push] registration failed:", err);
  });

  return pushToken;
}

/**
 * Configure how notifications appear when the app is in the foreground.
 * Call this once at app startup (before any screens mount).
 */
export function configureForegroundNotifications() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}
