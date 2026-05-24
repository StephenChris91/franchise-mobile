import { TouchableOpacity, Text, ActivityIndicator, type TouchableOpacityProps } from "react-native";
import * as Haptics from "expo-haptics";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends TouchableOpacityProps {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  children: React.ReactNode;
}

// All buttons are pill-shaped (rounded-full) per the Franchise design system
const variantClasses: Record<
  Variant,
  { container: string; text: string; indicatorColor: string }
> = {
  primary: {
    container:      "bg-gold active:bg-gold-deep",
    text:           "text-page font-semibold",
    indicatorColor: "#0a0807",
  },
  secondary: {
    container:      "bg-transparent border border-gold/30 active:bg-gold/10",
    text:           "text-gold font-semibold",
    indicatorColor: "#d4a64a",
  },
  ghost: {
    container:      "bg-transparent active:bg-card",
    text:           "text-ink-secondary font-medium",
    indicatorColor: "#a5a09a",
  },
  danger: {
    container:      "bg-danger/80 active:bg-danger",
    text:           "text-white font-semibold",
    indicatorColor: "#ffffff",
  },
};

const sizeClasses: Record<Size, { container: string; text: string }> = {
  sm: { container: "px-4 py-2 rounded-full", text: "text-sm" },
  md: { container: "px-5 py-3 rounded-full", text: "text-base" },
  lg: { container: "px-6 py-4 rounded-full", text: "text-lg" },
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  children,
  disabled,
  onPress,
  className,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const v = variantClasses[variant];

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
      className={`
        flex-row items-center justify-center
        ${v.container}
        ${sizeClasses[size].container}
        ${isDisabled ? "opacity-50" : ""}
        ${className ?? ""}
      `}
    >
      {loading ? (
        <ActivityIndicator size="small" color={v.indicatorColor} />
      ) : (
        <Text className={`${v.text} ${sizeClasses[size].text}`}>
          {children}
        </Text>
      )}
    </TouchableOpacity>
  );
}
