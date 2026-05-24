import { View, Text } from "react-native";
import { router } from "expo-router";
import { Clock, RefreshCw, MessageCircle, LogOut } from "lucide-react-native";
import { useState } from "react";
import Toast from "react-native-toast-message";
import { useAuthStore } from "@/lib/auth/store";
import { Screen } from "@/components/ui/Screen";
import { Button } from "@/components/ui/Button";
import { COLORS } from "@/lib/theme/colors";

export default function PendingScreen() {
  const { logout, refreshUser } = useAuthStore();
  const user = useAuthStore((s) => s.user);
  const [checking, setChecking] = useState(false);

  async function handleCheckStatus() {
    setChecking(true);
    try {
      await refreshUser();
      const { user: updated } = useAuthStore.getState();
      if (updated?.approvalStatus === "approved") {
        router.replace("/(app)/(tabs)/feed");
      } else {
        Toast.show({
          type: "info",
          text1: "Still pending",
          text2: "Your account is still under review.",
        });
      }
    } catch {
      Toast.show({ type: "error", text1: "Couldn't check status" });
    } finally {
      setChecking(false);
    }
  }

  async function handleSignOut() {
    await logout();
    router.replace("/(auth)/login");
  }

  return (
    <Screen padded>
      <View className="flex-1 items-center justify-center gap-y-6 py-12">

        {/* ── Clock icon ───────────────────────────────────────────────────── */}
        <View
          style={{ backgroundColor: COLORS.brand.soft }}
          className="w-24 h-24 rounded-full items-center justify-center"
        >
          <Clock size={48} color={COLORS.brand.primary} />
        </View>

        {/* ── Copy ─────────────────────────────────────────────────────────── */}
        <View className="items-center gap-y-2">
          <Text className="text-ink text-2xl font-bold text-center">
            Almost there,{" "}
            {user?.fullName?.split(" ")[0] ?? "friend"}!
          </Text>
          <Text className="text-ink-secondary text-base text-center leading-6">
            Your account is being reviewed by our pastoral team.
            You'll receive an email once you're approved.
          </Text>
        </View>

        {/* ── Steps card ───────────────────────────────────────────────────── */}
        <View
          className="bg-card rounded-2xl p-5 w-full gap-y-3"
          style={{ borderWidth: 1, borderColor: COLORS.border.default }}
        >
          {[
            { step: "1", text: "Account created ✓" },
            { step: "2", text: "Pastoral review (in progress)" },
            { step: "3", text: "Welcome email sent" },
            { step: "4", text: "Full access granted" },
          ].map(({ step, text }) => (
            <View key={step} className="flex-row items-center gap-x-3">
              <View
                style={{ backgroundColor: COLORS.brand.soft }}
                className="w-6 h-6 rounded-full items-center justify-center"
              >
                <Text className="text-gold text-xs font-bold">{step}</Text>
              </View>
              <Text className="text-ink-secondary text-sm">{text}</Text>
            </View>
          ))}
        </View>

        {/* ── Actions ──────────────────────────────────────────────────────── */}
        <View className="w-full gap-y-3">
          <Button variant="primary" loading={checking} onPress={handleCheckStatus} size="lg">
            <View className="flex-row items-center gap-x-2">
              <RefreshCw size={16} color="#0a0807" />
              <Text style={{ color: "#0a0807" }} className="font-semibold text-base">
                Check Status
              </Text>
            </View>
          </Button>

          <Button variant="secondary" size="lg" onPress={() => {}}>
            <View className="flex-row items-center gap-x-2">
              <MessageCircle size={16} color={COLORS.brand.primary} />
              <Text className="text-gold font-semibold text-base">Contact Us</Text>
            </View>
          </Button>

          <Button variant="ghost" size="md" onPress={handleSignOut}>
            <View className="flex-row items-center gap-x-2">
              <LogOut size={15} color={COLORS.ink.muted} />
              <Text className="text-ink-muted text-sm">Sign out</Text>
            </View>
          </Button>
        </View>
      </View>
    </Screen>
  );
}
