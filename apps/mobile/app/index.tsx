import { Redirect } from "expo-router";
import { useAuthStore } from "@/lib/auth/store";

/**
 * Entry point — redirect based on auth state.
 * The splash screen stays visible while isLoading is true (see _layout.tsx).
 */
export default function Index() {
  const { isAuthenticated, user, isLoading } = useAuthStore();

  // Still checking tokens — show nothing (splash screen is covering)
  if (isLoading) return null;

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/welcome" />;
  }

  if (user?.approvalStatus === "pending") {
    return <Redirect href="/(auth)/pending" />;
  }

  if (user?.approvalStatus === "rejected") {
    return <Redirect href="/(auth)/login" />;
  }

  return <Redirect href="/(app)/(tabs)/feed" />;
}
