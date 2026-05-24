import { View, Text, StyleSheet } from "react-native";
import { router } from "expo-router";
import { Clock } from "lucide-react-native";
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
        Toast.show({ type: "info", text1: "Still pending", text2: "Your account is still under review." });
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

  const steps = [
    { step: "1", text: "Account created ✓" },
    { step: "2", text: "Pastoral review (in progress)" },
    { step: "3", text: "Welcome email sent" },
    { step: "4", text: "Full access granted" },
  ];

  return (
    <Screen padded>
      <View style={styles.root}>

        {/* Clock icon */}
        <View style={styles.iconCircle}>
          <Clock size={48} color={COLORS.brand.primary} />
        </View>

        {/* Copy */}
        <View style={styles.copyWrap}>
          <Text style={[styles.heading, { color: COLORS.ink.primary }]}>
            Almost there,{" "}
            {user?.fullName?.split(" ")[0] ?? "friend"}!
          </Text>
          <Text style={[styles.body, { color: COLORS.ink.secondary }]}>
            Your account is being reviewed by our pastoral team. You'll receive
            an email once you're approved.
          </Text>
        </View>

        {/* Steps card */}
        <View style={[styles.card, { backgroundColor: COLORS.bg.card, borderColor: COLORS.border.default }]}>
          {steps.map(({ step, text }) => (
            <View key={step} style={styles.stepRow}>
              <View style={[styles.stepDot, { backgroundColor: COLORS.brand.soft }]}>
                <Text style={{ color: COLORS.brand.primary, fontSize: 11, fontWeight: "700" }}>
                  {step}
                </Text>
              </View>
              <Text style={{ color: COLORS.ink.secondary, fontSize: 14 }}>{text}</Text>
            </View>
          ))}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Button variant="primary" size="lg" loading={checking} onPress={handleCheckStatus}>
            Check Status
          </Button>
          <Button variant="secondary" size="lg" onPress={() => {}}>
            Contact Us
          </Button>
          <Button variant="ghost" size="md" onPress={handleSignOut}>
            Sign out
          </Button>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
    paddingVertical: 48,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "rgba(212,166,74,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  copyWrap: {
    alignItems: "center",
    gap: 8,
  },
  heading: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
  },
  body: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 8,
  },
  card: {
    width: "100%",
    borderRadius: 16,
    padding: 20,
    gap: 12,
    borderWidth: 1,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  actions: {
    width: "100%",
    gap: 12,
  },
});
