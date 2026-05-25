import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from "react-native";
import { router } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Bell, BellOff, Info } from "lucide-react-native";
import Toast from "react-native-toast-message";
import { COLORS } from "@/lib/theme/colors";
import { api } from "@/lib/api/client";
import { queryKeys } from "@/lib/query/keys";
import { Skeleton } from "@/components/ui/Skeleton";

// ── WAT offset for joinability check ─────────────────────────────────────

const WAT_OFFSET_MS = 3600_000;

function isPrayerJoinable(scheduledTime: string, durationMins: number): boolean {
  const [hh, mm] = scheduledTime.split(":").map(Number);
  const now = new Date();
  const nowWAT = new Date(now.getTime() + WAT_OFFSET_MS);
  const startMin = hh * 60 + mm;
  const endMin = startMin + durationMins;
  const nowMin = nowWAT.getUTCHours() * 60 + nowWAT.getUTCMinutes();
  return nowMin >= startMin - 10 && nowMin <= endMin;
}

// ── Countdown ─────────────────────────────────────────────────────────────

function useCountdown(iso: string) {
  const calc = () => {
    const diff = Math.max(0, new Date(iso).getTime() - Date.now());
    return {
      d: Math.floor(diff / 86_400_000),
      h: Math.floor((diff % 86_400_000) / 3_600_000),
      m: Math.floor((diff % 3_600_000) / 60_000),
      s: Math.floor((diff % 60_000) / 1_000),
    };
  };
  const [parts, setParts] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setParts(calc()), 1000);
    return () => clearInterval(id);
  }, [iso]);
  return parts;
}

function CountUnit({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.countUnit}>
      <Text style={styles.countNum}>{String(value).padStart(2, "0")}</Text>
      <Text style={styles.countLabel}>{label}</Text>
    </View>
  );
}

// ── Avatar stack ──────────────────────────────────────────────────────────

function AvatarStack({ names }: { names: string[] }) {
  return (
    <View style={styles.avatarStack}>
      {names.slice(0, 5).map((name, i) => {
        const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
        return (
          <View
            key={i}
            style={[
              styles.stackAvatar,
              { marginLeft: i === 0 ? 0 : -10, zIndex: 5 - i },
            ]}
          >
            <Text style={styles.stackInitials}>{initials}</Text>
          </View>
        );
      })}
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────

export default function PrayerLobbyScreen() {
  const queryClient = useQueryClient();

  // Find the Friday prayer livestream from the schedule
  const { data: schedule, isLoading: scheduleLoading } = useQuery({
    queryKey: queryKeys.live.schedule(),
    queryFn: ({ signal }) => api.live.schedule(signal),
    staleTime: 60_000,
  });

  const prayerSchedule = schedule?.find((s) => s.serviceType === "friday_zoom");

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: queryKeys.live.detail(prayerSchedule?.id ?? ""),
    queryFn: ({ signal }) => api.live.get(prayerSchedule!.id, signal),
    enabled: !!prayerSchedule?.id,
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  const isLoading = scheduleLoading || (!!prayerSchedule && detailLoading);

  const cd = useCountdown(detail?.nextOccurrence ?? prayerSchedule?.nextOccurrence ?? new Date(Date.now() + 86_400_000).toISOString());

  const joinable = detail
    ? isPrayerJoinable(detail.scheduledTime, detail.durationMins)
    : false;

  const commitMutation = useMutation({
    mutationFn: () => detail?.userCommitted
      ? api.live.uncommit(detail.id)
      : api.live.commit(detail!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.live.detail(detail?.id ?? "") });
      Toast.show({
        type: "success",
        text1: detail?.userCommitted ? "Commitment removed" : "You're in! 🙏",
        text2: detail?.userCommitted ? undefined : "We'll see you Friday night",
      });
    },
  });

  const reminderMutation = useMutation({
    mutationFn: (isActive: boolean) =>
      api.live.reminders.set("friday_zoom", isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.live.schedule() });
    },
  });

  const handleJoinZoom = async () => {
    const meetingId = detail?.zoomMeetingId;
    const passcode = detail?.zoomPasscode;
    if (!meetingId) return;

    const zoomAppUrl = `zoomus://zoom.us/join?confno=${meetingId}${passcode ? `&pwd=${passcode}` : ""}`;
    const zoomWebUrl = `https://zoom.us/j/${meetingId}${passcode ? `?pwd=${passcode}` : ""}`;

    const canOpen = await Linking.canOpenURL(zoomAppUrl);
    if (canOpen) {
      Linking.openURL(zoomAppUrl);
    } else {
      Linking.openURL(zoomWebUrl);
      Toast.show({ type: "info", text1: "Opening in browser", text2: "Install Zoom for the best experience" });
    }
  };

  if (isLoading) {
    return (
      <View style={styles.root}>
        <View style={styles.navBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.navBack}>
            <ChevronLeft size={22} color={COLORS.ink.primary} />
            <Text style={styles.navBackText}>Back</Text>
          </TouchableOpacity>
        </View>
        <View style={{ padding: 20, gap: 16 }}>
          <Skeleton height={32} width="50%" />
          <Skeleton height={120} style={{ borderRadius: 16 }} />
          <Skeleton height={52} style={{ borderRadius: 100 }} />
        </View>
      </View>
    );
  }

  const commitCount = detail?.commitmentCount ?? 0;
  const committedNames = detail?.committedMembers.map((m) => m.fullName) ?? [];

  // Format next Friday in WAT
  const nextDate = new Date((detail?.nextOccurrence ?? prayerSchedule?.nextOccurrence)!);
  const watDate = new Date(nextDate.getTime() + WAT_OFFSET_MS);
  const displayDate = watDate.toLocaleDateString("en-NG", { weekday: "long", day: "numeric", month: "long" });
  const displayTime = watDate.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit", hour12: true });

  return (
    <View style={styles.root}>
      {/* Nav */}
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.navBack}>
          <ChevronLeft size={22} color={COLORS.ink.primary} />
          <Text style={styles.navBackText}>Prayer Session</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Label pill */}
        <View style={styles.labelPill}>
          <Text style={styles.labelPillText}>Friday Prayer</Text>
        </View>

        {/* Heading */}
        <Text style={styles.heading}>
          {"When two or three "}
          <Text style={styles.headingEmphasis}>gather…</Text>
        </Text>
        <Text style={styles.subtitle}>
          Our weekly intercession over Zoom. Bring your requests. Bring your praise.
        </Text>

        {/* Countdown card */}
        <View style={styles.countdownCard}>
          <Text style={styles.eyebrow}>Starts in</Text>
          <View style={styles.countdownRow}>
            {cd.d > 0 && <CountUnit value={cd.d} label="Days" />}
            <CountUnit value={cd.h} label="Hrs" />
            <CountUnit value={cd.m} label="Min" />
            {cd.d === 0 && cd.h === 0 && <CountUnit value={cd.s} label="Sec" />}
          </View>
          <Text style={styles.countdownDate}>{displayDate} · {displayTime} WAT</Text>
        </View>

        {/* Join button */}
        <TouchableOpacity
          style={[styles.joinBtn, !joinable && styles.joinBtnDisabled]}
          onPress={handleJoinZoom}
          disabled={!joinable}
          activeOpacity={0.85}
        >
          <Text style={[styles.joinBtnText, !joinable && styles.joinBtnTextDisabled]}>
            {joinable ? "Join on Zoom →" : "Opens when prayer begins"}
          </Text>
        </TouchableOpacity>

        {/* Reminder toggle */}
        <TouchableOpacity
          style={[styles.reminderRow, prayerSchedule?.reminderActive && styles.reminderRowActive]}
          onPress={() => reminderMutation.mutate(!prayerSchedule?.reminderActive)}
          activeOpacity={0.8}
        >
          {prayerSchedule?.reminderActive
            ? <Bell size={18} color={COLORS.brand.primary} />
            : <BellOff size={18} color={COLORS.ink.secondary} />}
          <Text style={[styles.reminderText, prayerSchedule?.reminderActive && { color: COLORS.brand.primary }]}>
            {prayerSchedule?.reminderActive ? "Reminder set for 15 min before" : "Remind me before prayer"}
          </Text>
        </TouchableOpacity>

        {/* Joining This Week */}
        <View style={styles.commitSection}>
          <Text style={styles.sectionTitle}>Joining This Week</Text>
          {commitCount > 0 && (
            <>
              <AvatarStack names={committedNames} />
              <Text style={styles.commitCountText}>
                {commitCount} {commitCount === 1 ? "member has" : "members have"} committed to gather this Friday. Will you?
              </Text>
            </>
          )}
          {commitCount === 0 && (
            <Text style={styles.commitCountText}>Be the first to commit to this week's prayer 🙏</Text>
          )}
          <TouchableOpacity
            style={[styles.commitBtn, detail?.userCommitted && styles.commitBtnActive]}
            onPress={() => commitMutation.mutate()}
            disabled={commitMutation.isPending}
            activeOpacity={0.8}
          >
            <Text style={[styles.commitBtnText, detail?.userCommitted && { color: COLORS.brand.primary }]}>
              {detail?.userCommitted ? "I'm in ✓" : "I'll be there"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Prayer focus card */}
        {detail?.prayerFocus ? (
          <View style={styles.focusCard}>
            <Text style={styles.eyebrow}>This Week's Focus</Text>
            <Text style={styles.focusText}>{detail.prayerFocus}</Text>
            {detail.prayerVerse && (
              <Text style={styles.focusVerse}>{detail.prayerVerse}</Text>
            )}
          </View>
        ) : (
          <View style={styles.focusCard}>
            <Text style={styles.eyebrow}>This Week's Focus</Text>
            <Text style={[styles.focusText, { color: COLORS.ink.muted }]}>
              Pastor will share this week's focus soon.
            </Text>
          </View>
        )}

        {/* Info block */}
        <View style={styles.infoBlock}>
          <Info size={14} color={COLORS.brand.primary} />
          <Text style={styles.infoText}>
            When it's time, tap Join — we'll open Zoom for you. Meeting ID and passcode are pre-filled.
          </Text>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg.page },

  navBar: {
    paddingTop: 52,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  navBack: { flexDirection: "row", alignItems: "center", gap: 4 },
  navBackText: { fontSize: 16, color: COLORS.ink.primary, fontWeight: "500" },

  content: { paddingHorizontal: 20, paddingBottom: 100, gap: 20 },

  labelPill: {
    alignSelf: "flex-start",
    backgroundColor: COLORS.brand.soft,
    borderWidth: 1,
    borderColor: COLORS.border.default,
    borderRadius: 100,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  labelPillText: { color: COLORS.brand.primary, fontSize: 12, fontWeight: "700", letterSpacing: 0.3 },

  heading: {
    fontSize: 28,
    fontFamily: "Fraunces_700Bold",
    color: COLORS.ink.primary,
    lineHeight: 36,
  },
  headingEmphasis: {
    color: COLORS.brand.primary,
    fontStyle: "italic",
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.ink.secondary,
    lineHeight: 22,
    marginTop: -8,
  },

  countdownCard: {
    backgroundColor: COLORS.bg.card,
    borderRadius: 16,
    borderTopWidth: 2,
    borderTopColor: COLORS.brand.primary,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderLeftColor: COLORS.border.subtle,
    borderRightColor: COLORS.border.subtle,
    borderBottomColor: COLORS.border.subtle,
    padding: 20,
    alignItems: "center",
    gap: 12,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.brand.primary,
    textTransform: "uppercase",
    letterSpacing: 0.25,
  },
  countdownRow: { flexDirection: "row", gap: 20 },
  countUnit: { alignItems: "center", gap: 4 },
  countNum: {
    fontSize: 38,
    fontFamily: "Fraunces_700Bold",
    color: COLORS.brand.primary,
    letterSpacing: -1,
  },
  countLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: COLORS.ink.muted,
    textTransform: "uppercase",
    letterSpacing: 0.18,
  },
  countdownDate: { fontSize: 13, color: COLORS.ink.secondary },

  joinBtn: {
    backgroundColor: COLORS.brand.primary,
    borderRadius: 100,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.brand.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 6,
  },
  joinBtnDisabled: {
    backgroundColor: COLORS.bg.elevated,
    shadowOpacity: 0,
    elevation: 0,
  },
  joinBtnText: { color: COLORS.ink.inverse, fontSize: 16, fontWeight: "700" },
  joinBtnTextDisabled: { color: COLORS.ink.muted },

  reminderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.bg.card,
    borderWidth: 1,
    borderColor: COLORS.border.subtle,
  },
  reminderRowActive: { borderColor: COLORS.brand.primary, backgroundColor: COLORS.brand.soft },
  reminderText: { fontSize: 14, color: COLORS.ink.secondary, fontWeight: "500" },

  commitSection: {
    gap: 12,
    backgroundColor: COLORS.bg.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border.subtle,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.ink.muted,
    textTransform: "uppercase",
    letterSpacing: 0.12,
  },
  avatarStack: { flexDirection: "row", alignItems: "center" },
  stackAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.brand.deep,
    borderWidth: 2,
    borderColor: COLORS.bg.card,
    alignItems: "center",
    justifyContent: "center",
  },
  stackInitials: { color: COLORS.ink.primary, fontSize: 12, fontWeight: "700" },
  commitCountText: { fontSize: 13, color: COLORS.ink.secondary, lineHeight: 20 },
  commitBtn: {
    height: 44,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: COLORS.border.default,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.bg.elevated,
  },
  commitBtnActive: { borderColor: COLORS.brand.primary, backgroundColor: COLORS.brand.soft },
  commitBtnText: { fontSize: 14, fontWeight: "700", color: COLORS.ink.secondary },

  focusCard: {
    backgroundColor: COLORS.bg.card,
    borderRadius: 16,
    borderLeftWidth: 2,
    borderLeftColor: "rgba(212,166,74,0.5)",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border.subtle,
    borderRightColor: COLORS.border.subtle,
    borderBottomColor: COLORS.border.subtle,
    padding: 16,
    gap: 10,
  },
  focusText: {
    fontSize: 15,
    fontFamily: "Fraunces_400Regular",
    fontStyle: "italic",
    color: COLORS.ink.primary,
    lineHeight: 24,
  },
  focusVerse: { fontSize: 12, fontWeight: "600", color: COLORS.brand.deep },

  infoBlock: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: COLORS.brand.soft,
    borderRadius: 12,
    padding: 14,
  },
  infoText: { flex: 1, fontSize: 13, color: COLORS.ink.secondary, lineHeight: 20 },
});
