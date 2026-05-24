import { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, CheckCircle, ArrowLeft } from "lucide-react-native";
import Toast from "react-native-toast-message";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@franchise/validators";
import { api } from "@/lib/api/client";
import { Screen } from "@/components/ui/Screen";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { COLORS } from "@/lib/theme/colors";

export default function ForgotPasswordScreen() {
  const [sent, setSent] = useState(false);

  const {
    control,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: ForgotPasswordInput) {
    try {
      await api.auth.forgotPassword(values.email);
      setSent(true);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Something went wrong.";
      Toast.show({ type: "error", text1: "Error", text2: msg });
    }
  }

  return (
    <Screen padded>
      {/* Back button */}
      <TouchableOpacity
        onPress={() => router.back()}
        className="flex-row items-center gap-x-1 mt-4 mb-8"
        accessibilityLabel="Go back"
      >
        <ArrowLeft size={20} color={COLORS.ink.muted} />
        <Text className="text-ink-muted text-sm">Back to login</Text>
      </TouchableOpacity>

      {sent ? (
        // ── Success state ─────────────────────────────────────────────────────
        <View className="items-center pt-16 gap-y-4">
          <CheckCircle size={64} color={COLORS.status.success} />
          <Text className="text-ink text-xl font-bold text-center">
            Check your email
          </Text>
          <Text className="text-ink-secondary text-sm text-center leading-6">
            We've sent a password reset link to{"\n"}
            <Text className="text-gold font-medium">{getValues("email")}</Text>
          </Text>
          <Text className="text-ink-muted text-xs text-center mt-2">
            The link expires in 1 hour. Check your spam folder if you don't see it.
          </Text>
          <Button
            variant="ghost"
            className="mt-4"
            onPress={() => router.replace("/(auth)/login")}
          >
            Return to login
          </Button>
        </View>
      ) : (
        // ── Form state ────────────────────────────────────────────────────────
        <View className="gap-y-4">
          <View className="mb-2">
            <Text className="text-ink text-2xl font-bold">Reset password</Text>
            <Text className="text-ink-secondary text-sm mt-1">
              Enter your email and we'll send you a reset link.
            </Text>
          </View>

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Email address"
                placeholder="your@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
                error={errors.email?.message}
                leftIcon={<Mail size={18} color={COLORS.ink.muted} />}
              />
            )}
          />

          <Button
            size="lg"
            loading={isSubmitting}
            onPress={handleSubmit(onSubmit)}
            className="mt-2"
          >
            Send Reset Link
          </Button>
        </View>
      )}
    </Screen>
  );
}
