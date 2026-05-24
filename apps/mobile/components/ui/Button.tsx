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

const variantClasses: Record<Variant, { container: string; text: string }> = {
  primary: {
    container: "bg-brand active:bg-brand-dark",
    text: "text-white font-semibold",
  },
  secondary: {
    container: "bg-white border border-brand active:bg-brand-faint",
    text: "text-brand font-semibold",
  },
  ghost: {
    container: "bg-transparent active:bg-gray-100",
    text: "text-brand font-semibold",
  },
  danger: {
    container: "bg-red-600 active:bg-red-700",
    text: "text-white font-semibold",
  },
};

const sizeClasses: Record<Size, { container: string; text: string }> = {
  sm: { container: "px-4 py-2 rounded-lg", text: "text-sm" },
  md: { container: "px-5 py-3 rounded-xl", text: "text-base" },
  lg: { container: "px-6 py-4 rounded-2xl", text: "text-lg" },
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

  async function handlePress(e: Parameters<NonNullable<TouchableOpacityProps["onPress"]>>[0]) {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.(e);
  }

  return (
    <TouchableOpacity
      {...props}
      onPress={handlePress}
      disabled={isDisabled}
      activeOpacity={0.8}
      accessibilityRole="button"
      className={`
        flex-row items-center justify-center
        ${variantClasses[variant].container}
        ${sizeClasses[size].container}
        ${isDisabled ? "opacity-50" : ""}
        ${className ?? ""}
      `}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === "primary" || variant === "danger" ? "#ffffff" : "#af601a"}
        />
      ) : (
        <Text className={`${variantClasses[variant].text} ${sizeClasses[size].text}`}>
          {children}
        </Text>
      )}
    </TouchableOpacity>
  );
}
