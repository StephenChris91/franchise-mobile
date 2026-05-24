import { View, Text, StyleSheet } from "react-native";
import { Bell } from "lucide-react-native";
import { Screen } from "@/components/ui/Screen";
import { COLORS } from "@/lib/theme/colors";

export default function NotificationsScreen() {
  return (
    <Screen padded>
      <View style={styles.center}>
        <View style={styles.iconCircle}>
          <Bell size={36} color={COLORS.brand.primary} />
        </View>
        <Text style={[styles.title, { color: COLORS.ink.primary }]}>Notifications</Text>
        <Text style={[styles.body, { color: COLORS.ink.secondary }]}>
          Activity and mentions{"\n"}are coming in Phase M4.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  iconCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: "rgba(212,166,74,0.12)",
    alignItems: "center", justifyContent: "center",
  },
  title: { fontSize: 20, fontWeight: "700" },
  body:  { fontSize: 14, textAlign: "center", lineHeight: 24 },
});
