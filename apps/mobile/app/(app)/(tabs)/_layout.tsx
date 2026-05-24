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
    <View className="items-center gap-y-1">
      <View className="relative">
        <Icon
          size={22}
          color={focused ? COLORS.brand.primary : COLORS.ink.muted}
          strokeWidth={focused ? 2.5 : 1.8}
        />
        {badge != null && badge > 0 && (
          <View className="absolute -top-1 -right-2 bg-danger rounded-full min-w-[16px] h-4 items-center justify-center px-1">
            <Text className="text-white text-[10px] font-bold">
              {badge > 99 ? "99+" : badge}
            </Text>
          </View>
        )}
      </View>
      {/* Active dot indicator */}
      {focused && (
        <View
          style={{
            width: 4,
            height: 4,
            borderRadius: 2,
            backgroundColor: COLORS.brand.primary,
          }}
        />
      )}
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
        tabBarInactiveTintColor: COLORS.ink.muted,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: COLORS.border.subtle,
          backgroundColor: COLORS.bg.elevated,
          elevation: 0,
          shadowOpacity: 0,
          height: 64,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "500",
          marginTop: 0,
        },
        // Hide the default label when we show a dot; keep labels for accessibility
        tabBarShowLabel: true,
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
