import { useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  AppState,
} from "react-native";
import { router } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Bell, BellOff, Play, Radio } from "lucide-react-native";
import { COLORS } from "@/lib/theme/colors";
import { api } from "@/lib/api/client";
import { queryKeys } from "@/lib/query/keys";
import { Skeleton } from "@/components/ui/Skeleton";
import type { LivestreamScheduleItem, ServiceType } from "@franchise/types";

// ── Countdown helpers ──────────────────────────────────────────────────────

function useCountdown(targetIso: string) {
  const [parts, setParts] = useRefState(() => calcParts(targetIso));
  useEffect(() => {
    const id = setInterval(() => setParts(calcParts(targetIso)), 1000);
    return () => clearInterval(id);
  }, [targetIso]);
  return parts;
}

function calcParts(iso: string) {
  const diff = Math.max(0, new Date(iso).getTime() - Date.now());
  const d = Math.floor(diff / 86_400_000);
  const h = Math.floor((diff % 86_400_000) / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1_000);
  return { d, h, m, s, total: diff };
}

function useRefState<T>(init: () => T): [T, (v: T) => void] {
  const [state, setState] = require("react").useState<T>(init);
  return [state, setState];
}

// ── Pulsing live dot ───────────────────────────────────────────────────────

function LivePulse() {
  const anim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 0.3, duration: 750, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 1, duration: 750, useNativeDriver: true }),
      ])
    ).start();
  }, [anim]);
  return <Animated.View style={[styles.liveDot, { opacity: anim }]} />;
}

// ── Countdown display ──────────────────────────────────────────────────────

function CountdownBlock({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.countBlock}>
      <Text style={styles.countNum}>{String(value).padStart(2, "0")}</Text>
      <Text style={styles.countLabel}>{label}</Text>
    </View>
  );
}

// ── Service card (State C) ────────────────────────────────────────────────

function ServiceCard({
  item,
  onPress,
  onReminderToggle,
}: {
  item: LivestreamScheduleItem;
  onPress: () => void;
  onReminderToggle: () => void;
}) {
  const { d, h, m } = useCountdown(item.nextOccurrence);

  const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayName = DAY_NAMES[item.dayOfWeek] ?? "";

  // Format "WAT" display time — stored as UTC, display in WAT (UTC+1)
  const nextDate = new Date(item.nextOccurrence);
  const watDate = new Date(nextDate.getTime() + 3600_000);
  const displayTime = watDate.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit", hour12: true });

  return (
    <TouchableOpacity style={styles.serviceCard} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.serviceCardLeft}>
        <View style={styles.serviceIconCircle}>
          {item.platform === "zoom"
            ? <Text style={styles.serviceEmoji}>🙏</Text>
            : <Play size={18} color={COLORS.brand.primary} fill={COLORS.brand.primary} />}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.serviceCardName}>{item.name}</Text>
          <Text style={styles.serviceCardMeta}>{dayName} · {displayTime} WAT</Text>
          {(d > 0 || h > 0 || m > 0) && (
            <View style={styles.countdownPill}>
              <Text style={styles.countdownPillText}>
                In {d > 0 ? `${d}d ` : ""}{h > 0 ? `${h}h ` : ""}{m}m
              </Text>
            </View>
          )}
        </View>
      </View>
      <TouchableOpacity
        onPress={onReminderToggle}
        style={styles.reminderBtn}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        {item.reminderActive
          ? <Bell size={18} color={COLORS.brand.primary} fill={COLORS.brand.soft} />
          : <BellOff size={18} color={COLORS.ink.muted} />}
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

// ── Hero card — LIVE state ────────────────────────────────────────────────

function LiveHeroCard({ item }: { item: LivestreamScheduleItem }) {
  const minutesAgo = item.startedAt
    ? Math.floor((Date.now() - new Date(item.startedAt).getTime()) / 60_000)
    : 0;

  const handleJoin = () => {
    if (item.platform === "zoom") {
      router.push("/(app)/live/prayer");
    } else {
      router.push(`/(app)/live/${item.id}`);
    }
  };

  return (
    <View style={styles.liveHero}>
      <View style={styles.liveHeroTopRow}>
        <View style={styles.liveBadge}>
          <LivePulse />
          <Text style={styles.liveBadgeText}>LIVE</Text>
        </View>
      </View>
      <Text style={styles.liveHeroTitle}>{item.name}</Text>
      <Text style={styles.liveHeroMeta}>
        {minutesAgo > 0 ? `Started ${minutesAgo} min ago` : "Just started"}
      </Text>
      <TouchableOpacity style={styles.joinBtn} onPress={handleJoin} activeOpacity={0.85}>
        <Radio size={18} color={COLORS.ink.inverse} />
        <Text style={styles.joinBtnText}>Join the Service</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Hero card — UPCOMING state ────────────────────────────────────────────

function UpcomingHeroCard({
  item,
  onReminderToggle,
}: {
  item: LivestreamScheduleItem;
  onReminderToggle: () => void;
}) {
  const { d, h, m, s } = useCountdown(item.nextOccurrence);

  return (
    <View style={styles.upcomingHero}>
      <View style={styles.upcomingBadge}>
        <Text style={styles.upcomingBadgeText}>Starting Soon</Text>
      </View>
      <Text style={styles.upcomingTitle}>{item.name}</Text>
      <View style={styles.countdownRow}>
        {d > 0 && <CountdownBlock label="Days" value={d} />}
        <CountdownBlock label="Hrs" value={h} />
        <CountdownBlock label="Min" value={m} />
        <CountdownBlock label="Sec" value={s} />
      </View>
      <TouchableOpacity
        style={[styles.reminderToggle, item.reminderActive && styles.reminderToggleActive]}
        onPress={onReminderToggle}
        activeOpacity={0.8}
      >
        {item.reminderActive
          ? <Bell size={16} color={COLORS.brand.primary} />
          : <BellOff size={16} color={COLORS.ink.secondary} />}
        <Text style={[styles.reminderToggleText, item.reminderActive && { color: COLORS.brand.primary }]}>
          {item.reminderActive ? "Reminder set" : "Remind me"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────

export default function LiveHubScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const { data: schedule, isLoading, refetch } = useQuery({
    queryKey: queryKeys.live.schedule(),
    queryFn: ({ signal }) => api.live.schedule(signal),
    staleTime: 60_000,
    refetchInterval: 60_000,
  });

  // Re-fetch when app comes back to foreground
  const appState = useRef(AppState.currentState);
  useEffect(() => {
    const sub = AppState.addEventListener("change", (next) => {
      if (appState.current.match(/inactive|background/) && next === "active") {
        refetch();
      }
      appState.current = next;
    });
    return () => sub.remove();
  }, [refetch]);

  const reminderMutation = useMutation({
    mutationFn: ({ serviceType, isActive }: { serviceType: ServiceType; isActive: boolean }) =>
      api.live.reminders.set(serviceType, isActive),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.live.schedule() }),
  });

  const liveItem = schedule?.find((s) => s.status === "live");
  const upcomingWithin24h = schedule?.find((s) => {
    if (s.status === "live" || s.status === "ended") return false;
    const ms = new Date(s.nextOccurrence).getTime() - Date.now();
    return ms > 0 && ms < 24 * 3600_000;
  });

  const otherServices = schedule?.filter((s) =>
    s.id !== liveItem?.id && s.id !== upcomingWithin24h?.id && s.status !== "ended"
  ) ?? [];

  if (isLoading) {
    return (
      <View style={[styles.root, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.screenTitle}>Franchise Live</Text>
        <View style={{ padding: 16, gap: 12 }}>
          <Skeleton height={200} style={{ borderRadius: 16 }} />
          <Skeleton height={80} style={{ borderRadius: 12 }} />
          <Skeleton height={80} style={{ borderRadius: 12 }} />
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.screenTitle}>Franchise Live</Text>
      </View>

      {/* ── State A: Something is live ─────────────────────────────── */}
      {liveItem && <LiveHeroCard item={liveItem} />}

      {/* ── State B: Next service within 24h ──────────────────────── */}
      {!liveItem && upcomingWithin24h && (
        <UpcomingHeroCard
          item={upcomingWithin24h}
          onReminderToggle={() =>
            reminderMutation.mutate({
              serviceType: upcomingWithin24h.serviceType,
              isActive: !upcomingWithin24h.reminderActive,
            })
          }
        />
      )}

      {/* ── Service list ──────────────────────────────────────────── */}
      {(schedule?.length ?? 0) > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {liveItem ? "Also This Week" : "Services"}
          </Text>
          {(liveItem ? otherServices : (upcomingWithin24h ? otherServices : schedule ?? [])).map((item) => (
            <ServiceCard
              key={item.id}
              item={item}
              onPress={() => {
                if (item.platform === "zoom") {
                  router.push("/(app)/live/prayer");
                } else {
                  router.push(`/(app)/live/${item.id}`);
                }
              }}
              onReminderToggle={() =>
                reminderMutation.mutate({
                  serviceType: item.serviceType,
                  isActive: !item.reminderActive,
                })
              }
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg.page },
  header: { paddingHorizontal: 20, paddingBottom: 16 },
  screenTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: COLORS.ink.primary,
    fontFamily: "Fraunces_700Bold",
  },

  // Live hero
  liveHero: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 20,
    backgroundColor: COLORS.bg.card,
    borderWidth: 1,
    borderColor: COLORS.status.live + "44",
    padding: 20,
    gap: 10,
  },
  liveHeroTopRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.status.live,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#fff" },
  liveBadgeText: { color: "#fff", fontSize: 11, fontWeight: "700", letterSpacing: 0.8 },
  liveHeroTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.ink.primary,
    fontFamily: "Fraunces_700Bold",
  },
  liveHeroMeta: { fontSize: 13, color: COLORS.ink.secondary },
  joinBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
    backgroundColor: COLORS.brand.primary,
    borderRadius: 100,
    height: 52,
    shadowColor: COLORS.brand.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 6,
  },
  joinBtnText: { color: COLORS.ink.inverse, fontSize: 15, fontWeight: "700" },

  // Upcoming hero
  upcomingHero: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 20,
    backgroundColor: COLORS.bg.card,
    borderWidth: 1,
    borderColor: COLORS.border.default,
    padding: 20,
    gap: 12,
    alignItems: "center",
  },
  upcomingBadge: {
    backgroundColor: COLORS.brand.soft,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: COLORS.border.default,
  },
  upcomingBadgeText: { color: COLORS.brand.primary, fontSize: 11, fontWeight: "700", letterSpacing: 0.6 },
  upcomingTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.ink.primary,
    fontFamily: "Fraunces_700Bold",
    textAlign: "center",
  },
  countdownRow: { flexDirection: "row", gap: 16, marginVertical: 4 },
  countBlock: { alignItems: "center", gap: 4 },
  countNum: {
    fontSize: 36,
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
  reminderToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: COLORS.border.default,
    backgroundColor: COLORS.bg.elevated,
  },
  reminderToggleActive: {
    borderColor: COLORS.brand.primary,
    backgroundColor: COLORS.brand.soft,
  },
  reminderToggleText: { fontSize: 13, fontWeight: "600", color: COLORS.ink.secondary },

  // Section
  section: { paddingHorizontal: 16, paddingTop: 8, gap: 10 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.ink.muted,
    textTransform: "uppercase",
    letterSpacing: 0.12,
    marginBottom: 4,
  },

  // Service card
  serviceCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.bg.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border.subtle,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  serviceCardLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  serviceIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.brand.soft,
    borderWidth: 1,
    borderColor: COLORS.border.default,
    alignItems: "center",
    justifyContent: "center",
  },
  serviceEmoji: { fontSize: 20 },
  serviceCardName: { fontSize: 15, fontWeight: "700", color: COLORS.ink.primary },
  serviceCardMeta: { fontSize: 12, color: COLORS.ink.secondary, marginTop: 2 },
  countdownPill: {
    marginTop: 4,
    backgroundColor: COLORS.brand.soft,
    borderRadius: 100,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: "flex-start",
  },
  countdownPillText: { fontSize: 11, color: COLORS.brand.primary, fontWeight: "600" },
  reminderBtn: { paddingLeft: 8 },
});
