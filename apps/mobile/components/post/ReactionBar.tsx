/**
 * Reaction bar with optimistic UI + haptics.
 * Reactions: like 👍  amen 🙌  praying 🙏  heart ❤️
 */
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import { MessageCircle } from "lucide-react-native";
import type { PostResponse } from "@franchise/types";
import { useReact } from "@/lib/hooks/useReact";
import { COLORS } from "@/lib/theme/colors";

type ReactionType = "like" | "amen" | "praying" | "heart";

const REACTIONS: { type: ReactionType; emoji: string; label: string }[] = [
  { type: "like",   emoji: "👍", label: "Like"  },
  { type: "amen",   emoji: "🙌", label: "Amen"  },
  { type: "praying",emoji: "🙏", label: "Pray"  },
  { type: "heart",  emoji: "❤️", label: "Love"  },
];

interface ReactionBarProps {
  post: PostResponse;
  onCommentPress?: () => void;
}

export function ReactionBar({ post, onCommentPress }: ReactionBarProps) {
  const { mutate: react } = useReact(post.id);

  async function handleReact(type: ReactionType) {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    react(type);
  }

  return (
    <View style={styles.bar}>
      {/* Reaction buttons */}
      <View style={styles.reactions}>
        {REACTIONS.map(({ type, emoji, label }) => {
          const active = post.userReactions.includes(type);
          const count = post.reactionCounts[type] ?? 0;
          return (
            <TouchableOpacity
              key={type}
              style={[styles.pill, active && styles.pillActive]}
              onPress={() => handleReact(type)}
              activeOpacity={0.75}
              hitSlop={4}
            >
              <Text style={styles.emoji}>{emoji}</Text>
              {count > 0 && (
                <Text
                  style={[styles.count, active && { color: COLORS.brand.primary }]}
                >
                  {count}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Comment count */}
      <TouchableOpacity
        style={styles.commentBtn}
        onPress={onCommentPress}
        activeOpacity={0.75}
        hitSlop={4}
      >
        <MessageCircle size={16} color={COLORS.ink.muted} />
        {post.commentCount > 0 && (
          <Text style={styles.commentCount}>{post.commentCount}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border.subtle,
  },
  reactions: {
    flexDirection: "row",
    gap: 6,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: COLORS.bg.card,
    borderWidth: 1,
    borderColor: COLORS.border.subtle,
  },
  pillActive: {
    backgroundColor: COLORS.brand.soft,
    borderColor: COLORS.border.default,
  },
  emoji: {
    fontSize: 14,
  },
  count: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.ink.secondary,
  },
  commentBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  commentCount: {
    fontSize: 13,
    color: COLORS.ink.muted,
  },
});
