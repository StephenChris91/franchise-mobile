import { View, Text } from "react-native";
import { Bell } from "lucide-react-native";
import { Screen } from "@/components/ui/Screen";
import { COLORS } from "@/lib/theme/colors";

export default function NotificationsScreen() {
  return (
    <Screen padded>
      <View className="flex-1 items-center justify-center gap-y-4">
        <View
          style={{ backgroundColor: COLORS.brand.soft }}
          className="w-20 h-20 rounded-full items-center justify-center"
        >
          <Bell size={36} color={COLORS.brand.primary} />
        </View>
        <Text className="text-ink text-xl font-bold">Notifications</Text>
        <Text className="text-ink-secondary text-sm text-center leading-6">
          Activity and mentions{"\n"}are coming in Phase M4.
        </Text>
      </View>
    </Screen>
  );
}
