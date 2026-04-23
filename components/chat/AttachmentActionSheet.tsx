import React from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
} from "react-native";
import { ImageIcon, FileIcon, BarChart3, X } from "lucide-react-native";

export type AttachmentAction = "image" | "file" | "poll";

interface AttachmentActionSheetProps {
  visible: boolean;
  allowPoll?: boolean;
  onAction: (action: AttachmentAction) => void;
  onClose: () => void;
}

export default function AttachmentActionSheet({
  visible,
  allowPoll = false,
  onAction,
  onClose,
}: AttachmentActionSheetProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.sheet}>
              <View style={styles.handle} />
              
              <TouchableOpacity
                style={[styles.actionRow, styles.actionBorder]}
                onPress={() => {
                  onClose();
                  onAction("image");
                }}
              >
                <ImageIcon size={24} color="#6366F1" />
                <Text style={styles.actionText}>Chọn Ảnh / Video</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.actionRow}
                onPress={() => {
                  onClose();
                  onAction("file");
                }}
              >
                <FileIcon size={24} color="#10B981" />
                <Text style={styles.actionText}>Chọn Tệp (Tin nhắn file)</Text>
              </TouchableOpacity>

              {allowPoll && (
                <TouchableOpacity
                  style={[styles.actionRow, styles.actionBorder]}
                  onPress={() => {
                    onClose();
                    onAction("poll");
                  }}
                >
                  <BarChart3 size={24} color="#DF40A3" />
                  <Text style={styles.actionText}>Tạo bình chọn</Text>
                </TouchableOpacity>
              )}
              
              <View style={styles.spacer} />

              <TouchableOpacity
                style={[styles.actionRow, styles.cancelRow]}
                onPress={onClose}
              >
                <X size={20} color="#6B7280" />
                <Text style={[styles.actionText, styles.cancelText]}>Hủy</Text>
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
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 34,
    paddingTop: 12,
  },
  handle: {
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#E5E7EB",
    alignSelf: "center",
    marginBottom: 16,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  actionBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#F3F4F6",
  },
  spacer: {
    height: 8,
    backgroundColor: "#F9FAFB",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#F3F4F6",
  },
  cancelRow: {
    justifyContent: "center",
  },
  actionText: {
    fontSize: 16,
    color: "#1F2937",
    fontWeight: "500",
    marginLeft: 12,
  },
  cancelText: {
    color: "#4B5563",
    marginLeft: 8,
  },
});
