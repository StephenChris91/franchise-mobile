import { View, Text } from "react-native";
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
    <Screen dark padded>
      {done ? (
        <View className="items-center pt-24 gap-y-4">
          <CheckCircle size={64} color={COLORS.status.success} />
          <Text className="text-white text-xl font-bold">Password updated!</Text>
          <Text className="text-gray-400 text-sm text-center">
            Your password has been changed successfully.
          </Text>
          <Button onPress={() => router.replace("/(auth)/login")} className="mt-4 w-full">
            Back to Login
          </Button>
        </View>
      ) : (
        <View className="gap-y-4 mt-8">
          <View className="mb-2">
            <Text className="text-white text-2xl font-bold">New password</Text>
            <Text className="text-gray-400 text-sm mt-1">
              Choose a strong password (min. 8 characters).
            </Text>
          </View>

          {!token && (
            <View className="bg-yellow-900/50 border border-yellow-600 rounded-xl p-4">
              <Text className="text-yellow-400 text-sm">
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
                className="bg-dark-card border-dark-border"
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
                className="bg-dark-card border-dark-border"
              />
            )}
          />

          <Button
            size="lg"
            loading={isSubmitting}
            disabled={!token}
            onPress={handleSubmit(onSubmit)}
            className="mt-2"
          >
            Update Password
          </Button>
        </View>
      )}
    </Screen>
  );
}
