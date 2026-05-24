import { View, Text } from "react-native";
import { HandHeart } from "lucide-react-native";
import { Screen } from "@/components/ui/Screen";
import { COLORS } from "@/lib/theme/colors";

export default function PrayerScreen() {
  return (
    <Screen padded>
      <View className="flex-1 items-center justify-center gap-y-4">
        <View
          style={{ backgroundColor: COLORS.brand.soft }}
          className="w-20 h-20 rounded-full items-center justify-center"
        >
          <HandHeart size={36} color={COLORS.brand.primary} />
        </View>
        <Text className="text-ink text-xl font-bold">Prayer Wall</Text>
        <Text className="text-ink-secondary text-sm text-center leading-6">
          Shared prayer requests and intercession{"\n"}are coming in Phase M3.
        </Text>
      </View>
    </Screen>
  );
}
