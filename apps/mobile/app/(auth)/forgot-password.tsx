import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
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
        style={styles.backBtn}
        accessibilityLabel="Go back"
      >
        <ArrowLeft size={20} color={COLORS.ink.muted} />
        <Text style={{ color: COLORS.ink.muted, fontSize: 14, marginLeft: 4 }}>
          Back to login
        </Text>
      </TouchableOpacity>

      {sent ? (
        /* ── Success ─────────────────────────────────────────────────── */
        <View style={styles.successWrap}>
          <CheckCircle size={64} color={COLORS.status.success} />
          <Text style={[styles.successHeading, { color: COLORS.ink.primary }]}>
            Check your email
          </Text>
          <Text style={[styles.successBody, { color: COLORS.ink.secondary }]}>
            We've sent a password reset link to{"\n"}
            <Text style={{ color: COLORS.brand.primary, fontWeight: "500" }}>
              {getValues("email")}
            </Text>
          </Text>
          <Text style={[styles.successNote, { color: COLORS.ink.muted }]}>
            The link expires in 1 hour. Check your spam folder if you don't see it.
          </Text>
          <Button
            variant="ghost"
            style={{ marginTop: 16 }}
            onPress={() => router.replace("/(auth)/login")}
          >
            Return to login
          </Button>
        </View>
      ) : (
        /* ── Form ────────────────────────────────────────────────────── */
        <View style={styles.form}>
          <View style={styles.formHeader}>
            <Text style={[styles.formHeading, { color: COLORS.ink.primary }]}>
              Reset password
            </Text>
            <Text style={[styles.formSubheading, { color: COLORS.ink.secondary }]}>
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
            style={{ marginTop: 8 }}
          >
            Send Reset Link
          </Button>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    marginBottom: 32,
  },
  successWrap: {
    alignItems: "center",
    paddingTop: 64,
    gap: 16,
  },
  successHeading: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  successBody: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
  },
  successNote: {
    fontSize: 12,
    textAlign: "center",
  },
  form: {
    gap: 16,
  },
  formHeader: {
    marginBottom: 8,
  },
  formHeading: {
    fontSize: 24,
    fontWeight: "700",
  },
  formSubheading: {
    fontSize: 14,
    marginTop: 4,
  },
});
