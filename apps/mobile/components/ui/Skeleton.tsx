import { useEffect, useRef } from "react";
import { Animated, View, StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import { COLORS } from "@/lib/theme/colors";

interface SkeletonProps {
  /** Width — only used when no style prop is provided */
  width?: number | string;
  /** Height — only used when no style prop is provided */
  height?: number;
  /** Makes border-radius a full pill (only used when no style prop is provided) */
  rounded?: boolean;
  /** Full style override — takes precedence over width/height/rounded */
  style?: StyleProp<ViewStyle>;
}

export function Skeleton({ width = "100%", height = 16, rounded = false, style }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          opacity,
          backgroundColor: COLORS.bg.cardHover,
        },
        // Apply width/height/rounded only when no style override is provided
        !style && {
          width: width as number,
          height,
          borderRadius: rounded ? 999 : 8,
        },
        style,
      ]}
    />
  );
}

export function ProfileSkeleton() {
  return (
    <View style={styles.profileSkeletonRoot}>
      <Skeleton width={88} height={88} rounded />
      <Skeleton width={160} height={22} />
      <Skeleton width={100} height={16} />
      <Skeleton height={14} />
      <Skeleton height={14} />
    </View>
  );
}

const styles = StyleSheet.create({
  profileSkeletonRoot: {
    alignItems: "center",
    paddingTop: 40,
    paddingHorizontal: 20,
    gap: 16,
  },
});
