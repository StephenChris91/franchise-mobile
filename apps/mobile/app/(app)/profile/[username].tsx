/**
 * Public profile view.
 * Route: /(app)/profile/[username]
 */
import { useState, useCallback, useLayoutEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useLocalSearchParams, useNavigation, router } from "expo-router";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import type { PostResponse } from "@franchise/types";
import { Avatar } from "@/components/ui/Avatar";
import { PostCard } from "@/components/post/PostCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { api } from "@/lib/api/client";
import { queryKeys } from "@/lib/query/keys";
import { COLORS } from "@/lib/theme/colors";

export default function PublicProfileScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const navigation = useNavigation();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: queryKeys.profile.user(username),
    queryFn: ({ signal }) => api.profile.get(username, signal),
  });

  const {
    data: postsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: postsLoading,
    refetch,
    isRefetching,
  } = useInfiniteQuery({
    queryKey: queryKeys.posts.list(),
    queryFn: ({ pageParam, signal }) =>
      api.posts.list(
        { cursor: pageParam as string | undefined, limit: 20 },
        signal
      ),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled: !!profile,
  });

  const posts = postsData?.pages.flatMap((p) => p.data) ?? [];

  useLayoutEffect(() => {
    if (profile?.fullName) {
      navigation.setOptions({ headerTitle: profile.fullName });
    }
  }, [profile?.fullName, navigation]);

  const onEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (profileLoading) {
    return (
      <View style={[styles.root, { padding: 16, gap: 16 }]}>
        <View style={styles.skeletonHeader}>
          <Skeleton style={{ width: 80, height: 80, borderRadius: 40 }} />
          <View style={{ flex: 1, gap: 8 }}>
            <Skeleton style={{ height: 18, borderRadius: 6, width: "70%" }} />
            <Skeleton style={{ height: 14, borderRadius: 6, width: "50%" }} />
          </View>
        </View>
        <Skeleton style={{ height: 60, borderRadius: 12 }} />
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} style={{ height: 150, borderRadius: 16 }} />
        ))}
      </View>
    );
  }

  if (!profile) {
    return (
      <EmptyState
        title="Profile not found"
        body="This user may no longer exist."
      />
    );
  }

  const joinedYear = new Date(profile.createdAt).getFullYear();

  return (
    <View style={styles.root}>
      <FlatList
        data={posts}
        keyExtractor={(p) => p.id}
        renderItem={({ item }: { item: PostResponse }) => (
          <PostCard
            post={item}
            onPress={() => router.push(`/(app)/feed/${item.id}`)}
          />
        )}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListHeaderComponent={
          <View style={{ gap: 16, marginBottom: 16 }}>
            {/* ── Avatar + basic info ───────────────────────────── */}
            <View style={styles.profileHeader}>
              <Avatar
                uri={profile.photoUrl}
                name={profile.fullName}
                size={80}
              />
              <View style={styles.profileInfo}>
                <Text style={styles.fullName}>{profile.fullName}</Text>
                <Text style={styles.handle}>@{profile.username}</Text>
                <Text style={styles.ministry}>{profile.ministry}</Text>
              </View>
            </View>

            {/* ── Bio ──────────────────────────────────────────── */}
            {profile.bio && (
              <Text style={styles.bio}>{profile.bio}</Text>
            )}

            {/* ── Stats row ────────────────────────────────────── */}
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{posts.length}</Text>
                <Text style={styles.statLabel}>Posts</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={styles.statValue}>{joinedYear}</Text>
                <Text style={styles.statLabel}>Member since</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={styles.statValue}>{profile.role}</Text>
                <Text style={styles.statLabel}>Role</Text>
              </View>
            </View>

            {/* ── Posts heading ────────────────────────────────── */}
            {!postsLoading && posts.length > 0 && (
              <Text style={styles.sectionTitle}>Posts</Text>
            )}
          </View>
        }
        ListEmptyComponent={
          postsLoading ? (
            <View style={{ gap: 12 }}>
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} style={{ height: 150, borderRadius: 16 }} />
              ))}
            </View>
          ) : (
            <EmptyState
              title="No posts yet"
              body={`${profile.fullName} hasn't posted anything.`}
            />
          )
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <ActivityIndicator
              color={COLORS.brand.primary}
              style={{ paddingVertical: 20 }}
            />
          ) : null
        }
        onEndReached={onEndReached}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching && !postsLoading}
            onRefresh={refetch}
            tintColor={COLORS.brand.primary}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg.page,
  },
  listContent: {
    padding: 16,
    paddingBottom: 60,
  },
  skeletonHeader: {
    flexDirection: "row",
    gap: 16,
    alignItems: "center",
  },
  profileHeader: {
    flexDirection: "row",
    gap: 16,
    alignItems: "flex-start",
  },
  profileInfo: {
    flex: 1,
    gap: 3,
    paddingTop: 4,
  },
  fullName: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.ink.primary,
    fontFamily: "Fraunces_700Bold",
  },
  handle: {
    fontSize: 14,
    color: COLORS.ink.muted,
  },
  ministry: {
    fontSize: 13,
    color: COLORS.brand.primary,
    fontWeight: "600",
  },
  bio: {
    fontSize: 15,
    color: COLORS.ink.secondary,
    lineHeight: 23,
  },
  statsRow: {
    flexDirection: "row",
    backgroundColor: COLORS.bg.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border.subtle,
  },
  stat: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.ink.primary,
    textTransform: "capitalize",
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.ink.muted,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.border.subtle,
    alignSelf: "stretch",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.ink.primary,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.subtle,
  },
});
