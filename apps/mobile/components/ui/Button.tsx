import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  type TouchableOpacityProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import * as Haptics from "expo-haptics";
import { COLORS } from "@/lib/theme/colors";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends Omit<TouchableOpacityProps, "style"> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

const variantConfig: Record<
  Variant,
  { bg: string; border?: string; textColor: string; indicatorColor: string }
> = {
  primary: {
    bg: COLORS.brand.primary,
    textColor: COLORS.bg.page,
    indicatorColor: COLORS.bg.page,
  },
  secondary: {
    bg: "transparent",
    border: "rgba(212,166,74,0.35)",
    textColor: COLORS.brand.primary,
    indicatorColor: COLORS.brand.primary,
  },
  ghost: {
    bg: "transparent",
    textColor: COLORS.ink.secondary,
    indicatorColor: COLORS.ink.secondary,
  },
  danger: {
    bg: "rgba(201,58,58,0.85)",
    textColor: "#ffffff",
    indicatorColor: "#ffffff",
  },
};

const sizeConfig: Record<
  Size,
  { px: number; py: number; fontSize: number; borderRadius: number }
> = {
  sm: { px: 16, py: 8,  fontSize: 14, borderRadius: 999 },
  md: { px: 20, py: 12, fontSize: 16, borderRadius: 999 },
  lg: { px: 24, py: 16, fontSize: 18, borderRadius: 999 },
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  children,
  disabled,
  onPress,
  style,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const v = variantConfig[variant];
  const s = sizeConfig[size];

  async function handlePress(
    e: Parameters<NonNullable<TouchableOpacityProps["onPress"]>>[0]
  ) {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.(e);
  }

  return (
    <TouchableOpacity
      {...props}
      onPress={handlePress}
      disabled={isDisabled}
      activeOpacity={0.75}
      accessibilityRole="button"
      style={[
        baseStyle.btn,
        {
          backgroundColor: v.bg,
          borderRadius: s.borderRadius,
          paddingHorizontal: s.px,
          paddingVertical: s.py,
          opacity: isDisabled ? 0.5 : 1,
          ...(v.border
            ? { borderWidth: 1, borderColor: v.border }
            : {}),
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={v.indicatorColor} />
      ) : typeof children === "string" || typeof children === "number" ? (
        // Plain text label — wrap in styled Text
        <Text
          style={{
            color: v.textColor,
            fontSize: s.fontSize,
            fontWeight: "600",
            textAlign: "center",
          }}
        >
          {children}
        </Text>
      ) : (
        // Complex children (icon+text rows, etc.) — render as-is
        children
      )}
    </TouchableOpacity>
  );
}

const baseStyle = StyleSheet.create({
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
});
