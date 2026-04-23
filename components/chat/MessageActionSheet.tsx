import React from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
} from "react-native";
import {
  Reply,
  PencilLine,
  Forward,
  Pin,
  PinOff,
  Trash2,
  Undo2,
  X,
  type LucideIcon,
} from "lucide-react-native";
import type { MessageResponse } from "@/types/chat/message";

export type MessageAction =
  | "reply"
  | "edit"
  | "forward"
  | "deleteForMe"
  | "recall"
  | "pin"
  | "unpin";

interface MessageActionSheetProps {
  visible: boolean;
  message: MessageResponse | null;
  isOwnMessage: boolean;
  isGroupRoom?: boolean;
  onAction: (action: MessageAction) => void;
  onClose: () => void;
}

const ACTION_ITEMS: {
  key: MessageAction;
  label: string;
  color?: string;
  icon: LucideIcon;
  iconColor?: string;
  requiresOwn?: boolean;
  requiresOwnText?: boolean;
  requiresActive?: boolean;
  requiresGroupRoom?: boolean;
  hideForPoll?: boolean;
  dynamic?: (message: MessageResponse) => {
    label: string;
    icon: LucideIcon;
  };
}[] = [
  {
    key: "reply",
    label: "Trả lời",
    icon: Reply,
    iconColor: "#7C3AED",
    requiresActive: true,
  },
  {
    key: "edit",
    label: "Chỉnh sửa",
    icon: PencilLine,
    iconColor: "#0284C7",
    requiresOwnText: true,
    requiresActive: true,
  },
  {
    key: "forward",
    label: "Chuyển tiếp",
    icon: Forward,
    iconColor: "#0891B2",
    requiresActive: true,
    hideForPoll: true,
  },
  {
    key: "pin",
    label: "Ghim tin nhắn",
    icon: Pin,
    iconColor: "#D97706",
    requiresActive: true,
    requiresGroupRoom: true,
    dynamic: (message) => ({
      label: message.isPinned ? "Bỏ ghim tin nhắn" : "Ghim tin nhắn",
      icon: message.isPinned ? PinOff : Pin,
    }),
  },
  {
    key: "deleteForMe",
    label: "Xóa phía tôi",
    icon: Trash2,
    iconColor: "#DC2626",
    color: "#DC2626",
  },
  {
    key: "recall",
    label: "Thu hồi",
    icon: Undo2,
    iconColor: "#EA580C",
    color: "#EA580C",
    requiresOwn: true,
    requiresActive: true,
  },
];

export default function MessageActionSheet({
  visible,
  message,
  isOwnMessage,
  isGroupRoom = false,
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
    if (item.requiresGroupRoom && !isGroupRoom) return false;
    if (item.key === "pin") {
      return true;
    }
    if (item.hideForPoll && message.type === "POLL") return false;
    return true;
  }).map((item) => ({
    ...item,
    key:
      item.key === "pin"
        ? ((message.isPinned ? "unpin" : "pin") as MessageAction)
        : item.key,
    label: item.dynamic ? item.dynamic(message).label : item.label,
    icon: item.dynamic ? item.dynamic(message).icon : item.icon,
  }));

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
                  <View style={styles.actionLeading}>
                    <View style={styles.iconWrap}>
                      <item.icon
                        size={17}
                        color={item.iconColor || item.color || "#6B7280"}
                      />
                    </View>
                    <Text
                      style={[
                        styles.actionText,
                        item.color ? { color: item.color } : null,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </View>
                  <Text style={styles.actionArrow}>›</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[styles.actionRow, styles.cancelRow]}
                onPress={onClose}
              >
                <View style={styles.actionLeading}>
                  <View style={styles.iconWrap}>
                    <X size={16} color="#6B7280" />
                  </View>
                  <Text
                    style={[
                      styles.actionText,
                      styles.cancelText,
                    ]}
                  >
                    Đóng
                  </Text>
                </View>
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
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 34,
    paddingTop: 10,
    paddingHorizontal: 8,
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
    minHeight: 54,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 14,
  },
  actionBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#F3F4F6",
  },
  cancelRow: {
    marginTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E5E7EB",
    paddingTop: 14,
  },
  actionLeading: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: "#F4F4F5",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  actionText: {
    fontSize: 15,
    color: "#111827",
    fontWeight: "600",
  },
  actionArrow: {
    color: "#9CA3AF",
    fontSize: 20,
    lineHeight: 20,
    marginTop: -2,
  },
  cancelText: {
    color: "#6B7280",
  },
});
