import { View, Text } from "react-native";
import { Calendar } from "lucide-react-native";
import { Screen } from "@/components/ui/Screen";
import { COLORS } from "@/lib/theme/colors";

export default function EventsScreen() {
  return (
    <Screen padded>
      <View className="flex-1 items-center justify-center gap-y-4">
        <View className="w-20 h-20 rounded-full bg-brand/10 items-center justify-center">
          <Calendar size={36} color={COLORS.brand.primary} />
        </View>
        <Text className="text-gray-900 text-xl font-bold">Events</Text>
        <Text className="text-gray-400 text-sm text-center leading-6">
          Church events and RSVP{"\n"}are coming in Phase M3.
        </Text>
      </View>
    </Screen>
  );
}
