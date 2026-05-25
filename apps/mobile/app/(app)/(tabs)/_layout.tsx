import { useEffect, useRef } from "react";
import { Tabs } from "expo-router";
import { View, Text, StyleSheet, Animated } from "react-native";
import { Home, HandHeart, Calendar, Bell, User } from "lucide-react-native";
import { COLORS } from "@/lib/theme/colors";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { queryKeys } from "@/lib/query/keys";

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
    <View style={styles.iconWrap}>
      <View>
        <Icon
          size={22}
          color={focused ? COLORS.brand.primary : COLORS.ink.muted}
          strokeWidth={focused ? 2.5 : 1.8}
        />
        {badge != null && badge > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge > 99 ? "99+" : badge}</Text>
          </View>
        )}
      </View>
      {/* Active dot */}
      {focused && <View style={styles.dot} />}
    </View>
  );
}

function LiveTabIcon({ focused }: { focused: boolean }) {
  const { data: schedule } = useQuery({
    queryKey: queryKeys.live.schedule(),
    queryFn: ({ signal }) => api.live.schedule(signal),
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
  const isLive = schedule?.some((s) => s.status === "live") ?? false;

  // Pulse animation when live
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (isLive) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.4, duration: 600, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      pulse.setValue(1);
    }
  }, [isLive, pulse]);

  return (
    <View style={styles.iconWrap}>
      {isLive ? (
        // Solid red circle with white play triangle when live
        <View style={styles.liveIconCircle}>
          <Animated.View style={[styles.livePulseRing, { transform: [{ scale: pulse }] }]} />
          <View style={styles.liveIconInner}>
            <Text style={styles.liveIconPlay}>▶</Text>
          </View>
        </View>
      ) : (
        <View>
          {/* Outlined play circle when not live */}
          <View style={[styles.playCircle, focused && styles.playCircleActive]}>
            <Text style={[styles.playIcon, { color: focused ? COLORS.bg.page : COLORS.ink.muted }]}>▶</Text>
          </View>
        </View>
      )}
      {focused && !isLive && <View style={styles.dot} />}
    </View>
  );
}

function NotificationTabIcon({ focused }: { focused: boolean }) {
  const { data } = useQuery({
    queryKey: queryKeys.notifications.unreadCount(),
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
          backgroundColor: COLORS.bg.elevated,
          borderTopWidth: 1,
          borderTopColor: COLORS.border.subtle,
          elevation: 0,
          shadowOpacity: 0,
          height: 64,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarLabelStyle: {
          fontSize: 10,
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
        name="live/index"
        options={{
          title: "Live",
          tabBarIcon: ({ focused }) => <LiveTabIcon focused={focused} />,
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

const styles = StyleSheet.create({
  iconWrap: {
    alignItems: "center",
    gap: 3,
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -8,
    backgroundColor: COLORS.status.error,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.brand.primary,
  },
  // Live tab icon
  liveIconCircle: { width: 24, height: 24, alignItems: "center", justifyContent: "center" },
  livePulseRing: {
    position: "absolute",
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.status.live + "33",
  },
  liveIconInner: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.status.live,
    alignItems: "center",
    justifyContent: "center",
  },
  liveIconPlay: { color: "#fff", fontSize: 9, marginLeft: 1 },
  playCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.8,
    borderColor: COLORS.ink.muted,
    alignItems: "center",
    justifyContent: "center",
  },
  playCircleActive: { borderColor: COLORS.brand.primary, backgroundColor: COLORS.brand.primary },
  playIcon: { fontSize: 8, marginLeft: 1 },
});
