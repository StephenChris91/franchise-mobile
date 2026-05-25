import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Button } from "@/components/ui/Button";
import { COLORS } from "@/lib/theme/colors";

const { width } = Dimensions.get("window");

export default function WelcomeScreen() {
  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* ── Subtle background radial glow (top) ─────────────────────────── */}
      <View style={styles.glowTop} />

      {/* ── Logo ────────────────────────────────────────────────────────── */}
      <View style={styles.logoWrap}>
        <Text style={styles.logoScript}>Franchise</Text>
        <Text style={styles.logoSub}>CHURCH</Text>
      </View>

      {/* ── Hero heading ────────────────────────────────────────────────── */}
      <View style={styles.heroWrap}>
        {/* Line 1: "A generation," */}
        <Text style={styles.heroLine}>
          <Text style={styles.heroWhite}>A generation,</Text>
        </Text>

        {/* Line 2: "awakened to" — "awakened" is italic gold */}
        <Text style={styles.heroLine}>
          <Text style={styles.heroGold}>awakened </Text>
          <Text style={styles.heroWhite}>to</Text>
        </Text>

        {/* Line 3: "eternity." */}
        <Text style={styles.heroLine}>
          <Text style={styles.heroWhite}>eternity.</Text>
        </Text>

        {/* Subtext */}
        <Text style={styles.subtext}>
          Step into community. Share prayers.{"\n"}Grow together in Christ.
        </Text>
      </View>

      {/* ── Actions ─────────────────────────────────────────────────────── */}
      <View style={styles.actions}>
        <Button
          size="lg"
          variant="primary"
          onPress={() => router.push("/(auth)/signup")}
          style={styles.btn}
        >
          Create Account
        </Button>

        <TouchableOpacity
          style={styles.ghostBtn}
          onPress={() => router.push("/(auth)/login")}
          activeOpacity={0.7}
        >
          <Text style={styles.ghostBtnText}>I have an account</Text>
        </TouchableOpacity>
      </View>

      {/* ── Legal footer ────────────────────────────────────────────────── */}
      <Text style={styles.footer}>
        By continuing you agree to our{" "}
        <Text style={styles.footerLink}>Terms & Privacy</Text>.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg.page,
    paddingHorizontal: 28,
    paddingTop: 72,
    paddingBottom: 40,
  },

  /* Radial glow */
  glowTop: {
    position: "absolute",
    top: -width * 0.3,
    left: "50%",
    marginLeft: -(width * 0.6),
    width: width * 1.2,
    height: width * 1.2,
    borderRadius: width * 0.6,
    backgroundColor: "rgba(212,166,74,0.05)",
  },

  /* Logo */
  logoWrap: {
    alignItems: "center",
    marginBottom: 52,
  },
  logoScript: {
    fontFamily: "DancingScript_700Bold",
    fontSize: 52,
    color: COLORS.brand.primary,
    lineHeight: 60,
  },
  logoSub: {
    fontSize: 11,
    letterSpacing: 7,
    color: COLORS.ink.muted,
    fontWeight: "600",
    marginTop: -4,
  },

  /* Hero */
  heroWrap: {
    flex: 1,
    justifyContent: "center",
    marginBottom: 16,
  },
  heroLine: {
    // each line rendered separately for control
  },
  heroWhite: {
    fontFamily: "Fraunces_700Bold",
    fontSize: 44,
    color: COLORS.ink.primary,
    lineHeight: 52,
  },
  heroGold: {
    fontFamily: "Fraunces_400Regular",
    fontSize: 44,
    color: COLORS.brand.primary,
    lineHeight: 52,
    fontStyle: "italic",
  },
  subtext: {
    marginTop: 20,
    fontSize: 15,
    color: COLORS.ink.secondary,
    lineHeight: 24,
  },

  /* Buttons */
  actions: {
    gap: 12,
    marginBottom: 20,
  },
  btn: {
    width: "100%",
  },
  ghostBtn: {
    width: "100%",
    height: 52,
    borderRadius: 100,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  ghostBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.ink.primary,
  },

  /* Footer */
  footer: {
    textAlign: "center",
    fontSize: 12,
    color: COLORS.ink.muted,
    lineHeight: 18,
  },
  footerLink: {
    color: COLORS.brand.primary,
  },
});
