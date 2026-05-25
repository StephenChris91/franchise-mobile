import { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { ChevronDown, RefreshCw, Share2 } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Constants from "expo-constants";
import { COLORS } from "@/lib/theme/colors";
import { api } from "@/lib/api/client";
import { queryKeys } from "@/lib/query/keys";
import { Skeleton } from "@/components/ui/Skeleton";
import type { LiveChatMessageResponse } from "@franchise/types";

// Pusher lazy require (Expo Go guard)
function getPusher() {
  if (Constants.appOwnership === "expo") return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Pusher } = require("@pusher/pusher-websocket-react-native");
    return Pusher;
  } catch {
    return null;
  }
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const VIDEO_HEIGHT = Math.round(SCREEN_WIDTH * (9 / 16));

const REACTIONS = [
  { emoji: "🙌", type: "amen", label: "Amen" },
  { emoji: "🙏", type: "praying", label: "Praying" },
  { emoji: "❤️", type: "love", label: "Love" },
  { emoji: "🔥", type: "fire", label: "Fire" },
  { emoji: "📖", type: "receiving", label: "Receiving" },
];

const TABS = ["Chat", "Notes"] as const;
type Tab = (typeof TABS)[number];

// ── Avatar with warm gradient fallback ────────────────────────────────────

function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: COLORS.brand.deep,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ color: COLORS.ink.primary, fontSize: size * 0.35, fontWeight: "700" }}>
        {initials}
      </Text>
    </View>
  );
}

// ── Chat message ──────────────────────────────────────────────────────────

function ChatMessage({ msg }: { msg: LiveChatMessageResponse }) {
  const isReaction = msg.reactionType != null;
  const isPastor = msg.author.role === "pastor";
  const reactionEmoji = REACTIONS.find((r) => r.type === msg.reactionType)?.emoji;

  return (
    <View style={[styles.msgRow, msg.isPinned && styles.msgPinned]}>
      <Avatar name={msg.author.fullName} size={28} />
      <View style={{ flex: 1 }}>
        <View style={styles.msgMeta}>
          <Text style={styles.msgAuthor}>{msg.author.username}</Text>
          {isPastor && (
            <View style={styles.pastorBadge}>
              <Text style={styles.pastorBadgeText}>Pastor</Text>
            </View>
          )}
        </View>
        {isReaction ? (
          <Text style={styles.reactionText}>{reactionEmoji} {msg.content}</Text>
        ) : (
          <Text style={[styles.msgContent, msg.content.toLowerCase().includes("amen") && styles.msgAmen]}>
            {msg.content}
          </Text>
        )}
      </View>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────

export default function LivePlayerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const listRef = useRef<FlatList>(null);
  const [activeTab, setActiveTab] = useState<Tab>("Chat");
  const [chatInput, setChatInput] = useState("");
  const [localMessages, setLocalMessages] = useState<LiveChatMessageResponse[]>([]);
  const [notes, setNotes] = useState("");

  const { data: ls, isLoading } = useQuery({
    queryKey: queryKeys.live.detail(id),
    queryFn: ({ signal }) => api.live.get(id, signal),
    staleTime: 30_000,
  });

  const { data: chatData } = useInfiniteQuery({
    queryKey: queryKeys.live.chat(id),
    queryFn: ({ pageParam, signal }) =>
      api.live.chat.list(id, { cursor: pageParam, limit: 50 }, signal),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    staleTime: 0,
  });

  const allMessages: LiveChatMessageResponse[] = [
    ...(chatData?.pages.flatMap((p) => p.data) ?? []),
    ...localMessages,
  ];

  // Pusher real-time subscription
  useEffect(() => {
    if (!id) return;
    const PusherClient = getPusher();
    if (!PusherClient) return;

    let channel: { unbind_all?: () => void; unsubscribe?: () => void } | null = null;

    (async () => {
      try {
        const pusher = PusherClient.getInstance();
        channel = await pusher.subscribe({ channelName: `livestream-${id}` });
        if (channel && typeof channel === "object" && "bind" in channel) {
          (channel as { bind: (event: string, cb: (data: unknown) => void) => void }).bind("new-message", (data: unknown) => {
            setLocalMessages((prev) => [...prev, data as LiveChatMessageResponse]);
          });
        }
      } catch {}
    })();

    return () => {
      try { channel?.unbind_all?.(); channel?.unsubscribe?.(); } catch {}
    };
  }, [id]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (allMessages.length > 0 && activeTab === "Chat") {
      listRef.current?.scrollToEnd({ animated: true });
    }
  }, [allMessages.length, activeTab]);

  const sendMutation = useMutation({
    mutationFn: ({ content, reactionType }: { content: string; reactionType?: string }) =>
      api.live.chat.send(id, content, reactionType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.live.chat(id) });
    },
  });

  const handleSend = useCallback(() => {
    const text = chatInput.trim();
    if (!text) return;
    setChatInput("");
    sendMutation.mutate({ content: text });
  }, [chatInput, sendMutation]);

  const handleReaction = useCallback(
    (type: string, label: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      sendMutation.mutate({ content: label, reactionType: type });
    },
    [sendMutation]
  );

  if (isLoading || !ls) {
    return (
      <View style={styles.root}>
        <Skeleton height={VIDEO_HEIGHT} style={{ borderRadius: 0 }} />
        <View style={{ padding: 16, gap: 12 }}>
          <Skeleton height={24} />
          <Skeleton width="60%" height={16} />
        </View>
      </View>
    );
  }

  // YouTube player — lazy required so it doesn't crash in Expo Go
  let YoutubeIframe: React.ComponentType<{
    videoId: string;
    height: number;
    play: boolean;
    onError?: (e: unknown) => void;
  }> | null = null;

  if (Constants.appOwnership !== "expo") {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      YoutubeIframe = require("react-native-youtube-iframe").default;
    } catch {}
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={0}
    >
      {/* Nav bar */}
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.navBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <ChevronDown size={22} color={COLORS.ink.primary} />
        </TouchableOpacity>
        <View style={styles.navCenter}>
          <Text style={styles.navTitle} numberOfLines={1}>{ls.name}</Text>
          {ls.status === "live" && (
            <View style={styles.navLiveBadge}>
              <Text style={styles.navLiveBadgeText}>LIVE</Text>
            </View>
          )}
        </View>
        <TouchableOpacity style={styles.navBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Share2 size={18} color={COLORS.ink.secondary} />
        </TouchableOpacity>
      </View>

      {/* Video player */}
      <View style={[styles.videoContainer, { height: VIDEO_HEIGHT }]}>
        {ls.youtubeVideoId && YoutubeIframe ? (
          <YoutubeIframe
            videoId={ls.youtubeVideoId}
            height={VIDEO_HEIGHT}
            play
          />
        ) : (
          <View style={styles.videoPlaceholder}>
            <Text style={styles.videoPlaceholderEmoji}>📡</Text>
            <Text style={styles.videoPlaceholderText}>
              {ls.status === "live"
                ? "Stream will begin shortly"
                : ls.replayUrl
                ? "Watch the replay below"
                : "Service is not currently live"}
            </Text>
            {ls.replayUrl && (
              <TouchableOpacity style={styles.replayBtn}>
                <Text style={styles.replayBtnText}>Watch Replay</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Stream meta */}
      <View style={styles.meta}>
        <Text style={styles.metaServiceName} numberOfLines={1}>{ls.name}</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab content */}
      {activeTab === "Chat" ? (
        <>
          <FlatList
            ref={listRef}
            data={allMessages}
            keyExtractor={(m) => m.id}
            renderItem={({ item }) => <ChatMessage msg={item} />}
            contentContainerStyle={styles.chatList}
            ListEmptyComponent={
              <View style={styles.chatEmpty}>
                <Text style={styles.chatEmptyText}>Be the first to respond 🙌</Text>
              </View>
            }
            onLayout={() => listRef.current?.scrollToEnd({ animated: false })}
          />

          {/* Quick reactions */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.reactionsScroll}
            contentContainerStyle={styles.reactionsContent}
          >
            {REACTIONS.map((r) => (
              <TouchableOpacity
                key={r.type}
                style={styles.reactionPill}
                onPress={() => handleReaction(r.type, r.label)}
                activeOpacity={0.7}
              >
                <Text style={styles.reactionPillEmoji}>{r.emoji}</Text>
                <Text style={styles.reactionPillLabel}>{r.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Chat input */}
          <View style={styles.inputBar}>
            <TextInput
              style={styles.input}
              value={chatInput}
              onChangeText={setChatInput}
              placeholder="Say amen…"
              placeholderTextColor={COLORS.ink.muted}
              maxLength={300}
              returnKeyType="send"
              onSubmitEditing={handleSend}
            />
            <TouchableOpacity
              style={[styles.sendBtn, !chatInput.trim() && styles.sendBtnDisabled]}
              onPress={handleSend}
              disabled={!chatInput.trim() || sendMutation.isPending}
            >
              <Text style={styles.sendBtnText}>Send</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <TextInput
          style={styles.notesInput}
          multiline
          value={notes}
          onChangeText={setNotes}
          placeholder="Type your notes here…"
          placeholderTextColor={COLORS.ink.muted}
          textAlignVertical="top"
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg.page },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingTop: 48,
    paddingBottom: 12,
    gap: 8,
  },
  navBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  navCenter: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  navTitle: { fontSize: 15, fontWeight: "700", color: COLORS.ink.primary, flex: 1 },
  navLiveBadge: {
    backgroundColor: COLORS.status.live,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  navLiveBadgeText: { color: "#fff", fontSize: 10, fontWeight: "700", letterSpacing: 0.6 },
  videoContainer: { width: "100%", backgroundColor: "#000" },
  videoPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 24,
  },
  videoPlaceholderEmoji: { fontSize: 36 },
  videoPlaceholderText: { color: COLORS.ink.secondary, fontSize: 14, textAlign: "center" },
  replayBtn: {
    marginTop: 8,
    backgroundColor: COLORS.brand.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 100,
  },
  replayBtnText: { color: COLORS.ink.inverse, fontWeight: "700", fontSize: 13 },
  meta: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.border.subtle },
  metaServiceName: { fontSize: 15, fontWeight: "700", color: COLORS.ink.primary },
  tabRow: {
    flexDirection: "row",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border.subtle,
  },
  tab: { flex: 1, alignItems: "center", paddingVertical: 10 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: COLORS.brand.primary },
  tabText: { fontSize: 13, fontWeight: "600", color: COLORS.ink.muted },
  tabTextActive: { color: COLORS.brand.primary },
  chatList: { paddingHorizontal: 12, paddingVertical: 8, gap: 8, flexGrow: 1 },
  chatEmpty: { padding: 24, alignItems: "center" },
  chatEmptyText: { color: COLORS.ink.muted, fontSize: 13 },
  msgRow: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  msgPinned: {
    borderLeftWidth: 2,
    borderLeftColor: COLORS.brand.primary,
    paddingLeft: 8,
    backgroundColor: COLORS.brand.soft,
    borderRadius: 8,
    padding: 8,
  },
  msgMeta: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 },
  msgAuthor: { fontSize: 12, fontWeight: "700", color: COLORS.ink.secondary },
  pastorBadge: {
    backgroundColor: COLORS.brand.soft,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border.default,
  },
  pastorBadgeText: { fontSize: 9, fontWeight: "700", color: COLORS.brand.primary, textTransform: "uppercase", letterSpacing: 0.06 },
  msgContent: { fontSize: 14, color: COLORS.ink.primary, lineHeight: 20 },
  msgAmen: { color: COLORS.brand.primary, fontWeight: "700" },
  reactionText: { fontSize: 14, color: COLORS.ink.secondary },
  reactionsScroll: { maxHeight: 48, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: COLORS.border.subtle },
  reactionsContent: { paddingHorizontal: 12, paddingVertical: 8, gap: 8, flexDirection: "row" },
  reactionPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    backgroundColor: COLORS.bg.card,
    borderWidth: 1,
    borderColor: COLORS.border.subtle,
  },
  reactionPillEmoji: { fontSize: 14 },
  reactionPillLabel: { fontSize: 12, color: COLORS.ink.secondary, fontWeight: "500" },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border.subtle,
    backgroundColor: COLORS.bg.elevated,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.bg.card,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.ink.primary,
    borderWidth: 1,
    borderColor: COLORS.border.subtle,
  },
  sendBtn: {
    backgroundColor: COLORS.brand.primary,
    borderRadius: 100,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnText: { color: COLORS.ink.inverse, fontWeight: "700", fontSize: 13 },
  notesInput: {
    flex: 1,
    padding: 16,
    fontSize: 15,
    color: COLORS.ink.primary,
    lineHeight: 24,
  },
});
