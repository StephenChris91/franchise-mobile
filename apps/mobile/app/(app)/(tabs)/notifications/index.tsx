import { useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from "react-native";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Bell, Heart, MessageCircle, Users, Megaphone } from "lucide-react-native";
import { Screen } from "@/components/ui/Screen";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { COLORS } from "@/lib/theme/colors";
import { api } from "@/lib/api/client";
import { queryKeys } from "@/lib/query/keys";
import { formatDistanceToNow } from "date-fns";
import type { NotificationResponse } from "@franchise/types";

const NOTIF_META: Record<string, { icon: typeof Bell; color: string; label: string }> = {
  comment_on_post: { icon: MessageCircle, color: "#4a9ed4", label: "commented on your post" },
  reaction_on_post: { icon: Heart, color: "#e07491", label: "reacted to your post" },
  prayer_reaction: { icon: Heart, color: COLORS.brand.primary, label: "reacted to your prayer" },
  group_join: { icon: Users, color: "#5cb85c", label: "joined your group" },
  mention: { icon: Bell, color: COLORS.brand.primary, label: "mentioned you" },
  new_post_in_group: { icon: Megaphone, color: "#a881e0", label: "posted in your group" },
  announcement: { icon: Megaphone, color: COLORS.brand.primary, label: "New announcement" },
  event_reminder: { icon: Bell, color: "#4a9ed4", label: "Event reminder" },
};

function NotifIcon({ type }: { type: string }) {
  const meta = NOTIF_META[type] ?? { icon: Bell, color: COLORS.brand.primary };
  const Icon = meta.icon;
  return (
    <View style={[styles.notifIcon, { backgroundColor: meta.color + "22" }]}>
      <Icon size={16} color={meta.color} />
    </View>
  );
}

function NotifItem({
  notif,
  onPress,
}: {
  notif: NotificationResponse;
  onPress: () => void;
}) {
  const meta = NOTIF_META[notif.notificationType];
  const label = meta?.label ?? notif.notificationType.replace(/_/g, " ");

  return (
    <TouchableOpacity
      style={[styles.notifRow, !notif.isRead && styles.notifRowUnread]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.notifLeft}>
        <NotifIcon type={notif.notificationType} />
      </View>
      <View style={styles.notifBody}>
        <Text style={styles.notifText} numberOfLines={2}>
          {notif.actorName ? (
            <>
              <Text style={styles.notifActor}>{notif.actorName}</Text>
              {" "}{label}
            </>
          ) : (
            label
          )}
        </Text>
        <Text style={styles.notifTime}>
          {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
        </Text>
      </View>
      {!notif.isRead && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );
}

function NotifSkeletons() {
  return (
    <View style={{ gap: 1 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <View key={i} style={styles.skeletonRow}>
          <Skeleton width={40} height={40} rounded />
          <View style={{ flex: 1, gap: 6 }}>
            <Skeleton height={14} />
            <Skeleton width="40%" height={12} />
          </View>
        </View>
      ))}
    </View>
  );
}

export default function NotificationsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    isRefetching,
  } = useInfiniteQuery({
    queryKey: queryKeys.notifications.list(),
    queryFn: ({ pageParam, signal }) =>
      api.notifications.list({ cursor: pageParam, limit: 20 }, signal),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    staleTime: 30_000,
  });

  const readAllMutation = useMutation({
    mutationFn: () => api.notifications.readAll(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.list() });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount() });
    },
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => api.notifications.read(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.list() });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount() });
    },
  });

  const notifications = data?.pages.flatMap((p) => p.data) ?? [];
  const hasUnread = notifications.some((n) => !n.isRead);

  const handleNotifPress = useCallback(
    (notif: NotificationResponse) => {
      if (!notif.isRead) {
        markReadMutation.mutate(notif.id);
      }
      // Deep-link to the relevant entity
      if (
        notif.notificationType === "comment_on_post" ||
        notif.notificationType === "reaction_on_post" ||
        notif.notificationType === "prayer_reaction"
      ) {
        if (notif.entityType === "post" || notif.entityType === "comment") {
          const postId = notif.entityType === "post" ? notif.entityId : null;
          if (postId) router.push(`/(app)/feed/${postId}`);
        }
      }
    },
    [markReadMutation, router]
  );

  const handleRefresh = useCallback(() => { refetch(); }, [refetch]);

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <Screen style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        {hasUnread && (
          <TouchableOpacity
            onPress={() => readAllMutation.mutate()}
            disabled={readAllMutation.isPending}
            activeOpacity={0.7}
          >
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <View style={{ paddingHorizontal: 16 }}>
          <NotifSkeletons />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(n) => n.id}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={handleRefresh}
              tintColor={COLORS.brand.primary}
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          renderItem={({ item }) => (
            <NotifItem notif={item} onPress={() => handleNotifPress(item)} />
          )}
          ListEmptyComponent={
            <EmptyState
              icon={<Bell size={28} color={COLORS.brand.primary} />}
              title="All caught up"
              body="Your notifications will appear here."
            />
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={{ padding: 16 }}>
                <Skeleton height={48} style={{ borderRadius: 8 }} />
              </View>
            ) : null
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg.page },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: { fontSize: 24, fontWeight: "700", color: COLORS.ink.primary },
  markAllText: { fontSize: 13, fontWeight: "600", color: COLORS.brand.primary },
  notifRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border.subtle,
  },
  notifRowUnread: { backgroundColor: "rgba(212,166,74,0.05)" },
  notifLeft: { width: 40, alignItems: "center" },
  notifIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  notifBody: { flex: 1 },
  notifText: { fontSize: 14, color: COLORS.ink.secondary, lineHeight: 20 },
  notifActor: { fontWeight: "700", color: COLORS.ink.primary },
  notifTime: { fontSize: 11, color: COLORS.ink.muted, marginTop: 3 },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.brand.primary,
  },
  skeletonRow: {
    flexDirection: "row",
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border.subtle,
  },
});
