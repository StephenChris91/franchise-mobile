import { View, Text, StyleSheet } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle } from "lucide-react-native";
import { useState } from "react";
import Toast from "react-native-toast-message";
import { resetPasswordSchema, type ResetPasswordInput } from "@franchise/validators";
import { api } from "@/lib/api/client";
import { Screen } from "@/components/ui/Screen";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { COLORS } from "@/lib/theme/colors";

export default function ResetPasswordScreen() {
  const { token } = useLocalSearchParams<{ token?: string }>();
  const [done, setDone] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token: token ?? "", password: "", confirmPassword: "" },
  });

  async function onSubmit(values: ResetPasswordInput) {
    try {
      await api.auth.resetPassword(values.token, values.password, values.confirmPassword);
      setDone(true);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Something went wrong.";
      Toast.show({ type: "error", text1: "Reset failed", text2: msg });
    }
  }

  return (
    <Screen padded>
      {done ? (
        /* ── Success ─────────────────────────────────────────────────── */
        <View style={styles.successWrap}>
          <CheckCircle size={64} color={COLORS.status.success} />
          <Text style={[styles.successHeading, { color: COLORS.ink.primary }]}>
            Password updated!
          </Text>
          <Text style={[styles.successBody, { color: COLORS.ink.secondary }]}>
            Your password has been changed successfully.
          </Text>
          <Button
            onPress={() => router.replace("/(auth)/login")}
            style={{ marginTop: 16, width: "100%" }}
          >
            Back to Login
          </Button>
        </View>
      ) : (
        /* ── Form ────────────────────────────────────────────────────── */
        <View style={styles.form}>
          <View style={styles.formHeader}>
            <Text style={[styles.formHeading, { color: COLORS.ink.primary }]}>
              New password
            </Text>
            <Text style={[styles.formSubheading, { color: COLORS.ink.secondary }]}>
              Choose a strong password (min. 8 characters).
            </Text>
          </View>

          {!token && (
            <View style={styles.tokenWarning}>
              <Text style={{ color: COLORS.status.error, fontSize: 14 }}>
                No reset token found. Please tap the link from your email again.
              </Text>
            </View>
          )}

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="New password"
                placeholder="Min. 8 characters"
                secureTextEntry
                textContentType="newPassword"
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
                error={errors.password?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Confirm new password"
                placeholder="Re-enter your password"
                secureTextEntry
                textContentType="newPassword"
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
                error={errors.confirmPassword?.message}
              />
            )}
          />

          <Button
            size="lg"
            loading={isSubmitting}
            disabled={!token}
            onPress={handleSubmit(onSubmit)}
            style={{ marginTop: 8 }}
          >
            Update Password
          </Button>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  successWrap: {
    alignItems: "center",
    paddingTop: 96,
    gap: 16,
  },
  successHeading: {
    fontSize: 20,
    fontWeight: "700",
  },
  successBody: {
    fontSize: 14,
    textAlign: "center",
  },
  form: {
    gap: 16,
    marginTop: 32,
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
  tokenWarning: {
    backgroundColor: "rgba(201,58,58,0.12)",
    borderWidth: 1,
    borderColor: "rgba(201,58,58,0.35)",
    borderRadius: 12,
    padding: 16,
  },
});
