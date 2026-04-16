import React from "react";
import { View, Text, StyleSheet } from "react-native";
import type { RepliedMessageSnapshot } from "@/types/chat/message";

interface RepliedMessageBubbleProps {
  replied: RepliedMessageSnapshot;
  senderName: string;
  isMine: boolean;
}

function getPreviewText(msg: RepliedMessageSnapshot): string {
  if (!msg.isActive) return "Tin nhắn đã thu hồi";
  switch (msg.type) {
    case "IMAGE": return "🖼 Hình ảnh";
    case "VIDEO": return "🎥 Video";
    case "FILE": return `📎 Tệp${msg.fileFormat ? `.${msg.fileFormat}` : ""}`;
    case "WEATHER": return "🌤 Thời tiết";
    default: return msg.content ?? "";
  }
}

export default function RepliedMessageBubble({
  replied,
  senderName,
  isMine,
}: RepliedMessageBubbleProps) {
  return (
    <View style={[styles.container, isMine ? styles.mine : styles.theirs]}>
      <View style={[styles.bar, isMine ? styles.barMine : styles.barTheirs]} />
      <View style={styles.content}>
        <Text
          style={[styles.name, isMine ? styles.nameMine : styles.nameTheirs]}
          numberOfLines={1}
        >
          {senderName}
        </Text>
        <Text style={[styles.preview, isMine ? styles.previewMine : null]} numberOfLines={3}>
          {getPreviewText(replied)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderRadius: 10,
    marginBottom: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    // Remove maxWidth constraint — parent bubble already constrains width
    alignSelf: "stretch",
  },
  mine: { backgroundColor: "rgba(255,255,255,0.22)" },
  theirs: { backgroundColor: "rgba(0,0,0,0.08)" },
  bar: {
    width: 3,
    minHeight: 24,
    borderRadius: 2,
    marginRight: 10,
    alignSelf: "stretch",
  },
  barMine: { backgroundColor: "rgba(255,255,255,0.75)" },
  barTheirs: { backgroundColor: "#DF40A3" },
  content: {
    flex: 1,
    // Ensure it doesn't collapse
    minWidth: 0,
  },
  name: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 2,
  },
  nameMine: { color: "rgba(255,255,255,0.95)" },
  nameTheirs: { color: "#DF40A3" },
  preview: {
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 18,
  },
  previewMine: {
    color: "rgba(255,255,255,0.75)",
  },
});
