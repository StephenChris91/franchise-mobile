import { View, Text, TouchableOpacity } from "react-native";
import { Link, router } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Toast from "react-native-toast-message";
import { loginSchema, type LoginInput } from "@franchise/validators";
import { useAuthStore } from "@/lib/auth/store";
import { Screen } from "@/components/ui/Screen";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function LoginScreen() {
  const login = useAuthStore((s) => s.login);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginInput) {
    try {
      await login(values.email, values.password);

      const { user } = useAuthStore.getState();
      if (user?.approvalStatus === "pending") {
        router.replace("/(auth)/pending");
      } else if (user?.approvalStatus === "rejected") {
        Toast.show({
          type: "error",
          text1: "Account not approved",
          text2: "Your application was not approved. Please contact us.",
        });
      } else {
        router.replace("/(app)/(tabs)/feed");
      }
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : "Something went wrong. Please try again.";
      Toast.show({ type: "error", text1: "Login failed", text2: msg });
    }
  }

  return (
    <Screen scroll padded>
      {/* ── Logo ───────────────────────────────────────────────────────────── */}
      <View className="items-center mt-14 mb-10">
        <Text
          style={{ fontFamily: "DancingScript_700Bold", fontSize: 52 }}
          className="text-gold"
        >
          Franchise
        </Text>
        <Text className="text-ink-muted text-xs tracking-widest uppercase mt-1">
          Church
        </Text>
      </View>

      {/* ── Form ───────────────────────────────────────────────────────────── */}
      <View className="gap-y-4">
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
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Password"
              placeholder="••••••••"
              secureTextEntry
              autoComplete="password"
              textContentType="password"
              onChangeText={onChange}
              onBlur={onBlur}
              value={value}
              error={errors.password?.message}
            />
          )}
        />

        <Link href="/(auth)/forgot-password" asChild>
          <TouchableOpacity className="self-end" accessibilityRole="link">
            <Text className="text-gold text-sm">Forgot password?</Text>
          </TouchableOpacity>
        </Link>

        <Button size="lg" loading={isSubmitting} onPress={handleSubmit(onSubmit)} className="mt-2">
          Sign In
        </Button>
      </View>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <View className="flex-row justify-center mt-8 gap-x-1">
        <Text className="text-ink-secondary text-sm">Don't have an account?</Text>
        <Link href="/(auth)/signup" asChild>
          <TouchableOpacity accessibilityRole="link">
            <Text className="text-gold text-sm font-semibold">Sign up</Text>
          </TouchableOpacity>
        </Link>
      </View>

      <View className="h-10" />
    </Screen>
  );
}
