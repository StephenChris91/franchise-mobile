import { useState } from "react";
import { View, TextInput, Text, TouchableOpacity, type TextInputProps } from "react-native";
import { Eye, EyeOff } from "lucide-react-native";
import { COLORS } from "@/lib/theme/colors";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
}

export function Input({
  label,
  error,
  hint,
  leftIcon,
  secureTextEntry,
  multiline,
  className,
  ...props
}: InputProps) {
  const [visible, setVisible] = useState(false);
  const isPassword = secureTextEntry;

  return (
    <View className="gap-y-1.5">
      {label && (
        <Text className="text-sm font-medium text-ink-secondary">{label}</Text>
      )}

      <View
        className={`
          flex-row ${multiline ? "items-start" : "items-center"}
          border rounded-xl px-4
          bg-card
          ${error ? "border-danger/60" : "border-gold/20"}
          ${className ?? ""}
        `}
      >
        {leftIcon && <View className="mr-3 mt-3.5">{leftIcon}</View>}

        <TextInput
          {...props}
          multiline={multiline}
          secureTextEntry={isPassword && !visible}
          placeholderTextColor={COLORS.ink.muted}
          className={`flex-1 text-base text-ink ${multiline ? "py-3 min-h-[88px]" : "py-3.5"}`}
          textAlignVertical={multiline ? "top" : "center"}
          accessibilityLabel={label}
        />

        {isPassword && (
          <TouchableOpacity
            onPress={() => setVisible((v) => !v)}
            accessibilityLabel={visible ? "Hide password" : "Show password"}
            className="ml-2 p-1"
          >
            {visible ? (
              <EyeOff size={20} color={COLORS.ink.muted} />
            ) : (
              <Eye size={20} color={COLORS.ink.muted} />
            )}
          </TouchableOpacity>
        )}
      </View>

      {error && (
        <Text className="text-xs text-danger" accessibilityLiveRegion="polite">
          {error}
        </Text>
      )}
      {hint && !error && (
        <Text className="text-xs text-ink-muted">{hint}</Text>
      )}
    </View>
  );
}
