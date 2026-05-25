import { useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { HandHeart } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { PostResponse } from "@franchise/types";
import { PostCard } from "@/components/post/PostCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { NetworkBanner } from "@/components/ui/NetworkBanner";
import { Skeleton } from "@/components/ui/Skeleton";
import { usePrayerWall } from "@/lib/hooks/usePosts";
import { COLORS } from "@/lib/theme/colors";

export default function PrayerWallScreen() {
  const insets = useSafeAreaInsets();
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isRefetching,
    refetch,
    isError,
  } = usePrayerWall();

  const posts = data?.pages.flatMap((p) => p.data) ?? [];

  const onEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  function renderItem({ item }: { item: PostResponse }) {
    return (
      <PostCard
        post={item}
        onPress={() => router.push(`/(app)/feed/${item.id}`)}
      />
    );
  }

  function renderFooter() {
    if (!isFetchingNextPage) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={COLORS.brand.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: COLORS.bg.page }]}>
      <NetworkBanner />

      {/* ── Header ─────────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.title}>Prayer Wall</Text>
        <Text style={styles.subtitle}>Lift one another up in prayer</Text>
      </View>

      {/* ── Content ───────────────────────────────────────────────── */}
      {isLoading ? (
        <View style={styles.skeletonWrap}>
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} style={styles.skeletonCard} />
          ))}
        </View>
      ) : isError ? (
        <EmptyState
          title="Couldn't load prayer requests"
          body="Pull down to retry."
          action={{ label: "Retry", onPress: () => refetch() }}
        />
      ) : posts.length === 0 ? (
        <EmptyState
          icon={<HandHeart size={28} color={COLORS.brand.primary} />}
          title="No prayer requests yet"
          body="Share your heart and the community will lift you up."
          action={{
            label: "Add Prayer Request",
            onPress: () => router.push("/(app)/composer"),
          }}
        />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          ListFooterComponent={renderFooter}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.4}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching && !isLoading}
              onRefresh={refetch}
              tintColor={COLORS.brand.primary}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: COLORS.ink.primary,
    fontFamily: "Fraunces_700Bold",
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.ink.muted,
    fontStyle: "italic",
  },
  skeletonWrap: {
    padding: 16,
  },
  skeletonCard: {
    height: 160,
    borderRadius: 16,
    marginBottom: 12,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: "center",
  },
});
