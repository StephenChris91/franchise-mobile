import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#1b1b1b" },
        animation: "slide_from_right",
      }}
    />
  );
}
