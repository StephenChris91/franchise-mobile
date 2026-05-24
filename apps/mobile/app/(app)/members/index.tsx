/**
 * Member directory — search by name, filter by ministry.
 * Route: /(app)/members
 */
import { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { Search, Users2 } from "lucide-react-native";
import { useQuery } from "@tanstack/react-query";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import type { MemberResponse } from "@franchise/types";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { api } from "@/lib/api/client";
import { queryKeys } from "@/lib/query/keys";
import { COLORS } from "@/lib/theme/colors";

const MINISTRIES = [
  "All",
  "Worship",
  "Media",
  "Ushering",
  "Children",
  "Youth",
  "Prayer",
  "Hospitality",
];

export default function MembersScreen() {
  const [search, setSearch] = useState("");
  const [ministry, setMinistry] = useState<string | undefined>(undefined);
  const debouncedSearch = useDebouncedValue(search, 300);

  const {
    data: members,
    isLoading,
    isRefetching,
    refetch,
    isError,
  } = useQuery({
    queryKey: queryKeys.members.list({
      search: debouncedSearch || undefined,
      ministry,
    }),
    queryFn: ({ signal }) =>
      api.members.list(
        { search: debouncedSearch || undefined, ministry },
        signal
      ),
    staleTime: 30_000,
  });

  const renderItem = useCallback(
    ({ item }: { item: MemberResponse }) => (
      <TouchableOpacity
        style={styles.row}
        onPress={() => router.push(`/(app)/profile/${item.username}`)}
        activeOpacity={0.8}
      >
        <Avatar uri={item.photoUrl} name={item.fullName} size={46} />
        <View style={styles.rowInfo}>
          <Text style={styles.name}>{item.fullName}</Text>
          <Text style={styles.username}>@{item.username}</Text>
          {item.ministry && (
            <View style={styles.ministryBadge}>
              <Text style={styles.ministryText}>{item.ministry}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    ),
    []
  );

  return (
    <View style={styles.root}>
      {/* ── Search bar ─────────────────────────────────────────── */}
      <View style={styles.searchWrap}>
        <Search size={16} color={COLORS.ink.muted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search members…"
          placeholderTextColor={COLORS.ink.muted}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      {/* ── Ministry filter ──────────────────────────────────────── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContent}
      >
        {MINISTRIES.map((m) => {
          const val = m === "All" ? undefined : m;
          const active = ministry === val;
          return (
            <TouchableOpacity
              key={m}
              style={[styles.filterPill, active && styles.filterPillActive]}
              onPress={() => setMinistry(val)}
              activeOpacity={0.8}
            >
              <Text
                style={[styles.filterText, active && styles.filterTextActive]}
              >
                {m}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── List ──────────────────────────────────────────────────── */}
      {isLoading ? (
        <View style={styles.listPad}>
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} style={{ height: 60, borderRadius: 12, marginBottom: 8 }} />
          ))}
        </View>
      ) : isError ? (
        <EmptyState
          title="Couldn't load members"
          action={{ label: "Retry", onPress: () => refetch() }}
        />
      ) : (members ?? []).length === 0 ? (
        <EmptyState
          icon={<Users2 size={28} color={COLORS.brand.primary} />}
          title="No members found"
          body={search ? `No results for "${search}"` : "Members will appear here."}
        />
      ) : (
        <FlatList
          data={members}
          keyExtractor={(m) => m.userId}
          renderItem={renderItem}
          contentContainerStyle={styles.listPad}
          ItemSeparatorComponent={() => (
            <View
              style={{
                height: 1,
                backgroundColor: COLORS.border.subtle,
                marginLeft: 62,
              }}
            />
          )}
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
  root: {
    flex: 1,
    backgroundColor: COLORS.bg.page,
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    margin: 16,
    marginBottom: 0,
    backgroundColor: COLORS.bg.card,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.border.subtle,
  },
  searchInput: {
    flex: 1,
    color: COLORS.ink.primary,
    fontSize: 15,
  },
  filterScroll: {
    marginTop: 12,
  },
  filterContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: COLORS.bg.card,
    borderWidth: 1,
    borderColor: COLORS.border.subtle,
  },
  filterPillActive: {
    backgroundColor: COLORS.brand.soft,
    borderColor: COLORS.border.default,
  },
  filterText: {
    fontSize: 13,
    color: COLORS.ink.secondary,
    fontWeight: "500",
  },
  filterTextActive: {
    color: COLORS.brand.primary,
    fontWeight: "700",
  },
  listPad: {
    padding: 16,
    paddingBottom: 60,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
  },
  rowInfo: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.ink.primary,
  },
  username: {
    fontSize: 12,
    color: COLORS.ink.muted,
  },
  ministryBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: COLORS.brand.soft,
    marginTop: 2,
  },
  ministryText: {
    fontSize: 11,
    color: COLORS.brand.primary,
    fontWeight: "600",
  },
});
