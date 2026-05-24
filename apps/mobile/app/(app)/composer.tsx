/**
 * Post composer — modal screen.
 * Route: /(app)/composer
 * Features: text, post type selector, group selector, image picker + Cloudinary upload
 */
import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router, useNavigation } from "expo-router";
import { useLayoutEffect } from "react";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { Image } from "expo-image";
import { X, ImagePlus } from "lucide-react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Toast from "react-native-toast-message";
import { api } from "@/lib/api/client";
import { queryKeys } from "@/lib/query/keys";
import { uploadToCloudinary } from "@/lib/upload/cloudinary";
import { COLORS } from "@/lib/theme/colors";

type PostType = "regular" | "prayer" | "announcement" | "testimony";

const POST_TYPES: { value: PostType; label: string; emoji: string }[] = [
  { value: "regular",      label: "Post",       emoji: "📝" },
  { value: "prayer",       label: "Prayer",     emoji: "🙏" },
  { value: "testimony",    label: "Testimony",  emoji: "🙌" },
  { value: "announcement", label: "Announce",   emoji: "📢" },
];

export default function ComposerScreen() {
  const navigation = useNavigation();
  const qc = useQueryClient();

  const [content, setContent] = useState("");
  const [postType, setPostType] = useState<PostType>("regular");
  const [groupId, setGroupId] = useState<string | undefined>(undefined);
  const [localImages, setLocalImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Fetch groups for the group selector
  const { data: groups } = useQuery({
    queryKey: queryKeys.groups.list(),
    queryFn: ({ signal }) => api.groups.list(signal),
    staleTime: 60_000,
  });

  const { mutate: createPost, isPending } = useMutation({
    mutationFn: async () => {
      // Upload images first
      let mediaUrls: string[] = [];
      if (localImages.length > 0) {
        setIsUploading(true);
        try {
          const results = await Promise.all(
            localImages.map((uri) => uploadToCloudinary(uri, "franchise/posts"))
          );
          mediaUrls = results.map((r) => r.url);
        } finally {
          setIsUploading(false);
        }
      }
      return api.posts.create({ content, postType, groupId, mediaUrls });
    },
    onSuccess: () => {
      // Invalidate feed + prayer wall
      qc.invalidateQueries({ queryKey: queryKeys.posts.list() });
      qc.invalidateQueries({ queryKey: queryKeys.prayerWall.list() });
      Toast.show({ type: "success", text1: "Post shared!" });
      router.back();
    },
    onError: (err) => {
      Alert.alert("Error", err instanceof Error ? err.message : "Failed to post");
    },
  });

  // Configure the header close + post buttons
  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={8}
          style={{ marginLeft: 4 }}
        >
          <X size={22} color={COLORS.ink.secondary} />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity
          onPress={() => createPost()}
          disabled={!content.trim() || isPending || isUploading}
          style={[
            styles.postBtn,
            (!content.trim() || isPending || isUploading) &&
              styles.postBtnDisabled,
          ]}
          activeOpacity={0.8}
        >
          {isPending || isUploading ? (
            <ActivityIndicator size="small" color={COLORS.bg.page} />
          ) : (
            <Text style={styles.postBtnText}>Post</Text>
          )}
        </TouchableOpacity>
      ),
    });
  }, [content, isPending, isUploading, navigation, createPost]);

  async function pickImages() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: 4 - localImages.length,
      quality: 0.8,
    });

    if (result.canceled) return;

    // Compress each selected image to max 1200px wide, 80% quality
    const compressed = await Promise.all(
      result.assets.map((asset) =>
        ImageManipulator.manipulateAsync(
          asset.uri,
          [{ resize: { width: 1200 } }],
          { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
        )
      )
    );

    setLocalImages((prev) => [
      ...prev,
      ...compressed.map((c) => c.uri),
    ].slice(0, 4));
  }

  function removeImage(uri: string) {
    setLocalImages((prev) => prev.filter((u) => u !== uri));
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: COLORS.bg.page }}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      {/* ── Post type pills ───────────────────────────────────── */}
      <View style={styles.typeRow}>
        {POST_TYPES.map((pt) => {
          const active = postType === pt.value;
          return (
            <TouchableOpacity
              key={pt.value}
              style={[styles.typePill, active && styles.typePillActive]}
              onPress={() => setPostType(pt.value)}
              activeOpacity={0.8}
            >
              <Text style={styles.typeEmoji}>{pt.emoji}</Text>
              <Text
                style={[styles.typeLabel, active && styles.typeLabelActive]}
              >
                {pt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Text input ────────────────────────────────────────── */}
      <TextInput
        style={styles.textInput}
        placeholder={
          postType === "prayer"
            ? "Share your prayer request…"
            : postType === "testimony"
            ? "What has God done for you?"
            : postType === "announcement"
            ? "Share an announcement…"
            : "What's on your heart?"
        }
        placeholderTextColor={COLORS.ink.muted}
        value={content}
        onChangeText={setContent}
        multiline
        maxLength={2000}
        autoFocus
      />

      {/* ── Character count ───────────────────────────────────── */}
      <Text style={styles.charCount}>{content.length} / 2000</Text>

      {/* ── Group selector ────────────────────────────────────── */}
      {groups && groups.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Post to group (optional)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TouchableOpacity
                style={[
                  styles.groupPill,
                  !groupId && styles.groupPillActive,
                ]}
                onPress={() => setGroupId(undefined)}
              >
                <Text
                  style={[
                    styles.groupPillText,
                    !groupId && styles.groupPillTextActive,
                  ]}
                >
                  General
                </Text>
              </TouchableOpacity>
              {groups.map((g) => (
                <TouchableOpacity
                  key={g.id}
                  style={[
                    styles.groupPill,
                    groupId === g.id && styles.groupPillActive,
                  ]}
                  onPress={() => setGroupId(g.id)}
                >
                  <Text
                    style={[
                      styles.groupPillText,
                      groupId === g.id && styles.groupPillTextActive,
                    ]}
                  >
                    {g.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      {/* ── Media preview ─────────────────────────────────────── */}
      {localImages.length > 0 && (
        <View style={styles.mediaGrid}>
          {localImages.map((uri) => (
            <View key={uri} style={styles.mediaThumb}>
              <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
              <TouchableOpacity
                style={styles.removeImg}
                onPress={() => removeImage(uri)}
              >
                <X size={12} color="#fff" strokeWidth={3} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* ── Image picker button ───────────────────────────────── */}
      {localImages.length < 4 && (
        <TouchableOpacity style={styles.addImageBtn} onPress={pickImages}>
          <ImagePlus size={18} color={COLORS.brand.primary} />
          <Text style={styles.addImageText}>Add photos</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 16,
    paddingBottom: 60,
  },
  typeRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  typePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: COLORS.bg.card,
    borderWidth: 1,
    borderColor: COLORS.border.subtle,
  },
  typePillActive: {
    backgroundColor: COLORS.brand.soft,
    borderColor: COLORS.border.default,
  },
  typeEmoji: {
    fontSize: 14,
  },
  typeLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: COLORS.ink.secondary,
  },
  typeLabelActive: {
    color: COLORS.brand.primary,
    fontWeight: "700",
  },
  textInput: {
    fontSize: 17,
    color: COLORS.ink.primary,
    lineHeight: 26,
    minHeight: 140,
    textAlignVertical: "top",
  },
  charCount: {
    fontSize: 12,
    color: COLORS.ink.muted,
    textAlign: "right",
  },
  section: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.ink.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  groupPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: COLORS.bg.card,
    borderWidth: 1,
    borderColor: COLORS.border.subtle,
  },
  groupPillActive: {
    backgroundColor: COLORS.brand.soft,
    borderColor: COLORS.border.default,
  },
  groupPillText: {
    fontSize: 13,
    color: COLORS.ink.secondary,
    fontWeight: "500",
  },
  groupPillTextActive: {
    color: COLORS.brand.primary,
    fontWeight: "700",
  },
  mediaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  mediaThumb: {
    width: 80,
    height: 80,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: COLORS.bg.card,
  },
  removeImg: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  addImageBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: COLORS.border.default,
    alignSelf: "flex-start",
  },
  addImageText: {
    fontSize: 14,
    color: COLORS.brand.primary,
    fontWeight: "600",
  },
  postBtn: {
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: COLORS.brand.primary,
    marginRight: 4,
  },
  postBtnDisabled: {
    opacity: 0.45,
  },
  postBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.bg.page,
  },
});
