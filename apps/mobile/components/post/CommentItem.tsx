import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { formatDistanceToNow } from "date-fns";
import type { CommentResponse } from "@franchise/types";
import { Avatar } from "@/components/ui/Avatar";
import { COLORS } from "@/lib/theme/colors";

interface CommentItemProps {
  comment: CommentResponse;
  onReply?: (comment: CommentResponse) => void;
  isNested?: boolean;
}

export function CommentItem({ comment, onReply, isNested }: CommentItemProps) {
  const timeAgo = formatDistanceToNow(new Date(comment.createdAt), {
    addSuffix: true,
  });

  return (
    <View style={[styles.container, isNested && styles.nested]}>
      {/* Left strip for nested comments */}
      {isNested && <View style={styles.nestLine} />}

      <Avatar
        uri={comment.author.photoUrl}
        name={comment.author.fullName}
        size={32}
      />

      <View style={styles.body}>
        <View style={styles.bubble}>
          <Text style={styles.name}>{comment.author.fullName}</Text>
          <Text style={styles.content}>{comment.content}</Text>
        </View>

        <View style={styles.meta}>
          <Text style={styles.time}>{timeAgo}</Text>
          {onReply && (
            <TouchableOpacity onPress={() => onReply(comment)} hitSlop={8}>
              <Text style={styles.replyBtn}>Reply</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 10,
    paddingVertical: 8,
  },
  nested: {
    paddingLeft: 40,
  },
  nestLine: {
    position: "absolute",
    left: 52,
    top: 0,
    bottom: 0,
    width: 1.5,
    backgroundColor: COLORS.border.subtle,
  },
  body: {
    flex: 1,
    gap: 4,
  },
  bubble: {
    backgroundColor: COLORS.bg.card,
    borderRadius: 12,
    borderTopLeftRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 2,
  },
  name: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.ink.primary,
  },
  content: {
    fontSize: 14,
    color: COLORS.ink.secondary,
    lineHeight: 20,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingLeft: 4,
  },
  time: {
    fontSize: 11,
    color: COLORS.ink.muted,
  },
  replyBtn: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.brand.primary,
  },
});
