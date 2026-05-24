import { Stack } from "expo-router";
import { COLORS } from "@/lib/theme/colors";

const DARK_HEADER = {
  headerStyle: { backgroundColor: COLORS.bg.elevated },
  headerTintColor: COLORS.brand.primary,
  headerTitleStyle: { color: COLORS.ink.primary },
  headerShadowVisible: false,
} as const;

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* ── Tab navigator ───────────────────────────────────────── */}
      <Stack.Screen name="(tabs)" />

      {/* ── Post detail (slides in from right) ──────────────────── */}
      <Stack.Screen
        name="feed/[id]"
        options={{
          headerShown: true,
          headerTitle: "Post",
          ...DARK_HEADER,
          animation: "slide_from_right",
        }}
      />

      {/* ── Post composer (slides up as full-screen modal) ───────── */}
      <Stack.Screen
        name="composer"
        options={{
          headerShown: true,
          headerTitle: "New Post",
          ...DARK_HEADER,
          presentation: "modal",
          animation: "slide_from_bottom",
        }}
      />

      {/* ── Groups list ─────────────────────────────────────────── */}
      <Stack.Screen
        name="groups/index"
        options={{
          headerShown: true,
          headerTitle: "Groups",
          ...DARK_HEADER,
          animation: "slide_from_right",
        }}
      />

      {/* ── Group detail ────────────────────────────────────────── */}
      <Stack.Screen
        name="groups/[slug]"
        options={{
          headerShown: true,
          headerTitle: "",
          ...DARK_HEADER,
          animation: "slide_from_right",
        }}
      />

      {/* ── Member directory ────────────────────────────────────── */}
      <Stack.Screen
        name="members/index"
        options={{
          headerShown: true,
          headerTitle: "Members",
          ...DARK_HEADER,
          animation: "slide_from_right",
        }}
      />

      {/* ── Public profile ──────────────────────────────────────── */}
      <Stack.Screen
        name="profile/[username]"
        options={{
          headerShown: true,
          headerTitle: "",
          ...DARK_HEADER,
          animation: "slide_from_right",
        }}
      />

      {/* ── Profile edit (modal) ─────────────────────────────────── */}
      <Stack.Screen
        name="profile/edit"
        options={{
          headerShown: true,
          headerTitle: "Edit Profile",
          ...DARK_HEADER,
          presentation: "modal",
          animation: "slide_from_bottom",
        }}
      />
    </Stack>
  );
}
