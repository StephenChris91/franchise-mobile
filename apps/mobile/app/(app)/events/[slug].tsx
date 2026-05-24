import { useState, useLayoutEffect, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, Alert, Linking,
} from "react-native";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as Calendar from "expo-calendar";
import { MapPin, Clock, Users, CalendarPlus, ExternalLink } from "lucide-react-native";
import { Screen } from "@/components/ui/Screen";
import { Skeleton } from "@/components/ui/Skeleton";
import { COLORS } from "@/lib/theme/colors";
import { api } from "@/lib/api/client";
import { queryKeys } from "@/lib/query/keys";
import Toast from "react-native-toast-message";

const RSVP_OPTIONS = [
  { status: "going", label: "Going", emoji: "✅" },
  { status: "interested", label: "Interested", emoji: "⭐" },
  { status: "not_going", label: "Can't go", emoji: "❌" },
] as const;

type RsvpStatus = typeof RSVP_OPTIONS[number]["status"];

function formatFullDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-NG", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-NG", {
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

async function addToDeviceCalendar(opts: {
  title: string;
  location: string;
  notes: string;
  startsAt: Date;
  endsAt: Date;
}): Promise<boolean> {
  const { status } = await Calendar.requestCalendarPermissionsAsync();
  if (status !== "granted") return false;

  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  const defaultCal = calendars.find((c) => c.allowsModifications) ?? calendars[0];
  if (!defaultCal) return false;

  await Calendar.createEventAsync(defaultCal.id, {
    title: opts.title,
    location: opts.location,
    notes: opts.notes,
    startDate: opts.startsAt,
    endDate: opts.endsAt,
    alarms: [{ relativeOffset: -60 }, { relativeOffset: -24 * 60 }], // 1h + 1d before
  });

  return true;
}

export default function EventDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const navigation = useNavigation();
  const queryClient = useQueryClient();

  const { data: event, isLoading } = useQuery({
    queryKey: queryKeys.events.detail(slug),
    queryFn: ({ signal }) => api.events.get(slug, signal),
    staleTime: 60_000,
  });

  useLayoutEffect(() => {
    if (event) {
      navigation.setOptions({ title: event.title });
    }
  }, [event, navigation]);

  const rsvpMutation = useMutation({
    mutationFn: (status: RsvpStatus) =>
      api.events.rsvp(slug, { status }),
    onSuccess: (_, status) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events.detail(slug) });
      Toast.show({ type: "success", text1: `RSVP updated`, text2: `You're marked as ${status}` });
    },
    onError: () => Toast.show({ type: "error", text1: "Could not update RSVP" }),
  });

  const cancelRsvpMutation = useMutation({
    mutationFn: () => api.events.cancelRsvp(slug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events.detail(slug) });
      Toast.show({ type: "success", text1: "RSVP cancelled" });
    },
    onError: () => Toast.show({ type: "error", text1: "Could not cancel RSVP" }),
  });

  const [addingCalendar, setAddingCalendar] = useState(false);

  const handleAddToCalendar = useCallback(async () => {
    if (!event) return;
    setAddingCalendar(true);
    try {
      const added = await addToDeviceCalendar({
        title: event.title,
        location: event.location ?? "",
        notes: event.description ?? "",
        startsAt: new Date(event.startsAt),
        endsAt: new Date(event.endsAt),
      });
      if (added) {
        Toast.show({ type: "success", text1: "Added to calendar" });
      } else {
        Toast.show({ type: "error", text1: "Calendar permission denied" });
      }
    } catch {
      Toast.show({ type: "error", text1: "Could not add to calendar" });
    } finally {
      setAddingCalendar(false);
    }
  }, [event]);

  const handleRsvp = useCallback((status: RsvpStatus) => {
    const current = event?.userRsvp?.status;
    if (current === status) {
      Alert.alert("Cancel RSVP?", "Remove your RSVP for this event?", [
        { text: "Keep RSVP", style: "cancel" },
        { text: "Cancel RSVP", style: "destructive", onPress: () => cancelRsvpMutation.mutate() },
      ]);
    } else {
      rsvpMutation.mutate(status);
    }
  }, [event, rsvpMutation, cancelRsvpMutation]);

  if (isLoading || !event) {
    return (
      <Screen padded>
        <Skeleton height={200} style={{ borderRadius: 12, marginBottom: 16 }} />
        <Skeleton height={28} style={{ marginBottom: 12 }} />
        <Skeleton width="70%" height={16} />
        <Skeleton width="50%" height={16} style={{ marginTop: 8 }} />
        <Skeleton height={44} style={{ marginTop: 24, borderRadius: 8 }} />
      </Screen>
    );
  }

  const userStatus = event.userRsvp?.status as RsvpStatus | undefined;
  const isPast = new Date(event.startsAt) < new Date();

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Cover image */}
        {event.coverImageUrl ? (
          <Image source={{ uri: event.coverImageUrl }} style={styles.cover} />
        ) : (
          <View style={[styles.cover, styles.coverFallback]} />
        )}

        <View style={styles.body}>
          {/* Type badge */}
          <View style={styles.badgeRow}>
            <View style={styles.typeBadge}>
              <Text style={styles.typeBadgeText}>
                {event.eventType.replace("_", " ")}
              </Text>
            </View>
            {isPast && (
              <View style={styles.pastBadge}>
                <Text style={styles.pastBadgeText}>Past event</Text>
              </View>
            )}
          </View>

          {/* Title */}
          <Text style={styles.title}>{event.title}</Text>

          {/* Date/time */}
          <View style={styles.metaRow}>
            <Clock size={16} color={COLORS.brand.primary} />
            <View>
              <Text style={styles.metaText}>{formatFullDate(event.startsAt)}</Text>
              <Text style={styles.metaSubText}>
                {formatTime(event.startsAt)} – {formatTime(event.endsAt)}
              </Text>
            </View>
          </View>

          {/* Location */}
          {event.location ? (
            <TouchableOpacity
              style={styles.metaRow}
              activeOpacity={event.locationUrl ? 0.6 : 1}
              onPress={() => event.locationUrl && Linking.openURL(event.locationUrl)}
            >
              <MapPin size={16} color={COLORS.brand.primary} />
              <Text style={[styles.metaText, event.locationUrl && { textDecorationLine: "underline" }]}>
                {event.location}
              </Text>
              {event.locationUrl && <ExternalLink size={12} color={COLORS.ink.muted} />}
            </TouchableOpacity>
          ) : null}

          {/* RSVP counts */}
          {event.rsvpCounts && (
            <View style={styles.metaRow}>
              <Users size={16} color={COLORS.brand.primary} />
              <Text style={styles.metaText}>
                {event.rsvpCounts.going} going · {event.rsvpCounts.interested} interested
              </Text>
            </View>
          )}

          {/* Description */}
          {event.description ? (
            <View style={styles.descSection}>
              <Text style={styles.sectionTitle}>About this event</Text>
              <Text style={styles.description}>{event.description}</Text>
            </View>
          ) : null}

          {/* RSVP buttons */}
          {event.rsvpRequired && !isPast && (
            <View style={styles.rsvpSection}>
              <Text style={styles.sectionTitle}>RSVP</Text>
              <View style={styles.rsvpRow}>
                {RSVP_OPTIONS.map((opt) => {
                  const isActive = userStatus === opt.status;
                  return (
                    <TouchableOpacity
                      key={opt.status}
                      style={[styles.rsvpBtn, isActive && styles.rsvpBtnActive]}
                      onPress={() => handleRsvp(opt.status)}
                      disabled={rsvpMutation.isPending || cancelRsvpMutation.isPending}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.rsvpBtnEmoji}>{opt.emoji}</Text>
                      <Text style={[styles.rsvpBtnText, isActive && styles.rsvpBtnTextActive]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Add to calendar */}
          {!isPast && (
            <TouchableOpacity
              style={styles.calendarBtn}
              onPress={handleAddToCalendar}
              disabled={addingCalendar}
              activeOpacity={0.8}
            >
              <CalendarPlus size={18} color={COLORS.brand.primary} />
              <Text style={styles.calendarBtnText}>
                {addingCalendar ? "Adding…" : "Add to Calendar"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 48 },
  cover: { width: "100%", height: 220 },
  coverFallback: { backgroundColor: COLORS.bg.elevated },
  body: { padding: 20 },
  badgeRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  typeBadge: {
    backgroundColor: "rgba(212,166,74,0.15)",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 4,
  },
  typeBadgeText: { fontSize: 11, fontWeight: "700", color: COLORS.brand.primary, textTransform: "uppercase", letterSpacing: 0.6 },
  pastBadge: { backgroundColor: "rgba(107,114,128,0.2)", paddingHorizontal: 10, paddingVertical: 3, borderRadius: 4 },
  pastBadgeText: { fontSize: 11, fontWeight: "700", color: COLORS.ink.muted, textTransform: "uppercase", letterSpacing: 0.6 },
  title: { fontSize: 22, fontWeight: "800", color: COLORS.ink.primary, lineHeight: 30, marginBottom: 16 },
  metaRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 10,
  },
  metaText: { fontSize: 14, color: COLORS.ink.secondary, flex: 1, lineHeight: 20 },
  metaSubText: { fontSize: 12, color: COLORS.ink.muted, marginTop: 2 },
  descSection: { marginTop: 20 },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: COLORS.ink.primary, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.4 },
  description: { fontSize: 15, color: COLORS.ink.secondary, lineHeight: 24 },
  rsvpSection: { marginTop: 24 },
  rsvpRow: { flexDirection: "row", gap: 10 },
  rsvpBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: COLORS.bg.card,
    borderWidth: 1,
    borderColor: COLORS.border.subtle,
    gap: 4,
  },
  rsvpBtnActive: { borderColor: COLORS.brand.primary, backgroundColor: "rgba(212,166,74,0.12)" },
  rsvpBtnEmoji: { fontSize: 18 },
  rsvpBtnText: { fontSize: 12, fontWeight: "600", color: COLORS.ink.secondary },
  rsvpBtnTextActive: { color: COLORS.brand.primary },
  calendarBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 20,
    paddingVertical: 13,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.brand.primary,
    backgroundColor: "transparent",
  },
  calendarBtnText: { fontSize: 14, fontWeight: "700", color: COLORS.brand.primary },
});
