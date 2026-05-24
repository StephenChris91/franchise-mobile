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
    <Screen dark padded>
      <View className="flex-1 items-center justify-center gap-y-6 py-12">
        {/* Icon */}
        <View className="w-24 h-24 rounded-full bg-brand/20 items-center justify-center">
          <Clock size={48} color={COLORS.brand.primary} />
        </View>

        {/* Text */}
        <View className="items-center gap-y-2">
          <Text className="text-white text-2xl font-bold text-center">
            Almost there,{" "}
            {user?.fullName?.split(" ")[0] ?? "friend"}!
          </Text>
          <Text className="text-gray-400 text-base text-center leading-6">
            Your account is being reviewed by our pastoral team.
            You'll receive an email once you're approved.
          </Text>
        </View>

        {/* Steps */}
        <View className="bg-dark-card rounded-2xl p-5 w-full gap-y-3">
          {[
            { step: "1", text: "Account created ✓" },
            { step: "2", text: "Pastoral review (in progress)" },
            { step: "3", text: "Welcome email sent" },
            { step: "4", text: "Full access granted" },
          ].map(({ step, text }) => (
            <View key={step} className="flex-row items-center gap-x-3">
              <View className="w-6 h-6 rounded-full bg-brand/30 items-center justify-center">
                <Text className="text-brand text-xs font-bold">{step}</Text>
              </View>
              <Text className="text-gray-300 text-sm">{text}</Text>
            </View>
          ))}
        </View>

        {/* Actions */}
        <View className="w-full gap-y-3">
          <Button
            variant="primary"
            loading={checking}
            onPress={handleCheckStatus}
            size="lg"
          >
            <View className="flex-row items-center gap-x-2">
              <RefreshCw size={16} color="#fff" />
              <Text className="text-white font-semibold text-base">Check Status</Text>
            </View>
          </Button>

          <Button variant="secondary" size="lg" onPress={() => {}}>
            <View className="flex-row items-center gap-x-2">
              <MessageCircle size={16} color={COLORS.brand.primary} />
              <Text className="text-brand font-semibold text-base">Contact Us</Text>
            </View>
          </Button>

          <Button variant="ghost" size="md" onPress={handleSignOut}>
            <View className="flex-row items-center gap-x-2">
              <LogOut size={15} color={COLORS.text.secondary} />
              <Text className="text-gray-400 text-sm">Sign out</Text>
            </View>
          </Button>
        </View>
      </View>
    </Screen>
  );
}
