import { useState } from "react";
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  type TextInputProps,
} from "react-native";
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
  style,
  ...props
}: InputProps) {
  const [visible, setVisible] = useState(false);
  const isPassword = secureTextEntry;

  const borderColor = error
    ? "rgba(201, 58, 58, 0.65)"
    : COLORS.border.default;

  return (
    <View style={styles.wrapper}>
      {label && (
        <Text style={[styles.label, { color: COLORS.ink.secondary }]}>
          {label}
        </Text>
      )}

      <View
        style={[
          styles.inputRow,
          multiline ? styles.inputRowMultiline : styles.inputRowSingle,
          { backgroundColor: COLORS.bg.card, borderColor },
        ]}
      >
        {leftIcon && (
          <View style={multiline ? styles.leftIconMultiline : styles.leftIconSingle}>
            {leftIcon}
          </View>
        )}

        <TextInput
          {...props}
          multiline={multiline}
          secureTextEntry={isPassword && !visible}
          placeholderTextColor={COLORS.ink.muted}
          style={[
            styles.textInput,
            { color: COLORS.ink.primary },
            multiline ? styles.textInputMultiline : styles.textInputSingle,
            style,
          ]}
          textAlignVertical={multiline ? "top" : "center"}
          accessibilityLabel={label}
        />

        {isPassword && (
          <TouchableOpacity
            onPress={() => setVisible((v) => !v)}
            accessibilityLabel={visible ? "Hide password" : "Show password"}
            style={styles.eyeButton}
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
        <Text
          style={[styles.helperText, { color: COLORS.status.error }]}
          accessibilityLiveRegion="polite"
        >
          {error}
        </Text>
      )}
      {hint && !error && (
        <Text style={[styles.helperText, { color: COLORS.ink.muted }]}>
          {hint}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
  },
  inputRow: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  inputRowSingle: {
    alignItems: "center",
  },
  inputRowMultiline: {
    alignItems: "flex-start",
  },
  leftIconSingle: {
    marginRight: 12,
    marginTop: 14,
  },
  leftIconMultiline: {
    marginRight: 12,
    marginTop: 14,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
  },
  textInputSingle: {
    paddingVertical: 14,
  },
  textInputMultiline: {
    paddingVertical: 12,
    minHeight: 88,
  },
  eyeButton: {
    marginLeft: 8,
    padding: 4,
  },
  helperText: {
    fontSize: 12,
  },
});
