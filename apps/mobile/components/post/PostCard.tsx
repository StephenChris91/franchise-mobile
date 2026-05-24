import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { formatDistanceToNow } from "date-fns";
import { Pin } from "lucide-react-native";
import type { PostResponse } from "@franchise/types";
import { Avatar } from "@/components/ui/Avatar";
import { PostMedia } from "./PostMedia";
import { ReactionBar } from "./ReactionBar";
import { COLORS } from "@/lib/theme/colors";

const POST_TYPE_LABELS: Record<PostResponse["postType"], string | null> = {
  regular:      null,
  prayer:       "Prayer Request",
  announcement: "Announcement",
  testimony:    "Testimony",
};

const POST_TYPE_COLORS: Record<PostResponse["postType"], string> = {
  regular:      COLORS.brand.primary,
  prayer:       "#6b8fd4",
  announcement: COLORS.status.warning,
  testimony:    COLORS.status.success,
};

interface PostCardProps {
  post: PostResponse;
  onPress?: () => void;
}

export function PostCard({ post, onPress }: PostCardProps) {
  const timeAgo = formatDistanceToNow(new Date(post.createdAt), {
    addSuffix: true,
  });
  const typeLabel = POST_TYPE_LABELS[post.postType];
  const typeColor = POST_TYPE_COLORS[post.postType];

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.9}
      disabled={!onPress}
    >
      {/* ── Header ───────────────────────────────────────────────── */}
      <View style={styles.header}>
        <Avatar
          uri={post.author.photoUrl}
          name={post.author.fullName}
          size={40}
        />

        <View style={styles.headerText}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{post.author.fullName}</Text>
            {post.isPinned && (
              <Pin size={12} color={COLORS.brand.primary} />
            )}
          </View>

          <View style={styles.metaRow}>
            {typeLabel && (
              <>
                <View
                  style={[styles.typeBadge, { backgroundColor: typeColor + "22" }]}
                >
                  <Text style={[styles.typeText, { color: typeColor }]}>
                    {typeLabel}
                  </Text>
                </View>
                <Text style={styles.dot}>·</Text>
              </>
            )}
            {post.group && (
              <>
                <Text style={styles.group}>{post.group.name}</Text>
                <Text style={styles.dot}>·</Text>
              </>
            )}
            <Text style={styles.time}>{timeAgo}</Text>
          </View>
        </View>
      </View>

      {/* ── Content ──────────────────────────────────────────────── */}
      <Text style={styles.content} numberOfLines={onPress ? 5 : undefined}>
        {post.content}
      </Text>

      {/* ── Media ────────────────────────────────────────────────── */}
      {post.mediaUrls.length > 0 && (
        <PostMedia urls={post.mediaUrls} />
      )}

      {/* ── Reactions ────────────────────────────────────────────── */}
      <ReactionBar post={post} onCommentPress={onPress} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.bg.card,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.border.subtle,
  },
  header: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  headerText: {
    flex: 1,
    gap: 3,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  name: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.ink.primary,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 4,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  typeText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  group: {
    fontSize: 12,
    color: COLORS.brand.primary,
    fontWeight: "600",
  },
  dot: {
    fontSize: 12,
    color: COLORS.ink.muted,
  },
  time: {
    fontSize: 12,
    color: COLORS.ink.muted,
  },
  content: {
    fontSize: 15,
    color: COLORS.ink.secondary,
    lineHeight: 23,
  },
});
