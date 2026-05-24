import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Link, router } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Toast from "react-native-toast-message";
import { loginSchema, type LoginInput } from "@franchise/validators";
import { useAuthStore } from "@/lib/auth/store";
import { Screen } from "@/components/ui/Screen";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { COLORS } from "@/lib/theme/colors";

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
      const msg = e instanceof Error ? e.message : "Something went wrong. Please try again.";
      Toast.show({ type: "error", text1: "Login failed", text2: msg });
    }
  }

  return (
    <Screen scroll padded>
      {/* ── Logo ─────────────────────────────────────────────────────────── */}
      <View style={styles.logoWrap}>
        <Text style={styles.logoScript}>Franchise</Text>
        <Text style={styles.logoSub}>Church</Text>
      </View>

      {/* ── Form ─────────────────────────────────────────────────────────── */}
      <View style={styles.form}>
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
          <TouchableOpacity style={styles.forgotWrap} accessibilityRole="link">
            <Text style={[styles.linkText, { color: COLORS.brand.primary }]}>
              Forgot password?
            </Text>
          </TouchableOpacity>
        </Link>

        <Button
          size="lg"
          loading={isSubmitting}
          onPress={handleSubmit(onSubmit)}
          style={styles.submitBtn}
        >
          Sign In
        </Button>
      </View>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <View style={styles.footer}>
        <Text style={{ color: COLORS.ink.secondary, fontSize: 14 }}>
          Don't have an account?
        </Text>
        <Link href="/(auth)/signup" asChild>
          <TouchableOpacity accessibilityRole="link">
            <Text style={[styles.linkText, { color: COLORS.brand.primary, fontWeight: "600" }]}>
              {" "}Sign up
            </Text>
          </TouchableOpacity>
        </Link>
      </View>

      <View style={{ height: 40 }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  logoWrap: {
    alignItems: "center",
    marginTop: 56,
    marginBottom: 40,
  },
  logoScript: {
    fontFamily: "DancingScript_700Bold",
    fontSize: 52,
    color: COLORS.brand.primary,
  },
  logoSub: {
    fontSize: 11,
    letterSpacing: 4,
    textTransform: "uppercase",
    color: COLORS.ink.muted,
    marginTop: 2,
  },
  form: {
    gap: 16,
  },
  forgotWrap: {
    alignSelf: "flex-end",
  },
  linkText: {
    fontSize: 14,
  },
  submitBtn: {
    marginTop: 8,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 32,
  },
});
