import { Tabs } from "expo-router";
import { View, Text } from "react-native";
import {
  Home,
  HandHeart,
  Calendar,
  Bell,
  User,
} from "lucide-react-native";
import { COLORS } from "@/lib/theme/colors";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";

function TabIcon({
  icon: Icon,
  focused,
  badge,
}: {
  icon: typeof Home;
  focused: boolean;
  badge?: number;
}) {
  return (
    <View className="items-center">
      <View className="relative">
        <Icon
          size={24}
          color={focused ? COLORS.brand.primary : COLORS.text.secondary}
          strokeWidth={focused ? 2.5 : 1.8}
        />
        {badge != null && badge > 0 && (
          <View className="absolute -top-1 -right-2 bg-red-500 rounded-full min-w-[16px] h-4 items-center justify-center px-1">
            <Text className="text-white text-[10px] font-bold">
              {badge > 99 ? "99+" : badge}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

function NotificationTabIcon({ focused }: { focused: boolean }) {
  const { data } = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: () => api.notifications.unreadCount(),
    refetchInterval: 30_000,
  });
  return <TabIcon icon={Bell} focused={focused} badge={data?.count} />;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.brand.primary,
        tabBarInactiveTintColor: COLORS.text.secondary,
        tabBarStyle: {
          borderTopColor: COLORS.border.default,
          backgroundColor: COLORS.bg.primary,
          elevation: 8,
          shadowOpacity: 0.06,
          shadowRadius: 8,
          height: 60,
          paddingBottom: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "500",
        },
      }}
    >
      <Tabs.Screen
        name="feed/index"
        options={{
          title: "Feed",
          tabBarIcon: ({ focused }) => <TabIcon icon={Home} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="prayer/index"
        options={{
          title: "Prayer",
          tabBarIcon: ({ focused }) => <TabIcon icon={HandHeart} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="events/index"
        options={{
          title: "Events",
          tabBarIcon: ({ focused }) => <TabIcon icon={Calendar} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="notifications/index"
        options={{
          title: "Updates",
          tabBarIcon: ({ focused }) => <NotificationTabIcon focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile/index"
        options={{
          title: "Profile",
          tabBarIcon: ({ focused }) => <TabIcon icon={User} focused={focused} />,
        }}
      />
    </Tabs>
  );
}
