import { View, Text, StyleSheet, Dimensions } from "react-native";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Button } from "@/components/ui/Button";
import { COLORS } from "@/lib/theme/colors";

const { width, height } = Dimensions.get("window");

export default function WelcomeScreen() {
  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* ── Background decoration ───────────────────────────────────────── */}
      {/* Top-right gold orb */}
      <View style={[styles.orb, styles.orbTopRight]} />
      {/* Bottom-left dim orb */}
      <View style={[styles.orb, styles.orbBottomLeft]} />

      {/* ── Logo area ───────────────────────────────────────────────────── */}
      <View style={styles.logoWrap}>
        {/* Subtle ring around the wordmark */}
        <View style={styles.ring}>
          <Text style={styles.logoScript}>Franchise</Text>
        </View>

        <Text style={styles.logoWordmark}>CHURCH</Text>

        {/* Divider */}
        <View style={styles.divider} />

        <Text style={styles.tagline}>
          Community. Faith. Movement.
        </Text>
      </View>

      {/* ── Actions ─────────────────────────────────────────────────────── */}
      <View style={styles.actions}>
        <Button
          size="lg"
          variant="primary"
          onPress={() => router.push("/(auth)/login")}
          style={styles.btn}
        >
          Sign In
        </Button>

        <Button
          size="lg"
          variant="secondary"
          onPress={() => router.push("/(auth)/signup")}
          style={styles.btn}
        >
          Create Account
        </Button>
      </View>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <Text style={styles.footer}>
        A community platform for Franchise Church
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg.page,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },

  /* Background orbs */
  orb: {
    position: "absolute",
    borderRadius: 999,
  },
  orbTopRight: {
    width: width * 0.7,
    height: width * 0.7,
    top: -width * 0.2,
    right: -width * 0.25,
    backgroundColor: "rgba(212,166,74,0.06)",
  },
  orbBottomLeft: {
    width: width * 0.6,
    height: width * 0.6,
    bottom: -width * 0.2,
    left: -width * 0.25,
    backgroundColor: "rgba(212,166,74,0.04)",
  },

  /* Logo */
  logoWrap: {
    alignItems: "center",
    marginBottom: 64,
  },
  ring: {
    borderWidth: 1,
    borderColor: "rgba(212,166,74,0.15)",
    borderRadius: 999,
    paddingHorizontal: 28,
    paddingVertical: 12,
    marginBottom: 12,
  },
  logoScript: {
    fontFamily: "DancingScript_700Bold",
    fontSize: 56,
    color: COLORS.brand.primary,
    lineHeight: 68,
  },
  logoWordmark: {
    fontSize: 12,
    letterSpacing: 6,
    color: COLORS.ink.muted,
    fontWeight: "600",
  },
  divider: {
    width: 48,
    height: 1,
    backgroundColor: "rgba(212,166,74,0.25)",
    marginVertical: 20,
  },
  tagline: {
    fontSize: 15,
    color: COLORS.ink.secondary,
    textAlign: "center",
    lineHeight: 22,
  },

  /* Actions */
  actions: {
    width: "100%",
    gap: 12,
  },
  btn: {
    width: "100%",
  },

  /* Footer */
  footer: {
    position: "absolute",
    bottom: 40,
    fontSize: 12,
    color: COLORS.ink.muted,
    textAlign: "center",
  },
});
