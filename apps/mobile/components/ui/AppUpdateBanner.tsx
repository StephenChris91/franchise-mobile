import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Linking, Animated } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Platform } from "react-native";
import Constants from "expo-constants";
import { Download, X } from "lucide-react-native";
import { COLORS } from "@/lib/theme/colors";
import { api } from "@/lib/api/client";

/**
 * Shows a dismissible banner at the top of the screen when a new app version
 * is available, or a non-dismissible alert when an update is required.
 *
 * Mount this near the top of a screen or layout — it renders nothing
 * when no update is needed.
 */
export function AppUpdateBanner() {
  const [dismissed, setDismissed] = useState(false);

  const clientVersion =
    Constants.expoConfig?.version ??
    Constants.manifest?.version ??
    "1.0.0";

  const { data } = useQuery({
    queryKey: ["app-version", clientVersion],
    queryFn: ({ signal }) => api.app.version(clientVersion, signal),
    staleTime: 10 * 60 * 1000, // check every 10 minutes
    retry: false,
  });

  if (!data?.updateAvailable) return null;
  if (dismissed && !data.updateRequired) return null;

  const isRequired = data.updateRequired;
  const storeUrl = Platform.OS === "ios" ? data.storeUrl.ios : data.storeUrl.android;

  return (
    <View style={[styles.banner, isRequired ? styles.bannerRequired : styles.bannerOptional]}>
      <Download
        size={16}
        color={isRequired ? COLORS.bg.page : COLORS.brand.primary}
      />
      <Text
        style={[styles.text, isRequired ? styles.textRequired : styles.textOptional]}
        numberOfLines={2}
      >
        {data.message ?? (isRequired ? "Update required to continue." : "A new version is available.")}
      </Text>
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.updateBtn, isRequired && styles.updateBtnRequired]}
          onPress={() => Linking.openURL(storeUrl)}
          activeOpacity={0.8}
        >
          <Text style={[styles.updateBtnText, isRequired && styles.updateBtnTextRequired]}>
            Update
          </Text>
        </TouchableOpacity>
        {!isRequired && (
          <TouchableOpacity
            onPress={() => setDismissed(true)}
            style={styles.dismissBtn}
          >
            <X size={14} color={COLORS.ink.muted} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border.subtle,
  },
  bannerOptional: { backgroundColor: "rgba(212,166,74,0.08)" },
  bannerRequired: { backgroundColor: COLORS.status.error },
  text: { flex: 1, fontSize: 13, lineHeight: 18 },
  textOptional: { color: COLORS.ink.secondary },
  textRequired: { color: COLORS.bg.page, fontWeight: "600" },
  actions: { flexDirection: "row", alignItems: "center", gap: 6 },
  updateBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.brand.primary,
  },
  updateBtnRequired: {
    borderColor: COLORS.bg.page,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  updateBtnText: { fontSize: 12, fontWeight: "700", color: COLORS.brand.primary },
  updateBtnTextRequired: { color: COLORS.bg.page },
  dismissBtn: { padding: 4 },
});
