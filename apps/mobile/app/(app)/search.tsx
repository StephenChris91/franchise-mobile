import { useState, useLayoutEffect } from "react";
import {
  View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Image,
} from "react-native";
import { useRouter, useNavigation } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Search, Calendar, Users, Layers, FileText, X } from "lucide-react-native";
import { COLORS } from "@/lib/theme/colors";
import { api } from "@/lib/api/client";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import type { SearchResultItem } from "@franchise/types";

const TYPE_FILTERS = [
  { key: "all", label: "All" },
  { key: "posts", label: "Posts" },
  { key: "events", label: "Events" },
  { key: "groups", label: "Groups" },
  { key: "members", label: "Members" },
] as const;

type FilterKey = typeof TYPE_FILTERS[number]["key"];

const RESULT_ICONS: Record<SearchResultItem["type"], typeof Search> = {
  post: FileText,
  event: Calendar,
  group: Layers,
  member: Users,
};

function ResultRow({ item, onPress }: { item: SearchResultItem; onPress: () => void }) {
  const Icon = RESULT_ICONS[item.type] ?? Search;
  return (
    <TouchableOpacity style={styles.resultRow} onPress={onPress} activeOpacity={0.7}>
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.resultImage} />
      ) : (
        <View style={styles.resultIconWrap}>
          <Icon size={18} color={COLORS.brand.primary} />
        </View>
      )}
      <View style={styles.resultBody}>
        <Text style={styles.resultTitle} numberOfLines={1}>{item.title}</Text>
        {item.subtitle ? (
          <Text style={styles.resultSubtitle} numberOfLines={1}>{item.subtitle}</Text>
        ) : null}
      </View>
      <View style={styles.resultBadge}>
        <Text style={styles.resultBadgeText}>{item.type}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function SearchScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");

  const debouncedQuery = useDebouncedValue(query, 350);

  useLayoutEffect(() => {
    navigation.setOptions({ title: "Search" });
  }, [navigation]);

  const { data, isLoading } = useQuery({
    queryKey: ["search", debouncedQuery, filter],
    queryFn: ({ signal }) => api.search.query(debouncedQuery, filter, signal),
    enabled: debouncedQuery.length >= 2,
    staleTime: 30_000,
  });

  function handleResultPress(item: SearchResultItem) {
    switch (item.type) {
      case "post":
        router.push(`/(app)/feed/${item.id}`);
        break;
      case "event":
        if (item.slug) router.push(`/(app)/events/${item.slug}`);
        break;
      case "group":
        if (item.slug) router.push(`/(app)/groups/${item.slug}`);
        break;
      case "member":
        if (item.slug) router.push(`/(app)/profile/${item.slug}`);
        break;
    }
  }

  const results = data?.results ?? [];

  return (
    <View style={styles.root}>
      {/* Search bar */}
      <View style={styles.searchWrap}>
        <Search size={18} color={COLORS.ink.muted} />
        <TextInput
          style={styles.input}
          placeholder="Search posts, events, groups, people…"
          placeholderTextColor={COLORS.ink.muted}
          value={query}
          onChangeText={setQuery}
          autoFocus
          returnKeyType="search"
          clearButtonMode="never"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery("")}>
            <X size={16} color={COLORS.ink.muted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter pills */}
      <View style={styles.filterRow}>
        {TYPE_FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterPill, filter === f.key && styles.filterPillActive]}
            onPress={() => setFilter(f.key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Results */}
      {debouncedQuery.length >= 2 ? (
        isLoading ? (
          <ActivityIndicator
            color={COLORS.brand.primary}
            style={{ marginTop: 48 }}
          />
        ) : (
          <FlatList
            data={results}
            keyExtractor={(r) => `${r.type}-${r.id}`}
            contentContainerStyle={styles.listPad}
            renderItem={({ item }) => (
              <ResultRow item={item} onPress={() => handleResultPress(item)} />
            )}
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyText}>No results for "{debouncedQuery}"</Text>
              </View>
            }
          />
        )
      ) : (
        <View style={styles.hintWrap}>
          <Search size={48} color={COLORS.border.default} />
          <Text style={styles.hintText}>Type at least 2 characters to search</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg.page },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    margin: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: COLORS.bg.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border.subtle,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.ink.primary,
    paddingVertical: 0,
  },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
    flexWrap: "wrap",
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: COLORS.bg.card,
    borderWidth: 1,
    borderColor: COLORS.border.subtle,
  },
  filterPillActive: { backgroundColor: COLORS.brand.primary, borderColor: COLORS.brand.primary },
  filterText: { fontSize: 12, fontWeight: "500", color: COLORS.ink.secondary },
  filterTextActive: { color: COLORS.bg.page },
  listPad: { paddingHorizontal: 16, paddingBottom: 40 },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border.subtle,
  },
  resultImage: { width: 44, height: 44, borderRadius: 22 },
  resultIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(212,166,74,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  resultBody: { flex: 1 },
  resultTitle: { fontSize: 14, fontWeight: "600", color: COLORS.ink.primary },
  resultSubtitle: { fontSize: 12, color: COLORS.ink.muted, marginTop: 2 },
  resultBadge: {
    backgroundColor: COLORS.bg.elevated,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  resultBadgeText: {
    fontSize: 10,
    color: COLORS.ink.muted,
    textTransform: "capitalize",
  },
  emptyWrap: { alignItems: "center", paddingTop: 40 },
  emptyText: { color: COLORS.ink.secondary, fontSize: 14 },
  hintWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  hintText: { color: COLORS.ink.muted, fontSize: 14 },
});
