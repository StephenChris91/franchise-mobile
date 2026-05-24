// NOTE: expo-notifications must NOT be statically imported at the top level.
// In Expo Go (SDK 53+), the module crashes at initialization time — before any
// runtime guard can run. We use lazy require() inside each function instead,
// which Metro only executes when the function is actually called.
import * as Device from "expo-device";
import { Platform } from "react-native";
import Constants from "expo-constants";
import { api } from "@/lib/api/client";

/**
 * Returns true when running inside Expo Go.
 * Push notifications (remote) are NOT supported in Expo Go since SDK 53.
 * They require a development build or production build.
 */
function isExpoGo(): boolean {
  return Constants.appOwnership === "expo";
}

/**
 * Configure how notifications appear when the app is in the foreground.
 * No-ops silently in Expo Go (not supported since SDK 53).
 * Call once at app startup before any screens mount.
 */
export function configureForegroundNotifications(): void {
  if (isExpoGo()) return; // skip — crashes in Expo Go since SDK 53

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Notifications = require("expo-notifications") as typeof import("expo-notifications");
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

/**
 * Request push notification permissions and register the Expo push token
 * with the backend. Safe to call on every app launch — the server upserts.
 *
 * Returns null in Expo Go, on simulators, or if permission is denied.
 */
export async function registerPushToken(): Promise<string | null> {
  // Push tokens are not supported in Expo Go since SDK 53
  if (isExpoGo()) {
    console.log("[push] skipped — Expo Go does not support remote push notifications");
    console.log("[push] Use a development build: https://docs.expo.dev/develop/development-builds/introduction/");
    return null;
  }

  // Push notifications only work on physical devices
  if (!Device.isDevice) {
    console.log("[push] skipped — not a physical device");
    return null;
  }

  // Lazy require — only runs on dev/prod builds (never in Expo Go)
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Notifications = require("expo-notifications") as typeof import("expo-notifications");

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
