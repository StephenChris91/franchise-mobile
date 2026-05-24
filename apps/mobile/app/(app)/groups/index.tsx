/**
 * Groups list screen — browse all groups and join/leave.
 * Route: /(app)/groups
 */
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { Image } from "expo-image";
import { Users } from "lucide-react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Toast from "react-native-toast-message";
import type { GroupResponse } from "@franchise/types";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { api } from "@/lib/api/client";
import { queryKeys } from "@/lib/query/keys";
import { COLORS } from "@/lib/theme/colors";

export default function GroupsScreen() {
  const qc = useQueryClient();

  const {
    data: groups,
    isLoading,
    isRefetching,
    refetch,
    isError,
  } = useQuery({
    queryKey: queryKeys.groups.list(),
    queryFn: ({ signal }) => api.groups.list(signal),
    staleTime: 60_000,
  });

  const { mutate: toggleMembership, variables: pendingSlug } = useMutation({
    mutationFn: async ({
      slug,
      isMember,
    }: {
      slug: string;
      isMember: boolean;
    }) => {
      if (isMember) return api.groups.leave(slug);
      return api.groups.join(slug);
    },
    onSuccess: (_, { isMember }) => {
      qc.invalidateQueries({ queryKey: queryKeys.groups.list() });
      Toast.show({
        type: "success",
        text1: isMember ? "Left group" : "Joined group!",
      });
    },
    onError: () => {
      Toast.show({ type: "error", text1: "Something went wrong" });
    },
  });

  if (isLoading) {
    return (
      <View style={[styles.root, { padding: 16, gap: 12 }]}>
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} style={{ height: 100, borderRadius: 16 }} />
        ))}
      </View>
    );
  }

  if (isError || !groups) {
    return (
      <EmptyState
        title="Couldn't load groups"
        body="Pull down to retry."
        action={{ label: "Retry", onPress: () => refetch() }}
      />
    );
  }

  function renderItem({ item }: { item: GroupResponse }) {
    const isPending =
      pendingSlug?.slug === item.slug;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/(app)/groups/${item.slug}`)}
        activeOpacity={0.9}
      >
        {/* Cover / icon */}
        {item.coverImageUrl ? (
          <Image
            source={{ uri: item.coverImageUrl }}
            style={styles.cover}
            contentFit="cover"
          />
        ) : (
          <View style={[styles.cover, styles.coverPlaceholder]}>
            <Users size={24} color={COLORS.brand.primary} />
          </View>
        )}

        {/* Info */}
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.desc} numberOfLines={2}>
            {item.description}
          </Text>
          <Text style={styles.memberCount}>
            {item.memberCount}{" "}
            {item.memberCount === 1 ? "member" : "members"}
          </Text>
        </View>

        {/* Join/Leave button */}
        <TouchableOpacity
          style={[
            styles.joinBtn,
            item.isMember && styles.joinBtnLeave,
          ]}
          onPress={() =>
            toggleMembership({ slug: item.slug, isMember: !!item.isMember })
          }
          disabled={isPending}
          activeOpacity={0.8}
        >
          {isPending ? (
            <ActivityIndicator
              size="small"
              color={item.isMember ? COLORS.status.error : COLORS.bg.page}
            />
          ) : (
            <Text
              style={[
                styles.joinBtnText,
                item.isMember && styles.joinBtnTextLeave,
              ]}
            >
              {item.isMember ? "Leave" : "Join"}
            </Text>
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.root}>
      <FlatList
        data={groups}
        keyExtractor={(g) => g.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={
          <EmptyState
            icon={<Users size={28} color={COLORS.brand.primary} />}
            title="No groups yet"
            body="Groups will appear here once created."
          />
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefetching && !isLoading}
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
    paddingBottom: 40,
  },
  card: {
    backgroundColor: COLORS.bg.card,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.border.subtle,
    gap: 0,
  },
  cover: {
    width: 72,
    height: 72,
    flexShrink: 0,
  },
  coverPlaceholder: {
    backgroundColor: COLORS.brand.soft,
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 2,
  },
  name: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.ink.primary,
  },
  desc: {
    fontSize: 12,
    color: COLORS.ink.secondary,
    lineHeight: 18,
  },
  memberCount: {
    fontSize: 11,
    color: COLORS.ink.muted,
    marginTop: 2,
  },
  joinBtn: {
    marginRight: 12,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: COLORS.brand.primary,
    minWidth: 56,
    alignItems: "center",
  },
  joinBtnLeave: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(201,58,58,0.5)",
  },
  joinBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.bg.page,
  },
  joinBtnTextLeave: {
    color: COLORS.status.error,
  },
});
