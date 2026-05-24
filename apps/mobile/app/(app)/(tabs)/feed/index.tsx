import { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import { Plus, Rss, Search } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { PostResponse } from "@franchise/types";
import { PostCard } from "@/components/post/PostCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { NetworkBanner } from "@/components/ui/NetworkBanner";
import { Skeleton } from "@/components/ui/Skeleton";
import { useFeed } from "@/lib/hooks/usePosts";
import { COLORS } from "@/lib/theme/colors";

const FILTER_TABS = [
  { label: "All",          value: undefined      },
  { label: "Announcements", value: "announcement" },
  { label: "Testimonies",  value: "testimony"    },
] as const;

export default function FeedScreen() {
  const insets = useSafeAreaInsets();
  const [activeFilter, setActiveFilter] = useState<
    (typeof FILTER_TABS)[number]["value"]
  >(undefined);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isRefetching,
    refetch,
    isError,
  } = useFeed({ postType: activeFilter });

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
        <Text style={styles.title}>Feed</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => router.push("/(app)/search")}
            activeOpacity={0.8}
          >
            <Search size={20} color={COLORS.ink.secondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.fab}
            onPress={() => router.push("/(app)/composer")}
            activeOpacity={0.8}
          >
            <Plus size={20} color={COLORS.bg.page} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Filter pills ─────────────────────────────────────────── */}
      <View style={styles.filters}>
        {FILTER_TABS.map((tab) => {
          const active = activeFilter === tab.value;
          return (
            <TouchableOpacity
              key={tab.label}
              style={[styles.pill, active && styles.pillActive]}
              onPress={() => setActiveFilter(tab.value)}
              activeOpacity={0.8}
            >
              <Text
                style={[styles.pillText, active && styles.pillTextActive]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Content ───────────────────────────────────────────────── */}
      {isLoading ? (
        <View style={styles.list}>
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} style={styles.skeletonCard} />
          ))}
        </View>
      ) : isError ? (
        <EmptyState
          title="Couldn't load posts"
          body="Pull down to retry."
          action={{ label: "Retry", onPress: () => refetch() }}
        />
      ) : posts.length === 0 ? (
        <EmptyState
          icon={<Rss size={28} color={COLORS.brand.primary} />}
          title="Nothing here yet"
          body="Be the first to share something with the community."
          action={{
            label: "Create Post",
            onPress: () => router.push("/(app)/composer"),
          }}
        />
      ) : (
        <FlashList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          estimatedItemSize={200}
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: COLORS.ink.primary,
    fontFamily: "Fraunces_700Bold",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.bg.card,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border.subtle,
  },
  fab: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.brand.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  filters: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: COLORS.bg.card,
    borderWidth: 1,
    borderColor: COLORS.border.subtle,
  },
  pillActive: {
    backgroundColor: COLORS.brand.soft,
    borderColor: COLORS.border.default,
  },
  pillText: {
    fontSize: 13,
    fontWeight: "500",
    color: COLORS.ink.secondary,
  },
  pillTextActive: {
    color: COLORS.brand.primary,
    fontWeight: "700",
  },
  list: {
    padding: 16,
    gap: 12,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  skeletonCard: {
    height: 160,
    borderRadius: 16,
    marginBottom: 12,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: "center",
  },
});
