// Must import global.css so NativeWind registers custom-config color classes
import "../global.css";
import { useEffect, useRef } from "react";
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import { GestureHandlerRootView } from "react-native-gesture-handler";
// expo-notifications must NOT be statically imported — it crashes at module
// load time in Expo Go (SDK 53+). We lazy-require it inside useEffect instead.
import Constants from "expo-constants";
import {
  configureForegroundNotifications,
  registerPushToken,
} from "@/lib/notifications/register";
import { analytics } from "@/lib/analytics";
import {
  DancingScript_400Regular,
  DancingScript_700Bold,
} from "@expo-google-fonts/dancing-script";
import {
  Fraunces_400Regular,
  Fraunces_600SemiBold,
  Fraunces_700Bold,
} from "@expo-google-fonts/fraunces";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import Toast from "react-native-toast-message";
import { useAuthStore } from "@/lib/auth/store";
import { queryClient, asyncStoragePersister } from "@/lib/query/client";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const checkAuth = useAuthStore((s) => s.checkAuth);
  const isLoading = useAuthStore((s) => s.isLoading);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const router = useRouter();
  const notifResponseListener = useRef<{ remove(): void } | null>(null);

  const [fontsLoaded] = useFonts({
    DancingScript_400Regular,
    DancingScript_700Bold,
    Fraunces_400Regular,
    Fraunces_600SemiBold,
    Fraunces_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    // Safe to call here — the function no-ops in Expo Go (not at module scope)
    configureForegroundNotifications();
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isLoading && fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [isLoading, fontsLoaded]);

  // Register push token once auth resolves
  useEffect(() => {
    if (isAuthenticated) {
      registerPushToken().catch(() => {});
      analytics.identify("user"); // TODO: pass actual userId when auth store exposes it
    }
  }, [isAuthenticated]);

  // Handle notification tap → deep link to the relevant screen
  // Skip in Expo Go — expo-notifications crashes at module load time since SDK 53.
  // Lazy require() ensures the module is never initialized in Expo Go.
  useEffect(() => {
    if (Constants.appOwnership === "expo") return;

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { addNotificationResponseReceivedListener } = require("expo-notifications") as typeof import("expo-notifications");

    notifResponseListener.current = addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data as Record<string, unknown>;
        if (data.type === "comment" && data.postId) {
          router.push(`/(app)/feed/${data.postId}`);
        } else if (data.type === "reaction" && data.postId) {
          router.push(`/(app)/feed/${data.postId}`);
        } else if (data.type === "prayer_now_open" || data.type === "prayer_starting_soon") {
          router.push("/(app)/live/prayer");
        } else if ((data.type === "service_now_live" || data.type === "service_starting_soon") && data.livestreamId) {
          router.push(`/(app)/live/${data.livestreamId}`);
        }
      }
    );
    return () => {
      notifResponseListener.current?.remove();
    };
  }, [router]);

  return (
    // Required by react-native-gesture-handler (@gorhom/bottom-sheet)
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister: asyncStoragePersister }}
      >
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(app)" />
        </Stack>
        <Toast />
      </PersistQueryClientProvider>
    </GestureHandlerRootView>
  );
}
