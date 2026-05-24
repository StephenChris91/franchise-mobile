import { View, Text, TouchableOpacity } from "react-native";
import { Link, router } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Toast from "react-native-toast-message";
import { signupSchema, type SignupInput } from "@franchise/validators";
import { useAuthStore } from "@/lib/auth/store";
import { Screen } from "@/components/ui/Screen";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function SignupScreen() {
  const signup = useAuthStore((s) => s.signup);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: "",
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: SignupInput) {
    try {
      await signup(values);
      router.replace("/(auth)/pending");
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : "Something went wrong. Please try again.";
      Toast.show({ type: "error", text1: "Sign up failed", text2: msg });
    }
  }

  return (
    <Screen scroll padded>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View className="mt-10 mb-8">
        <Text className="text-ink text-2xl font-bold">Create account</Text>
        <Text className="text-ink-secondary text-sm mt-1">
          Join the Franchise Church community
        </Text>
      </View>

      {/* ── Form ───────────────────────────────────────────────────────────── */}
      <View className="gap-y-4">
        <Controller
          control={control}
          name="fullName"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Full name"
              placeholder="John Doe"
              autoCapitalize="words"
              textContentType="name"
              onChangeText={onChange}
              onBlur={onBlur}
              value={value}
              error={errors.fullName?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="username"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Username"
              placeholder="johndoe"
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={(t) => onChange(t.toLowerCase())}
              onBlur={onBlur}
              value={value}
              error={errors.username?.message}
              hint="Lowercase letters, numbers, and hyphens only"
            />
          )}
        />

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
              label="Confirm password"
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

        <Text className="text-ink-muted text-xs leading-5">
          By creating an account you agree to our{" "}
          <Text className="text-gold">Terms of Service</Text>. Your account will
          be reviewed by our pastoral team before you gain full access.
        </Text>

        <Button
          size="lg"
          loading={isSubmitting}
          onPress={handleSubmit(onSubmit)}
          className="mt-2"
        >
          Create Account
        </Button>
      </View>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <View className="flex-row justify-center mt-8 gap-x-1">
        <Text className="text-ink-secondary text-sm">Already have an account?</Text>
        <Link href="/(auth)/login" asChild>
          <TouchableOpacity accessibilityRole="link">
            <Text className="text-gold text-sm font-semibold">Sign in</Text>
          </TouchableOpacity>
        </Link>
      </View>

      <View className="h-10" />
    </Screen>
  );
}
