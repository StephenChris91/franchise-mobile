import { View, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface ScreenProps {
  children: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
  /** @deprecated All screens use the dark theme. Prop kept for API compat. */
  dark?: boolean;
  className?: string;
}

export function Screen({
  children,
  scroll = false,
  padded = true,
  dark: _dark,   // accepted but unused — always dark
  className,
}: ScreenProps) {
  const padding = padded ? "px-5" : "";

  const content = scroll ? (
    <ScrollView
      contentContainerClassName={`flex-grow ${padding}`}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View className={`flex-1 ${padding}`}>{children}</View>
  );

  return (
    <SafeAreaView className={`flex-1 bg-page ${className ?? ""}`}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        {content}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
