import { Stack } from "expo-router";
import { COLORS } from "@/lib/theme/colors";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.bg.page },
        animation: "slide_from_right",
      }}
    />
  );
}
