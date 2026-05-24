/**
 * Image grid for post media.
 * Layouts:
 *   1 image → full-width square
 *   2 images → side-by-side
 *   3 images → one large left + two stacked right
 *   4+ images → 2×2 grid (shows "+N" overlay on the 4th if N > 4)
 */
import { View, TouchableOpacity, StyleSheet, Dimensions } from "react-native";
import { Text } from "react-native";
import { Image } from "expo-image";
import { COLORS } from "@/lib/theme/colors";

const { width: SCREEN_W } = Dimensions.get("window");
const GAP = 2;

interface PostMediaProps {
  urls: string[];
  onPress?: (index: number) => void;
}

function Img({
  uri,
  style,
  overlay,
  onPress,
}: {
  uri: string;
  style?: object;
  overlay?: React.ReactNode;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={[styles.imgWrapper, style]}
      disabled={!onPress}
    >
      <Image
        source={{ uri }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={200}
      />
      {overlay}
    </TouchableOpacity>
  );
}

export function PostMedia({ urls, onPress }: PostMediaProps) {
  if (!urls.length) return null;

  const cardW = SCREEN_W - 32; // assuming 16px horizontal padding

  if (urls.length === 1) {
    return (
      <Img
        uri={urls[0]}
        style={{ height: 240, borderRadius: 12 }}
        onPress={() => onPress?.(0)}
      />
    );
  }

  if (urls.length === 2) {
    const w = (cardW - GAP) / 2;
    return (
      <View style={[styles.row, { height: 180 }]}>
        <Img
          uri={urls[0]}
          style={{ width: w, borderTopLeftRadius: 12, borderBottomLeftRadius: 12 }}
          onPress={() => onPress?.(0)}
        />
        <Img
          uri={urls[1]}
          style={{ width: w, borderTopRightRadius: 12, borderBottomRightRadius: 12 }}
          onPress={() => onPress?.(1)}
        />
      </View>
    );
  }

  if (urls.length === 3) {
    const leftW = (cardW - GAP) * 0.55;
    const rightW = cardW - leftW - GAP;
    const rightH = (200 - GAP) / 2;
    return (
      <View style={[styles.row, { height: 200 }]}>
        <Img
          uri={urls[0]}
          style={{ width: leftW, borderTopLeftRadius: 12, borderBottomLeftRadius: 12 }}
          onPress={() => onPress?.(0)}
        />
        <View style={{ width: rightW, gap: GAP }}>
          <Img
            uri={urls[1]}
            style={{ height: rightH, borderTopRightRadius: 12 }}
            onPress={() => onPress?.(1)}
          />
          <Img
            uri={urls[2]}
            style={{ height: rightH, borderBottomRightRadius: 12 }}
            onPress={() => onPress?.(2)}
          />
        </View>
      </View>
    );
  }

  // 4+ images — show 2×2, overlay "+N" on cell 4 if extras
  const extras = urls.length - 4;
  const cellW = (cardW - GAP) / 2;
  const cellH = (180 - GAP) / 2;

  return (
    <View style={{ gap: GAP, borderRadius: 12, overflow: "hidden" }}>
      <View style={[styles.row, { height: cellH }]}>
        <Img uri={urls[0]} style={{ width: cellW }} onPress={() => onPress?.(0)} />
        <Img uri={urls[1]} style={{ width: cellW }} onPress={() => onPress?.(1)} />
      </View>
      <View style={[styles.row, { height: cellH }]}>
        <Img uri={urls[2]} style={{ width: cellW }} onPress={() => onPress?.(2)} />
        <Img
          uri={urls[3]}
          style={{ width: cellW }}
          onPress={() => onPress?.(3)}
          overlay={
            extras > 0 ? (
              <View style={styles.overlay}>
                <Text style={styles.overlayText}>+{extras}</Text>
              </View>
            ) : undefined
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: GAP,
  },
  imgWrapper: {
    flex: 1,
    overflow: "hidden",
    backgroundColor: COLORS.bg.card,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(10,8,7,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  overlayText: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.ink.primary,
  },
});
