import { View, Text, TouchableOpacity, Alert, ScrollView, StyleSheet } from "react-native";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Pencil, Settings, LogOut, ChevronRight, MapPin, AtSign } from "lucide-react-native";
import { useAuthStore } from "@/lib/auth/store";
import { api } from "@/lib/api/client";
import { Screen } from "@/components/ui/Screen";
import { Avatar } from "@/components/ui/Avatar";
import { Skeleton } from "@/components/ui/Skeleton";
import { COLORS } from "@/lib/theme/colors";

function InfoRow({ icon: Icon, label }: { icon: typeof MapPin; label: string }) {
  return (
    <View style={styles.infoRow}>
      <Icon size={15} color={COLORS.ink.muted} />
      <Text style={{ color: COLORS.ink.secondary, fontSize: 14 }}>{label}</Text>
    </View>
  );
}

function ActionRow({
  icon: Icon,
  label,
  onPress,
  danger,
}: {
  icon: typeof Pencil;
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[styles.actionRow, { borderBottomColor: COLORS.border.subtle }]}
      activeOpacity={0.7}
    >
      <View style={styles.actionRowLeft}>
        <Icon size={18} color={danger ? COLORS.status.error : COLORS.ink.secondary} />
        <Text style={{ color: danger ? COLORS.status.error : COLORS.ink.primary, fontSize: 16, fontWeight: "500" }}>
          {label}
        </Text>
      </View>
      <ChevronRight size={16} color={COLORS.ink.muted} />
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", "me"],
    queryFn: ({ signal }) => api.profile.me(signal),
    placeholderData: user
      ? {
          userId: user.id,
          username: user.username,
          fullName: user.fullName,
          photoUrl: user.photoUrl,
          bio: null,
          ministry: user.ministry,
          phone: null,
          whatsappNumber: null,
          role: user.role,
          approvalStatus: user.approvalStatus,
          createdAt: "",
        }
      : undefined,
  });

  function handleSignOut() {
    Alert.alert(
      "Sign out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign out",
          style: "destructive",
          onPress: async () => {
            await logout();
            router.replace("/(auth)/login");
          },
        },
      ],
      { cancelable: true }
    );
  }

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>

        {/* ── Header band ──────────────────────────────────────────────── */}
        <View style={[styles.header, { backgroundColor: COLORS.bg.elevated, borderBottomColor: COLORS.border.default }]}>
          {isLoading && !profile ? (
            <Skeleton width={88} height={88} rounded />
          ) : (
            <Avatar uri={profile?.photoUrl} name={profile?.fullName} size={88} />
          )}

          {isLoading && !profile ? (
            <View style={{ alignItems: "center", gap: 8 }}>
              <Skeleton width={160} height={22} />
              <Skeleton width={100} height={16} />
            </View>
          ) : (
            <View style={{ alignItems: "center", gap: 4 }}>
              <Text style={{ color: COLORS.ink.primary, fontSize: 20, fontWeight: "700" }}>
                {profile?.fullName ?? "—"}
              </Text>
              <InfoRow icon={AtSign} label={profile?.username ?? "—"} />
              {profile?.ministry ? <InfoRow icon={MapPin} label={profile.ministry} /> : null}
            </View>
          )}

          {profile?.role && profile.role !== "member" ? (
            <View style={[styles.roleBadge, { backgroundColor: COLORS.brand.soft, borderColor: COLORS.border.default }]}>
              <Text style={{ color: COLORS.brand.primary, fontSize: 12, fontWeight: "600" }}>
                {profile.role.replace("_", " ")}
              </Text>
            </View>
          ) : null}
        </View>

        {/* ── Bio ──────────────────────────────────────────────────────── */}
        {profile?.bio ? (
          <View style={[styles.bioWrap, { borderBottomColor: COLORS.border.subtle }]}>
            <Text style={{ color: COLORS.ink.secondary, fontSize: 14, lineHeight: 22 }}>
              {profile.bio}
            </Text>
          </View>
        ) : null}

        {/* ── Actions ──────────────────────────────────────────────────── */}
        <View style={styles.actions}>
          <ActionRow icon={Pencil} label="Edit profile" onPress={() => router.push("/(app)/profile/edit")} />
          <ActionRow icon={Settings} label="Settings" onPress={() => Alert.alert("Settings", "Coming soon.")} />
          <ActionRow icon={LogOut} label="Sign out" onPress={handleSignOut} danger />
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 56,
    paddingBottom: 40,
    paddingHorizontal: 20,
    alignItems: "center",
    gap: 12,
    borderBottomWidth: 1,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  roleBadge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
  },
  bioWrap: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  actions: {
    paddingHorizontal: 20,
    marginTop: 8,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  actionRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
});
