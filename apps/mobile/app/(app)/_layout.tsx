import { Stack } from "expo-router";
import { COLORS } from "@/lib/theme/colors";

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* The main tab navigator */}
      <Stack.Screen name="(tabs)" />
      {/* Profile edit — slides up as a modal above the tabs */}
      <Stack.Screen
        name="profile/edit"
        options={{
          headerShown: true,
          headerTitle: "Edit Profile",
          headerTintColor: COLORS.brand.primary,
          headerStyle: { backgroundColor: COLORS.bg.primary },
          presentation: "modal",
          animation: "slide_from_bottom",
        }}
      />
    </Stack>
  );
}
