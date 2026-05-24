import { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { useNetInfo } from "@react-native-community/netinfo";
import { COLORS } from "@/lib/theme/colors";

export function NetworkBanner() {
  const { isConnected } = useNetInfo();
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Show the banner when offline; hide when back online
    Animated.timing(opacity, {
      toValue: isConnected === false ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isConnected, opacity]);

  if (isConnected !== false) return null;

  return (
    <Animated.View style={[styles.banner, { opacity }]}>
      <View style={styles.dot} />
      <Text style={styles.text}>No internet connection</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: COLORS.status.warning,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.bg.page,
    opacity: 0.8,
  },
  text: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.bg.page,
  },
});
