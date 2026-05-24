import { useEffect, useRef } from "react";
import { Animated, View } from "react-native";

interface SkeletonProps {
  width?: number | string;
  height?: number;
  rounded?: boolean;
  className?: string;
}

export function Skeleton({
  width = "100%",
  height = 16,
  rounded = false,
  className,
}: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={{ opacity, width: width as number, height }}
      className={`bg-gray-200 ${rounded ? "rounded-full" : "rounded-lg"} ${className ?? ""}`}
    />
  );
}

export function ProfileSkeleton() {
  return (
    <View className="items-center pt-10 px-5 gap-y-4">
      <Skeleton width={88} height={88} rounded />
      <Skeleton width={160} height={22} />
      <Skeleton width={100} height={16} />
      <Skeleton height={14} />
      <Skeleton height={14} />
    </View>
  );
}
