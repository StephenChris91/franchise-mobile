import { View, Text } from "react-native";
import { Image } from "expo-image";

interface AvatarProps {
  uri?: string | null;
  name?: string | null;
  size?: number;
  className?: string;
}

export function Avatar({ uri, name, size = 44, className }: AvatarProps) {
  const initials = name
    ? name
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase()
    : "?";

  const fontSize = Math.round(size * 0.38);

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        contentFit="cover"
        transition={200}
        accessibilityLabel={name ?? "User avatar"}
        className={className}
      />
    );
  }

  return (
    <View
      style={{ width: size, height: size, borderRadius: size / 2 }}
      className={`bg-brand items-center justify-center ${className ?? ""}`}
      accessibilityLabel={name ?? "User avatar"}
    >
      <Text style={{ fontSize, lineHeight: fontSize * 1.2 }} className="text-white font-bold">
        {initials}
      </Text>
    </View>
  );
}
