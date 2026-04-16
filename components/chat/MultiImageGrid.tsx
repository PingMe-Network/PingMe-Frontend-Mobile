import React, { useState } from "react";
import {
  View,
  Image,
  TouchableOpacity,
  Text,
  StyleSheet,
  Modal,
  Dimensions,
  FlatList,
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
// Bubble max width (matches the 75% constraint in [roomId].tsx)
const BUBBLE_MAX = SCREEN_WIDTH * 0.72;
const GAP = 3;
// Each cell in a 2-col layout
const HALF = (BUBBLE_MAX - GAP) / 2;

interface MultiImageGridProps {
  urls: string[];
  /** Called by parent long-press handler — propagated from TouchableOpacity wrapping the bubble */
  onLongPress?: () => void;
}

export default function MultiImageGrid({ urls, onLongPress }: MultiImageGridProps) {
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const count = urls.length;

  if (count === 0) return null;

  const renderContent = () => {
    // ── 1 image ──────────────────────────────────────────────────
    if (count === 1) {
      return (
        <TouchableOpacity
          onPress={() => setPreviewIndex(0)}
          onLongPress={onLongPress}
          delayLongPress={400}
          activeOpacity={0.9}
        >
          <Image
            source={{ uri: urls[0] }}
            style={styles.single}
            resizeMode="cover"
          />
        </TouchableOpacity>
      );
    }

    // ── 2 images ─────────────────────────────────────────────────
    if (count === 2) {
      return (
        <View style={styles.row}>
          {urls.map((uri, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => setPreviewIndex(i)}
              onLongPress={onLongPress}
              delayLongPress={400}
              activeOpacity={0.9}
              style={styles.halfCell}
            >
              <Image source={{ uri }} style={styles.halfImg} resizeMode="cover" />
            </TouchableOpacity>
          ))}
        </View>
      );
    }

    // ── 3 images: 1 large left + 2 small right ───────────────────
    if (count === 3) {
      return (
        <View style={styles.row}>
          {/* Left large */}
          <TouchableOpacity
            onPress={() => setPreviewIndex(0)}
            onLongPress={onLongPress}
            delayLongPress={400}
            activeOpacity={0.9}
            style={styles.largeCell}
          >
            <Image source={{ uri: urls[0] }} style={styles.largeImg} resizeMode="cover" />
          </TouchableOpacity>

          {/* Right column */}
          <View style={styles.smallCol}>
            {urls.slice(1).map((uri, i) => (
              <TouchableOpacity
                key={i + 1}
                onPress={() => setPreviewIndex(i + 1)}
                onLongPress={onLongPress}
                delayLongPress={400}
                activeOpacity={0.9}
                style={styles.smallCell}
              >
                <Image source={{ uri }} style={styles.smallImg} resizeMode="cover" />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      );
    }

    // ── 4+ images: 2×2 grid, badge on 4th if more ───────────────
    const display = urls.slice(0, 4);
    const extra = count > 4 ? count - 4 : 0;

    return (
      <View style={styles.grid}>
        {display.map((uri, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => setPreviewIndex(i)}
            onLongPress={onLongPress}
            delayLongPress={400}
            activeOpacity={0.9}
            style={styles.gridCell}
          >
            <Image source={{ uri }} style={styles.gridImg} resizeMode="cover" />
            {i === 3 && extra > 0 && (
              <View style={styles.extraOverlay}>
                <Text style={styles.extraText}>+{extra}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <>
      {renderContent()}
      <PreviewModal initialIndex={previewIndex} urls={urls} onClose={() => setPreviewIndex(null)} />
    </>
  );
}

function PreviewModal({ initialIndex, urls, onClose }: { initialIndex: number | null; urls: string[]; onClose: () => void }) {
  if (initialIndex === null) return null;
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <FlatList
          data={urls}
          keyExtractor={(_, index) => String(index)}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={initialIndex}
          getItemLayout={(_, index) => ({
            length: SCREEN_WIDTH,
            offset: SCREEN_WIDTH * index,
            index,
          })}
          renderItem={({ item }) => (
            <TouchableOpacity 
              activeOpacity={1} 
              style={{ width: SCREEN_WIDTH, alignItems: "center", justifyContent: "center" }}
              onPress={onClose}
            >
              <Image source={{ uri: item }} style={styles.previewImg} resizeMode="contain" />
            </TouchableOpacity>
          )}
        />
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // ── Single ──
  single: {
    width: BUBBLE_MAX,
    height: BUBBLE_MAX * 0.72,
    borderRadius: 14,
  },

  // ── Row ──
  row: {
    flexDirection: "row",
    gap: GAP,
    width: BUBBLE_MAX,
  },

  // ── 2-col half ──
  halfCell: {
    width: HALF,
    height: HALF * 0.85,
    borderRadius: 12,
    overflow: "hidden",
  },
  halfImg: {
    width: "100%",
    height: "100%",
  },

  // ── 3-col large ──
  largeCell: {
    width: HALF + GAP * 0.5,
    height: HALF + GAP * 0.5,
    borderRadius: 12,
    overflow: "hidden",
  },
  largeImg: {
    width: "100%",
    height: "100%",
  },

  // ── 3-col small column ──
  smallCol: {
    flex: 1,
    gap: GAP,
  },
  smallCell: {
    flex: 1,
    borderRadius: 10,
    overflow: "hidden",
    // Min height for small cells
    minHeight: (HALF + GAP * 0.5 - GAP) / 2,
  },
  smallImg: {
    width: "100%",
    height: "100%",
  },

  // ── 4+ grid ──
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GAP,
    width: BUBBLE_MAX,
  },
  gridCell: {
    width: HALF,
    height: HALF,
    borderRadius: 10,
    overflow: "hidden",
  },
  gridImg: {
    width: "100%",
    height: "100%",
  },
  extraOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.50)",
    alignItems: "center",
    justifyContent: "center",
  },
  extraText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },

  // ── Preview modal ──
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.92)",
    alignItems: "center",
    justifyContent: "center",
  },
  previewImg: {
    width: "100%",
    height: "82%",
  },
  closeBtn: {
    position: "absolute",
    top: 50,
    right: 20,
    padding: 8,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    marginTop: -2,
  },
});
