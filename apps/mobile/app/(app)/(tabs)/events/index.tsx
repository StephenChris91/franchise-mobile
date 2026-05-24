import { useState, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Image } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Calendar, MapPin, Clock } from "lucide-react-native";
import { Screen } from "@/components/ui/Screen";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { COLORS } from "@/lib/theme/colors";
import { api } from "@/lib/api/client";
import { queryKeys } from "@/lib/query/keys";
import type { EventResponse } from "@franchise/types";

const TABS = ["Upcoming", "Past"] as const;
type Tab = typeof TABS[number];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-NG", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-NG", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function EventCard({ event, onPress }: { event: EventResponse; onPress: () => void }) {
  const isPast = new Date(event.startsAt) < new Date();
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      {event.coverImageUrl ? (
        <Image source={{ uri: event.coverImageUrl }} style={styles.cardImage} />
      ) : (
        <View style={[styles.cardImage, styles.cardImageFallback]}>
          <Calendar size={32} color={COLORS.brand.primary} />
        </View>
      )}

      <View style={styles.cardBody}>
        <View style={styles.cardHeader}>
          <View style={[styles.typeBadge, isPast && styles.typeBadgePast]}>
            <Text style={[styles.typeBadgeText, isPast && styles.typeBadgeTextPast]}>
              {event.eventType.replace("_", " ")}
            </Text>
          </View>
          {event.rsvpRequired && (
            <View style={styles.rsvpBadge}>
              <Text style={styles.rsvpBadgeText}>RSVP Required</Text>
            </View>
          )}
        </View>

        <Text style={styles.cardTitle} numberOfLines={2}>{event.title}</Text>

        <View style={styles.cardMeta}>
          <Clock size={12} color={COLORS.ink.muted} />
          <Text style={styles.cardMetaText}>
            {formatDate(event.startsAt)} · {formatTime(event.startsAt)}
          </Text>
        </View>

        {event.location ? (
          <View style={styles.cardMeta}>
            <MapPin size={12} color={COLORS.ink.muted} />
            <Text style={[styles.cardMetaText, { flex: 1 }]} numberOfLines={1}>
              {event.location}
            </Text>
          </View>
        ) : null}

        {event.rsvpCounts && (
          <Text style={styles.rsvpCount}>
            {event.rsvpCounts.going} going · {event.rsvpCounts.interested} interested
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

function EventSkeletons() {
  return (
    <>
      {[1, 2, 3].map((i) => (
        <View key={i} style={styles.skeletonCard}>
          <Skeleton style={styles.skeletonImage} />
          <View style={styles.skeletonBody}>
            <Skeleton width={80} height={20} rounded />
            <Skeleton height={20} style={{ marginTop: 8 }} />
            <Skeleton width="60%" height={14} style={{ marginTop: 6 }} />
          </View>
        </View>
      ))}
    </>
  );
}

export default function EventsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("Upcoming");
  const isUpcoming = activeTab === "Upcoming";

  const { data: events = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: queryKeys.events.list(isUpcoming),
    queryFn: ({ signal }) => api.events.list(isUpcoming, signal),
    staleTime: 60_000,
  });

  const handleRefresh = useCallback(() => { refetch(); }, [refetch]);

  return (
    <Screen style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Events</Text>
      </View>

      {/* Tab pills */}
      <View style={styles.tabRow}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      {isLoading ? (
        <View style={styles.listPad}>
          <EventSkeletons />
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(e) => e.id}
          contentContainerStyle={styles.listPad}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={handleRefresh}
              tintColor={COLORS.brand.primary}
            />
          }
          renderItem={({ item }) => (
            <EventCard
              event={item}
              onPress={() => router.push(`/(app)/events/${item.slug}`)}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              icon={<Calendar size={28} color={COLORS.brand.primary} />}
              title={isUpcoming ? "No upcoming events" : "No past events"}
              body={isUpcoming ? "Check back soon for upcoming services and events." : undefined}
            />
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg.page },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.ink.primary,
  },
  tabRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: COLORS.bg.card,
    borderWidth: 1,
    borderColor: COLORS.border.subtle,
  },
  tabActive: {
    backgroundColor: COLORS.brand.primary,
    borderColor: COLORS.brand.primary,
  },
  tabText: { fontSize: 13, fontWeight: "500", color: COLORS.ink.secondary },
  tabTextActive: { color: COLORS.bg.page },
  listPad: { paddingHorizontal: 16, paddingBottom: 24 },
  card: {
    backgroundColor: COLORS.bg.card,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border.subtle,
  },
  cardImage: {
    width: "100%",
    height: 160,
  },
  cardImageFallback: {
    backgroundColor: COLORS.bg.elevated,
    alignItems: "center",
    justifyContent: "center",
  },
  cardBody: { padding: 14 },
  cardHeader: { flexDirection: "row", gap: 8, marginBottom: 8 },
  typeBadge: {
    backgroundColor: "rgba(212,166,74,0.15)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeBadgePast: { backgroundColor: "rgba(107,114,128,0.2)" },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: COLORS.brand.primary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  typeBadgeTextPast: { color: COLORS.ink.muted },
  rsvpBadge: {
    backgroundColor: "rgba(74,158,212,0.15)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  rsvpBadgeText: { fontSize: 10, fontWeight: "600", color: "#4a9ed4", textTransform: "uppercase", letterSpacing: 0.5 },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.ink.primary,
    marginBottom: 8,
    lineHeight: 22,
  },
  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 4,
  },
  cardMetaText: { fontSize: 12, color: COLORS.ink.muted },
  rsvpCount: { fontSize: 12, color: COLORS.ink.secondary, marginTop: 6 },
  skeletonCard: {
    backgroundColor: COLORS.bg.card,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 14,
  },
  skeletonImage: { width: "100%", height: 160, borderRadius: 0 },
  skeletonBody: { padding: 14, gap: 8 },
});
