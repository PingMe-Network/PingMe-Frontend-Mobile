import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Users, User, X, Forward } from "lucide-react-native";
import { useAppSelector } from "@/features/store";
import { getCurrentUserRoomsApi, forwardMessageApi, bulkForwardMessageApi } from "@/services/chat";
import type { RoomResponse } from "@/types/chat/room";
import { getRoomDisplayName, getRoomAvatar } from "@/utils/roomInfo";
import { useAlert } from "@/components/ui/AlertProvider";

interface ForwardMessageModalProps {
  isVisible: boolean;
  onClose: () => void;
  sourceMessageId: string | null;
}

export function ForwardMessageModal({ isVisible, onClose, sourceMessageId }: ForwardMessageModalProps) {
  const { mode } = useAppSelector((state) => state.theme);
  const isDark = mode === "dark";
  const { userSession } = useAppSelector((state) => state.auth);
  const alert = useAlert();

  const [rooms, setRooms] = useState<RoomResponse[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [selectedRoomIds, setSelectedRoomIds] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchRooms = async () => {
      setLoadingRooms(true);
      try {
        const res = await getCurrentUserRoomsApi({ page: 1, size: 100 });
        setRooms(res.data.data.content);
      } catch {
        alert.showAlert({ type: "error", title: "Lỗi", message: "Không thể tải danh sách chat." });
      } finally {
        setLoadingRooms(false);
      }
    };

    if (isVisible) {
      fetchRooms();
      setSelectedRoomIds([]);
    }
  }, [isVisible, alert]);

  const handleToggleRoom = (roomId: number) => {
    setSelectedRoomIds((prev) =>
      prev.includes(roomId) ? prev.filter((id) => id !== roomId) : [...prev, roomId]
    );
  };

  const handleForward = async () => {
    if (!sourceMessageId) return;
    if (selectedRoomIds.length === 0) {
      alert.showAlert({ type: "error", title: "Lỗi", message: "Vui lòng chọn ít nhất một đoạn chat để chuyển tiếp." });
      return;
    }

    setIsSubmitting(true);
    try {
      const clientMsgId = "fw-" + Date.now() + "-" + Math.floor(Math.random() * 1000);
      
      if (selectedRoomIds.length === 1) {
        await forwardMessageApi({
          sourceMessageId,
          clientMsgId,
          targetRoomId: selectedRoomIds[0],
        });
      } else {
        await bulkForwardMessageApi({
          sourceMessageId,
          clientMsgId,
          targetRoomIds: selectedRoomIds,
        });
      }
      
      alert.showAlert({ type: "success", title: "Thành công", message: "Đã chuyển tiếp tin nhắn." });
      onClose();
    } catch {
      alert.showAlert({ type: "error", title: "Lỗi", message: "Không thể chuyển tiếp tin nhắn." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderRoom = ({ item }: { item: RoomResponse }) => {
    const isChecked = selectedRoomIds.includes(item.roomId);
    const roomName = getRoomDisplayName(item, userSession);
    const avatarImg = getRoomAvatar(item, userSession);
    const isGroup = item.roomType === "GROUP";
    const iconColor = isDark ? "#c084fc" : "#9333ea";

    return (
      <TouchableOpacity
        onPress={() => handleToggleRoom(item.roomId)}
        className={`flex-row items-center p-3 mb-2 rounded-xl border ${isChecked ? "bg-primary/10 border-primary/40" : "bg-card border-border"}`}
      >
        <View className={`w-5 h-5 rounded-full border items-center justify-center mr-3 ${isChecked ? "border-primary bg-primary" : "border-muted-foreground"}`}>
          {isChecked && <View className="w-2.5 h-2.5 rounded-full bg-white" />}
        </View>

        <View className="relative">
          {avatarImg ? (
            <Image source={{ uri: avatarImg }} className="w-12 h-12 rounded-full border-[1.5px] border-primary/20" />
          ) : (
            <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center border border-primary/20">
              {isGroup ? <Users size={20} color={iconColor} /> : <User size={20} color={iconColor} />}
            </View>
          )}
          <View className="absolute -bottom-1 -right-1 bg-background rounded-full p-[2px] border border-border">
            {isGroup ? <Users size={12} color="#3b82f6" /> : <User size={12} color="#10b981" />}
          </View>
        </View>

        <View className="ml-3 flex-1">
          <Text className="text-[15px] font-bold text-foreground" numberOfLines={1}>{roomName}</Text>
          <Text className="text-[12px] text-muted-foreground mt-0.5 uppercase">{isGroup ? "Nhóm" : "Cá nhân"}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={isVisible} animationType="slide" transparent>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-background rounded-t-3xl h-[80%] pt-2 px-4 shadow-xl border-t border-border">
            {/* Header */}
            <View className="flex-row items-center justify-between py-3 border-b border-border mb-4">
              <TouchableOpacity onPress={onClose} className="p-2 -ml-2" disabled={isSubmitting}>
                <X size={24} color={isDark ? "#fff" : "#000"} />
              </TouchableOpacity>
              <Text className="text-lg font-bold text-foreground">Chuyển tiếp tin nhắn</Text>
              <View className="w-10" />
            </View>

            {/* List */}
            {loadingRooms ? (
              <View className="flex-1 justify-center items-center">
                <ActivityIndicator size="large" color={isDark ? "#c084fc" : "#9333ea"} />
              </View>
            ) : rooms.length === 0 ? (
              <View className="flex-1 justify-center items-center">
                <Text className="text-muted-foreground">Không có hội thoại nào.</Text>
              </View>
            ) : (
              <FlatList
                data={rooms}
                keyExtractor={(item) => item.roomId.toString()}
                renderItem={renderRoom}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
              />
            )}

            {/* Footer */}
            <View className="py-4 border-t border-border flex-row items-center justify-between">
              <Text className="text-sm font-medium text-muted-foreground">
                Đã chọn {selectedRoomIds.length}
              </Text>
              <TouchableOpacity
                onPress={handleForward}
                disabled={selectedRoomIds.length === 0 || isSubmitting}
                className={`flex-row items-center px-5 py-3 rounded-full ${selectedRoomIds.length > 0 && !isSubmitting ? "bg-primary" : "bg-primary/30"}`}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Forward size={18} color="#fff" className="mr-2" />
                    <Text className="text-white font-bold text-sm">Gửi</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
