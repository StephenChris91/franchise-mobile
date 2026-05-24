/**
 * Post detail screen — full post + comment thread.
 * Route: /(app)/feed/[id]
 */
import { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Send } from "lucide-react-native";
import type { CommentResponse } from "@franchise/types";
import { PostCard } from "@/components/post/PostCard";
import { CommentItem } from "@/components/post/CommentItem";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { usePost, useComments } from "@/lib/hooks/usePosts";
import { queryKeys } from "@/lib/query/keys";
import { api } from "@/lib/api/client";
import { COLORS } from "@/lib/theme/colors";

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<CommentResponse | null>(null);
  const inputRef = useRef<TextInput>(null);

  const { data: post, isLoading: postLoading } = usePost(id);
  const {
    data: comments,
    isLoading: commentsLoading,
    refetch: refetchComments,
  } = useComments(id);

  const { mutate: submitComment, isPending } = useMutation({
    mutationFn: (content: string) =>
      api.posts.comments.create(id, content, replyTo?.id),
    onSuccess: () => {
      setText("");
      setReplyTo(null);
      qc.invalidateQueries({ queryKey: queryKeys.posts.comments(id) });
      // Bump comment count on post
      qc.invalidateQueries({ queryKey: queryKeys.posts.detail(id) });
    },
  });

  function handleReply(comment: CommentResponse) {
    setReplyTo(comment);
    inputRef.current?.focus();
  }

  function handleSend() {
    const trimmed = text.trim();
    if (!trimmed || isPending) return;
    submitComment(trimmed);
  }

  if (postLoading) {
    return (
      <View style={styles.loadingWrap}>
        <Skeleton style={{ height: 200, borderRadius: 16 }} />
      </View>
    );
  }

  if (!post) {
    return (
      <EmptyState
        title="Post not found"
        body="This post may have been deleted."
      />
    );
  }

  const topComments = comments?.filter((c) => !c.parentId) ?? [];
  const replies = (parentId: string) =>
    comments?.filter((c) => c.parentId === parentId) ?? [];

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: COLORS.bg.page }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      {/* ── Comment list ──────────────────────────────────────── */}
      <FlatList
        data={topComments}
        keyExtractor={(c) => c.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={{ gap: 16, marginBottom: 16 }}>
            <PostCard post={post} />
            {commentsLoading ? (
              <ActivityIndicator color={COLORS.brand.primary} />
            ) : topComments.length === 0 ? (
              <Text style={styles.noComments}>
                No comments yet. Be the first!
              </Text>
            ) : (
              <Text style={styles.commentCount}>
                {comments?.length ?? 0}{" "}
                {(comments?.length ?? 0) === 1 ? "comment" : "comments"}
              </Text>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <View style={{ gap: 4 }}>
            <CommentItem comment={item} onReply={handleReply} />
            {replies(item.id).map((reply) => (
              <CommentItem key={reply.id} comment={reply} isNested />
            ))}
          </View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 4 }} />}
      />

      {/* ── Reply indicator ───────────────────────────────────── */}
      {replyTo && (
        <View style={styles.replyBanner}>
          <Text style={styles.replyText} numberOfLines={1}>
            Replying to {replyTo.author.fullName}: "{replyTo.content}"
          </Text>
          <TouchableOpacity onPress={() => setReplyTo(null)} hitSlop={8}>
            <Text style={styles.replyClose}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Comment input ─────────────────────────────────────── */}
      <View style={styles.inputRow}>
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder="Write a comment…"
          placeholderTextColor={COLORS.ink.muted}
          value={text}
          onChangeText={setText}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!text.trim() || isPending}
          activeOpacity={0.8}
        >
          {isPending ? (
            <ActivityIndicator size="small" color={COLORS.bg.page} />
          ) : (
            <Send size={16} color={COLORS.bg.page} strokeWidth={2.5} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loadingWrap: {
    flex: 1,
    padding: 16,
    backgroundColor: COLORS.bg.page,
  },
  listContent: {
    padding: 16,
    paddingBottom: 16,
  },
  noComments: {
    textAlign: "center",
    color: COLORS.ink.muted,
    fontSize: 14,
    paddingVertical: 24,
  },
  commentCount: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.ink.secondary,
    paddingBottom: 4,
  },
  replyBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.bg.card,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border.subtle,
    gap: 8,
  },
  replyText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.ink.secondary,
  },
  replyClose: {
    fontSize: 14,
    color: COLORS.ink.muted,
    fontWeight: "700",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.bg.elevated,
    borderTopWidth: 1,
    borderTopColor: COLORS.border.subtle,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.bg.card,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: COLORS.ink.primary,
    fontSize: 14,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: COLORS.border.default,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.brand.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
});
