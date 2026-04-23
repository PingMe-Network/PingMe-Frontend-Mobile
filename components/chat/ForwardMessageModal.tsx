import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from "react-native";
import {
  bulkForwardMessageApi,
  forwardMessageApi,
  getCurrentUserRoomsApi,
} from "@/services/chat";
import type { RoomResponse } from "@/types/chat/room";
import type { MessageResponse } from "@/types/chat/message";

function generateUUID(): string {
  const chars = "0123456789abcdef";
  let uuid = "";
  for (let i = 0; i < 36; i++) {
    if (i === 8 || i === 13 || i === 18 || i === 23) {
      uuid += "-";
    } else if (i === 14) {
      uuid += "4";
    } else if (i === 19) {
      uuid += chars[(Math.random() * 4) | 8];
    } else {
      uuid += chars[(Math.random() * 16) | 0];
    }
  }
  return uuid;
}

interface ForwardMessageModalProps {
  visible: boolean;
  message: MessageResponse | null;
  currentRoomId: number;
  currentUserId?: number;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ForwardMessageModal({
  visible,
  message,
  currentRoomId,
  currentUserId,
  onClose,
  onSuccess,
}: ForwardMessageModalProps) {
  const [rooms, setRooms] = useState<RoomResponse[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (!visible) {
      setSelectedIds([]);
      return;
    }
    const fetchRooms = async () => {
      setIsLoading(true);
      try {
        const res = await getCurrentUserRoomsApi({ page: 1, size: 100 });
        const filtered = res.data.data.content.filter(
          (r) => r.roomId !== currentRoomId
        );
        setRooms(filtered);
      } catch {
        // silently ignore
      } finally {
        setIsLoading(false);
      }
    };
    fetchRooms();
  }, [visible, currentRoomId]);

  const toggleRoom = (roomId: number) => {
    setSelectedIds((prev) =>
      prev.includes(roomId) ? prev.filter((id) => id !== roomId) : [...prev, roomId]
    );
  };

  const handleSend = async () => {
    if (!message || selectedIds.length === 0) return;
    setIsSending(true);
    try {
      if (selectedIds.length === 1) {
        await forwardMessageApi({
          sourceMessageId: message.id,
          clientMsgId: generateUUID(),
          targetRoomId: selectedIds[0],
        });
      } else {
        await bulkForwardMessageApi({
          sourceMessageId: message.id,
          clientMsgId: generateUUID(),
          targetRoomIds: selectedIds,
        });
      }
      onSuccess?.();
      onClose();
      Alert.alert("Thành công", "Đã chuyển tiếp tin nhắn.");
    } catch (err: any) {
      Alert.alert(
        "Lỗi",
        err?.response?.data?.errorMessage || "Không thể chuyển tiếp. Thử lại."
      );
    } finally {
      setIsSending(false);
    }
  };

  const getRoomName = (room: RoomResponse) => {
    if (room.roomType === "GROUP") return room.name || "Nhóm không tên";
    const other = room.participants.find((p) => p.userId !== currentUserId);
    return other?.name || "Người dùng";
  };

  const getRoomAvatar = (room: RoomResponse) => {
    if (room.roomImgUrl) return room.roomImgUrl;
    if (room.roomType === "DIRECT") {
      return room.participants.find((p) => p.userId !== currentUserId)?.avatarUrl;
    }
    return undefined;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Chuyển tiếp tin nhắn</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <ActivityIndicator style={{ marginTop: 40 }} color="#DF40A3" />
          ) : (
            <FlatList
              data={rooms}
              keyExtractor={(r) => String(r.roomId)}
              style={{ flex: 1 }}
              renderItem={({ item }) => {
                const selected = selectedIds.includes(item.roomId);
                const avatar = getRoomAvatar(item);
                return (
                  <TouchableOpacity
                    style={[styles.roomRow, selected && styles.roomRowSelected]}
                    onPress={() => toggleRoom(item.roomId)}
                  >
                    {avatar ? (
                      <Image source={{ uri: avatar }} style={styles.avatar} />
                    ) : (
                      <View style={[styles.avatar, styles.avatarFallback]}>
                        <Text style={styles.avatarFallbackText}>
                          {getRoomName(item).charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <Text style={styles.roomName} numberOfLines={1}>
                      {getRoomName(item)}
                    </Text>
                    <View
                      style={[
                        styles.checkbox,
                        selected && styles.checkboxSelected,
                      ]}
                    >
                      {selected && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          )}

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.sendBtn,
                (selectedIds.length === 0 || isSending) && styles.sendBtnDisabled,
              ]}
              onPress={handleSend}
              disabled={selectedIds.length === 0 || isSending}
            >
              {isSending ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.sendBtnText}>
                  Gửi {selectedIds.length > 0 ? `(${selectedIds.length})` : ""}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: "70%",
    paddingBottom: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
  },
  title: { fontSize: 16, fontWeight: "700", color: "#111827" },
  closeBtn: { fontSize: 18, color: "#6B7280", paddingHorizontal: 8 },
  roomRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#F3F4F6",
  },
  roomRowSelected: { backgroundColor: "#FDF2FA" },
  avatar: { width: 44, height: 44, borderRadius: 22, marginRight: 12 },
  avatarFallback: {
    backgroundColor: "#F3E8FF",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarFallbackText: { fontSize: 18, color: "#9333EA", fontWeight: "600" },
  roomName: { flex: 1, fontSize: 15, color: "#111827", fontWeight: "500" },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxSelected: { backgroundColor: "#DF40A3", borderColor: "#DF40A3" },
  checkmark: { color: "#fff", fontSize: 13, fontWeight: "700" },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  sendBtn: {
    backgroundColor: "#DF40A3",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  sendBtnDisabled: { opacity: 0.45 },
  sendBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
