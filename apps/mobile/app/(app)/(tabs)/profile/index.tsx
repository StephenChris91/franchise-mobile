import { View, Text, TouchableOpacity, Alert, ScrollView } from "react-native";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import {
  Pencil,
  Settings,
  LogOut,
  ChevronRight,
  MapPin,
  AtSign,
} from "lucide-react-native";
import { useAuthStore } from "@/lib/auth/store";
import { api } from "@/lib/api/client";
import { Screen } from "@/components/ui/Screen";
import { Avatar } from "@/components/ui/Avatar";
import { Skeleton } from "@/components/ui/Skeleton";
import { COLORS } from "@/lib/theme/colors";

// ── Info row ───────────────────────────────────────────────────────────────────
function InfoRow({
  icon: Icon,
  label,
}: {
  icon: typeof MapPin;
  label: string;
}) {
  return (
    <View className="flex-row items-center gap-x-2">
      <Icon size={15} color={COLORS.ink.muted} />
      <Text className="text-ink-secondary text-sm">{label}</Text>
    </View>
  );
}

// ── Action row ─────────────────────────────────────────────────────────────────
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
      className="flex-row items-center justify-between py-4"
      style={{ borderBottomWidth: 1, borderBottomColor: COLORS.border.subtle }}
      activeOpacity={0.7}
    >
      <View className="flex-row items-center gap-x-3">
        <Icon size={18} color={danger ? COLORS.status.error : COLORS.ink.secondary} />
        <Text
          className={`text-base font-medium ${danger ? "text-danger" : "text-ink"}`}
        >
          {label}
        </Text>
      </View>
      <ChevronRight size={16} color={COLORS.ink.muted} />
    </TouchableOpacity>
  );
}

// ── Profile screen ─────────────────────────────────────────────────────────────
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

  function handleEditProfile() {
    router.push("/(app)/profile/edit");
  }

  function handleSettings() {
    Alert.alert("Settings", "Settings screen coming in a future release.");
  }

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
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header band ─────────────────────────────────────────────────── */}
        <View
          className="bg-elevated pt-14 pb-10 px-5 items-center gap-y-3"
          style={{ borderBottomWidth: 1, borderBottomColor: COLORS.border.default }}
        >
          {isLoading && !profile ? (
            <Skeleton width={88} height={88} rounded />
          ) : (
            <Avatar uri={profile?.photoUrl} name={profile?.fullName} size={88} />
          )}

          {isLoading && !profile ? (
            <View className="items-center gap-y-2">
              <Skeleton width={160} height={22} />
              <Skeleton width={100} height={16} />
            </View>
          ) : (
            <View className="items-center gap-y-1">
              <Text className="text-ink text-xl font-bold">
                {profile?.fullName ?? "—"}
              </Text>
              <InfoRow icon={AtSign} label={profile?.username ?? "—"} />
              {profile?.ministry ? (
                <InfoRow icon={MapPin} label={profile.ministry} />
              ) : null}
            </View>
          )}

          {/* Role badge */}
          {profile?.role && profile.role !== "member" ? (
            <View
              style={{ backgroundColor: COLORS.brand.soft, borderWidth: 1, borderColor: COLORS.border.default }}
              className="rounded-full px-3 py-1"
            >
              <Text className="text-gold text-xs font-semibold capitalize">
                {profile.role.replace("_", " ")}
              </Text>
            </View>
          ) : null}
        </View>

        {/* ── Bio ─────────────────────────────────────────────────────────── */}
        {profile?.bio ? (
          <View
            className="px-5 py-4"
            style={{ borderBottomWidth: 1, borderBottomColor: COLORS.border.subtle }}
          >
            <Text className="text-ink-secondary text-sm leading-6">{profile.bio}</Text>
          </View>
        ) : null}

        {/* ── Actions ─────────────────────────────────────────────────────── */}
        <View className="px-5 mt-2">
          <ActionRow icon={Pencil} label="Edit profile" onPress={handleEditProfile} />
          <ActionRow icon={Settings} label="Settings" onPress={handleSettings} />
          <ActionRow icon={LogOut} label="Sign out" onPress={handleSignOut} danger />
        </View>

        <View className="h-8" />
      </ScrollView>
    </Screen>
  );
}
