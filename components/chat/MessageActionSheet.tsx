import React from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
} from "react-native";
import type { MessageResponse } from "@/types/chat/message";

export type MessageAction =
  | "reply"
  | "edit"
  | "forward"
  | "deleteForMe"
  | "recall";

interface MessageActionSheetProps {
  visible: boolean;
  message: MessageResponse | null;
  isOwnMessage: boolean;
  onAction: (action: MessageAction) => void;
  onClose: () => void;
}

const ACTION_ITEMS: {
  key: MessageAction;
  label: string;
  color?: string;
  requiresOwn?: boolean;
  requiresOwnText?: boolean;
  requiresActive?: boolean;
}[] = [
  { key: "reply", label: "↩ Trả lời", requiresActive: true },
  { key: "edit", label: "✏️ Chỉnh sửa", requiresOwnText: true, requiresActive: true },
  { key: "forward", label: "➤ Chuyển tiếp", requiresActive: true },
  { key: "deleteForMe", label: "🗑 Xóa phía tôi", color: "#EF4444" },
  { key: "recall", label: "⊗ Thu hồi", color: "#F97316", requiresOwn: true, requiresActive: true },
];

export default function MessageActionSheet({
  visible,
  message,
  isOwnMessage,
  onAction,
  onClose,
}: MessageActionSheetProps) {
  if (!message) return null;

  const isActive = message.isActive;
  const isText = message.type === "TEXT";

  const visibleActions = ACTION_ITEMS.filter((item) => {
    if (item.requiresOwnText && !(isOwnMessage && isText)) return false;
    if (item.requiresOwn && !isOwnMessage) return false;
    if (item.requiresActive && !isActive) return false;
    return true;
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.sheet}>
              <View style={styles.handle} />
              {visibleActions.map((item, i) => (
                <TouchableOpacity
                  key={item.key}
                  style={[
                    styles.actionRow,
                    i < visibleActions.length - 1 && styles.actionBorder,
                  ]}
                  onPress={() => {
                    onClose();
                    onAction(item.key);
                  }}
                >
                  <Text
                    style={[
                      styles.actionText,
                      item.color ? { color: item.color } : null,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[styles.actionRow, styles.cancelRow]}
                onPress={onClose}
              >
                <Text style={[styles.actionText, styles.cancelText]}>Đóng</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
    paddingTop: 8,
    paddingHorizontal: 4,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D1D5DB",
    alignSelf: "center",
    marginBottom: 12,
  },
  actionRow: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  actionBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#F3F4F6",
  },
  cancelRow: {
    marginTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E5E7EB",
  },
  actionText: {
    fontSize: 16,
    color: "#111827",
    fontWeight: "500",
  },
  cancelText: {
    color: "#6B7280",
    textAlign: "center",
  },
});
