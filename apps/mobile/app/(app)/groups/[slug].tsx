/**
 * Group detail screen — Posts / Members / About tabs.
 * Route: /(app)/groups/[slug]
 */
import { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useLocalSearchParams, router, useNavigation } from "expo-router";
import { useLayoutEffect } from "react";
import { Image } from "expo-image";
import { Users, Info } from "lucide-react-native";
import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import type { GroupResponse } from "@franchise/types";
import Toast from "react-native-toast-message";
import type { PostResponse, GroupMemberResponse } from "@franchise/types";
import { PostCard } from "@/components/post/PostCard";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { api } from "@/lib/api/client";
import { queryKeys } from "@/lib/query/keys";
import { COLORS } from "@/lib/theme/colors";

type Tab = "posts" | "members" | "about";

export default function GroupDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const navigation = useNavigation();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>("posts");

  const { data: group, isLoading: groupLoading } = useQuery({
    queryKey: queryKeys.groups.detail(slug),
    queryFn: ({ signal }) => api.groups.get(slug, signal),
  });

  const { data: members, isLoading: membersLoading } = useQuery({
    queryKey: queryKeys.groups.members(slug),
    queryFn: ({ signal }) => api.groups.members(slug, signal),
    enabled: activeTab === "members",
  });

  const {
    data: postsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: postsLoading,
    refetch: refetchPosts,
    isRefetching: isRefetchingPosts,
  } = useInfiniteQuery({
    queryKey: queryKeys.posts.list({ groupId: group?.id }),
    queryFn: ({ pageParam, signal }) =>
      api.posts.list(
        { groupId: group?.id, cursor: pageParam as string | undefined, limit: 20 },
        signal
      ),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled: !!group?.id && activeTab === "posts",
  });

  const posts = postsData?.pages.flatMap((p) => p.data) ?? [];

  const { mutate: toggleMembership, isPending: joinPending } = useMutation({
    mutationFn: () =>
      group?.isMember ? api.groups.leave(slug) : api.groups.join(slug),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.groups.detail(slug) });
      qc.invalidateQueries({ queryKey: queryKeys.groups.list() });
      Toast.show({
        type: "success",
        text1: group?.isMember ? "Left group" : "Joined!",
      });
    },
  });

  // Set header title to group name once loaded
  useLayoutEffect(() => {
    if (group?.name) {
      navigation.setOptions({ headerTitle: group.name });
    }
  }, [group?.name, navigation]);

  const onPostsEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (groupLoading) {
    return (
      <View style={[styles.root, { padding: 16, gap: 12 }]}>
        <Skeleton style={{ height: 200, borderRadius: 0 }} />
        <Skeleton style={{ height: 20, borderRadius: 8, width: "60%" }} />
        <Skeleton style={{ height: 16, borderRadius: 8 }} />
      </View>
    );
  }

  if (!group) {
    return (
      <EmptyState title="Group not found" body="This group may have been removed." />
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView stickyHeaderIndices={[1]} showsVerticalScrollIndicator={false}>
        {/* ── Cover + meta ──────────────────────────────────────── */}
        <View>
          {group.coverImageUrl ? (
            <Image
              source={{ uri: group.coverImageUrl }}
              style={styles.coverImage}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.coverImage, styles.coverPlaceholder]}>
              <Users size={40} color={COLORS.brand.primary} />
            </View>
          )}

          <View style={styles.groupMeta}>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={styles.groupName}>{group.name}</Text>
              <Text style={styles.memberCount}>
                {group.memberCount}{" "}
                {group.memberCount === 1 ? "member" : "members"} ·{" "}
                {group.groupType}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.joinBtn, group.isMember && styles.joinBtnLeave]}
              onPress={() => toggleMembership()}
              disabled={joinPending}
              activeOpacity={0.8}
            >
              {joinPending ? (
                <ActivityIndicator
                  size="small"
                  color={group.isMember ? COLORS.status.error : COLORS.bg.page}
                />
              ) : (
                <Text
                  style={[
                    styles.joinBtnText,
                    group.isMember && styles.joinBtnTextLeave,
                  ]}
                >
                  {group.isMember ? "Leave" : "Join"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Tab bar (sticky) ─────────────────────────────────── */}
        <View style={styles.tabBar}>
          {(["posts", "members", "about"] as Tab[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text
                style={[styles.tabText, activeTab === tab && styles.tabTextActive]}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Tab content ─────────────────────────────────────── */}
        <View style={styles.tabContent}>
          {activeTab === "posts" && (
            <PostsTab
              posts={posts}
              isLoading={postsLoading}
              isFetchingMore={isFetchingNextPage}
              onEndReached={onPostsEndReached}
              onRefresh={refetchPosts}
              isRefreshing={isRefetchingPosts && !postsLoading}
              onCompose={() => router.push("/(app)/composer")}
            />
          )}
          {activeTab === "members" && (
            <MembersTab members={members ?? []} isLoading={membersLoading} />
          )}
          {activeTab === "about" && <AboutTab group={group} />}
        </View>
      </ScrollView>
    </View>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

function PostsTab({
  posts,
  isLoading,
  isFetchingMore,
  onEndReached,
  onRefresh,
  isRefreshing,
  onCompose,
}: {
  posts: PostResponse[];
  isLoading: boolean;
  isFetchingMore: boolean;
  onEndReached: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  onCompose: () => void;
}) {
  if (isLoading) {
    return (
      <View style={{ gap: 12, padding: 0 }}>
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} style={{ height: 150, borderRadius: 16 }} />
        ))}
      </View>
    );
  }

  if (posts.length === 0) {
    return (
      <EmptyState
        title="No posts yet"
        body="Be the first to post in this group."
        action={{ label: "Create Post", onPress: onCompose }}
      />
    );
  }

  return (
    <FlatList
      data={posts}
      keyExtractor={(p) => p.id}
      renderItem={({ item }) => (
        <PostCard
          post={item}
          onPress={() => router.push(`/(app)/feed/${item.id}`)}
        />
      )}
      ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      ListFooterComponent={
        isFetchingMore ? (
          <ActivityIndicator
            color={COLORS.brand.primary}
            style={{ paddingVertical: 20 }}
          />
        ) : null
      }
      onEndReached={onEndReached}
      onEndReachedThreshold={0.4}
      scrollEnabled={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          tintColor={COLORS.brand.primary}
        />
      }
    />
  );
}

function MembersTab({
  members,
  isLoading,
}: {
  members: GroupMemberResponse[];
  isLoading?: boolean;
}) {
  if (isLoading) {
    return (
      <View style={{ gap: 8 }}>
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} style={{ height: 56, borderRadius: 12 }} />
        ))}
      </View>
    );
  }

  return (
    <FlatList
      data={members}
      keyExtractor={(m) => m.userId}
      scrollEnabled={false}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.memberRow}
          onPress={() => router.push(`/(app)/profile/${item.profile.username}`)}
          activeOpacity={0.8}
        >
          <Avatar
            uri={item.profile.photoUrl}
            name={item.profile.fullName}
            size={40}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.memberName}>{item.profile.fullName}</Text>
            <Text style={styles.memberRole}>@{item.profile.username}</Text>
          </View>
          {item.role !== "member" && (
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{item.role}</Text>
            </View>
          )}
        </TouchableOpacity>
      )}
      ItemSeparatorComponent={() => (
        <View
          style={{ height: 1, backgroundColor: COLORS.border.subtle, marginLeft: 52 }}
        />
      )}
    />
  );
}

function AboutTab({ group }: { group: GroupResponse }) {
  return (
    <View style={styles.aboutWrap}>
      <View style={styles.aboutRow}>
        <Info size={16} color={COLORS.brand.primary} />
        <Text style={styles.aboutLabel}>Description</Text>
      </View>
      <Text style={styles.aboutBody}>{group.description || "No description provided."}</Text>

      <View style={[styles.aboutRow, { marginTop: 16 }]}>
        <Users size={16} color={COLORS.brand.primary} />
        <Text style={styles.aboutLabel}>Group type</Text>
      </View>
      <Text style={styles.aboutBody}>{group.groupType}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg.page },
  coverImage: {
    width: "100%",
    height: 180,
    backgroundColor: COLORS.bg.card,
  },
  coverPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.brand.soft,
  },
  groupMeta: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
    backgroundColor: COLORS.bg.elevated,
  },
  groupName: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.ink.primary,
    fontFamily: "Fraunces_700Bold",
  },
  memberCount: {
    fontSize: 13,
    color: COLORS.ink.muted,
  },
  joinBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: COLORS.brand.primary,
    minWidth: 64,
    alignItems: "center",
  },
  joinBtnLeave: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(201,58,58,0.5)",
  },
  joinBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.bg.page,
  },
  joinBtnTextLeave: {
    color: COLORS.status.error,
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: COLORS.bg.elevated,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.subtle,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.brand.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.ink.muted,
  },
  tabTextActive: {
    color: COLORS.brand.primary,
    fontWeight: "700",
  },
  tabContent: {
    padding: 16,
    paddingBottom: 60,
    gap: 12,
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 0,
  },
  memberName: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.ink.primary,
  },
  memberRole: {
    fontSize: 12,
    color: COLORS.ink.muted,
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: COLORS.brand.soft,
  },
  roleText: {
    fontSize: 11,
    color: COLORS.brand.primary,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  aboutWrap: {
    gap: 6,
  },
  aboutRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  aboutLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.ink.secondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  aboutBody: {
    fontSize: 15,
    color: COLORS.ink.secondary,
    lineHeight: 23,
    paddingLeft: 24,
  },
});
