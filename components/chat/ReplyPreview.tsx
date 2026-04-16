import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import type { MessageResponse } from "@/types/chat/message";

interface ReplyPreviewProps {
  target: MessageResponse;
  senderName: string;
  onCancel: () => void;
}

function getReplyPreviewText(msg: MessageResponse): string {
  if (!msg.isActive) return "Tin nhắn đã thu hồi";
  switch (msg.type) {
    case "IMAGE": return "🖼 Hình ảnh";
    case "VIDEO": return "🎥 Video";
    case "FILE": return `📎 Tệp${msg.fileFormat ? `.${msg.fileFormat}` : ""}`;
    case "WEATHER": return "🌤 Thời tiết";
    default: return msg.content ?? "";
  }
}

export default function ReplyPreview({ target, senderName, onCancel }: ReplyPreviewProps) {
  return (
    <View style={styles.container}>
      <View style={styles.bar} />
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>{senderName}</Text>
        <Text style={styles.preview} numberOfLines={1}>
          {getReplyPreviewText(target)}
        </Text>
      </View>
      <TouchableOpacity onPress={onCancel} style={styles.cancel}>
        <Text style={styles.cancelText}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FDF2FA",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#F3E8FF",
  },
  bar: {
    width: 3,
    borderRadius: 2,
    backgroundColor: "#DF40A3",
    alignSelf: "stretch",
    marginRight: 10,
  },
  content: { flex: 1 },
  name: { fontSize: 12, fontWeight: "700", color: "#DF40A3", marginBottom: 2 },
  preview: { fontSize: 13, color: "#4B5563" },
  cancel: { padding: 6 },
  cancelText: { fontSize: 16, color: "#9CA3AF" },
});
