import { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Search, Users, MessageCircle, Plus } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useAppSelector } from "@/features/store";
import { useTabBarHeight } from "@/hooks/useTabBarHeight";
import { getCurrentUserRoomsApi } from "@/services/chat";
import { SocketManager } from "@/features/chat";
import CreateGroupModal from "@/components/chat/CreateGroupModal";
import type { RoomResponse, UserStatus } from "@/types/chat/room";
import {
  getRoomDisplayName,
  getRoomAvatar,
  getLastMessagePreview,
  isOtherParticipantOnline,
} from "@/utils/roomInfo";
import { formatMessageTime } from "@/utils/formatMessageTime";
import type {
  MessageCreatedEventPayload,
  RoomCreatedEventPayload,
  RoomUpdatedEventPayload,
  RoomMemberAddedEventPayload,
  RoomMemberRemovedEventPayload,
  RoomMemberRoleChangedEventPayload,
  RoomDeletedEventPayload,
} from "@/features/chat";

type MessageEventRoomPayload = MessageCreatedEventPayload["messageResponse"];

const removeRoomById = (rooms: RoomResponse[], roomId: number) =>
  rooms.filter((room) => room.roomId !== roomId);

const upsertRoomToTop = (rooms: RoomResponse[], incoming: RoomResponse) => {
  const existing = rooms.find((room) => room.roomId === incoming.roomId);
  if (!existing) return [incoming, ...rooms];

  const merged = { ...existing, ...incoming };
  return [merged, ...removeRoomById(rooms, incoming.roomId)];
};

const applyMessageToRoomList = (
  rooms: RoomResponse[],
  message: MessageEventRoomPayload
) => {
  const targetRoom = rooms.find((room) => room.roomId === message.roomId);
  if (!targetRoom) return rooms;

  const updatedRoom: RoomResponse = {
    ...targetRoom,
    lastMessage: {
      messageId: message.id,
      senderId: message.senderId,
      preview: message.content ?? "",
      messageType: message.type as any,
      createdAt: message.createdAt,
    },
  };

  return [updatedRoom, ...removeRoomById(rooms, message.roomId)];
};

const applyParticipantStatus = (
  rooms: RoomResponse[],
  targetUserId: number,
  isOnline: boolean
) => {
  const nextStatus: UserStatus = isOnline ? "ONLINE" : "OFFLINE";

  return rooms.map((room) => ({
    ...room,
    participants: room.participants.map((participant) =>
      participant.userId === targetUserId
        ? { ...participant, status: nextStatus }
        : participant
    ),
  }));
};

export default function MessagesScreen() {
  const { userSession } = useAppSelector((state) => state.auth);
  const tabBarHeight = useTabBarHeight();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [rooms, setRooms] = useState<RoomResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 0,
    hasMore: true,
    isLoadingMore: false,
  });

  const fetchRooms = useCallback(
    async (page: number, append = false) => {
      try {
        if (append) {
          setPagination((p) => ({ ...p, isLoadingMore: true }));
        } else {
          setIsLoading(true);
        }

        const res = (await getCurrentUserRoomsApi({ page, size: 20 })).data.data;

        setRooms((prev) => (append ? [...prev, ...res.content] : res.content));
        setPagination({
          currentPage: res.page,
          hasMore: res.hasMore,
          isLoadingMore: false,
        });
      } catch (err) {
        console.error("[Chat] Failed to fetch rooms:", err);
      } finally {
        setIsLoading(false);
        setPagination((p) => ({ ...p, isLoadingMore: false }));
      }
    },
    []
  );

  useEffect(() => {
    fetchRooms(1);
  }, [fetchRooms]);

  useEffect(() => {
    const upsertRoom = (incoming: RoomResponse) => {
      setRooms((prev) => upsertRoomToTop(prev, incoming));
    };

    const unsubs = [
      SocketManager.on("MESSAGE_CREATED", (ev: MessageCreatedEventPayload) => {
        setRooms((prev) => applyMessageToRoomList(prev, ev.messageResponse));
      }),
      SocketManager.on("MESSAGE_UPDATED" as any, (ev: any) => {
        // If the updated message is the last message in a room, refresh preview
        if (ev?.messageResponse) {
          setRooms((prev) => {
            const msg = ev.messageResponse;
            const targetRoom = prev.find((r) => r.roomId === msg.roomId);
            if (!targetRoom || targetRoom.lastMessage?.messageId !== msg.id) return prev;
            const existingLastMsg = targetRoom.lastMessage!;
            const updatedRoom: RoomResponse = {
              ...targetRoom,
              lastMessage: {
                messageId: existingLastMsg.messageId,
                senderId: existingLastMsg.senderId,
                messageType: existingLastMsg.messageType,
                createdAt: existingLastMsg.createdAt,
                preview: (msg.content as string | null) ?? existingLastMsg.preview,
              },
            };
            return [updatedRoom, ...removeRoomById(prev, targetRoom.roomId)] as RoomResponse[];
          });
        }
      }),
      SocketManager.on("ROOM_CREATED", (ev: RoomCreatedEventPayload) => upsertRoom(ev.roomResponse)),
      SocketManager.on("ROOM_UPDATED", (ev: RoomUpdatedEventPayload) => upsertRoom(ev.roomResponse)),
      SocketManager.on("ROOM_MEMBER_ADDED", (ev: RoomMemberAddedEventPayload) => upsertRoom(ev.roomResponse)),
      SocketManager.on("ROOM_MEMBER_ROLE_CHANGED", (ev: RoomMemberRoleChangedEventPayload) =>
        upsertRoom(ev.roomResponse)
      ),
      SocketManager.on("ROOM_MEMBER_REMOVED", (ev: RoomMemberRemovedEventPayload) => {
          if (ev.targetUserId === userSession?.id) {
            setRooms((prev) => removeRoomById(prev, ev.roomResponse.roomId));
          } else {
            upsertRoom(ev.roomResponse);
          }
        }
      ),
      SocketManager.on("ROOM_DELETED", (ev: RoomDeletedEventPayload) => {
        setRooms((prev) => removeRoomById(prev, ev.roomId));
      }),
      SocketManager.on("USER_STATUS", (statusPayload) => {
        setRooms((prevRooms) =>
          applyParticipantStatus(
            prevRooms,
            Number(statusPayload.userId),
            statusPayload.isOnline
          )
        );
      }),
    ];

    return () => unsubs.forEach((unsub) => unsub());
  }, [userSession?.id]);

  const handleLoadMore = () => {
    if (pagination.hasMore && !pagination.isLoadingMore) {
      fetchRooms(pagination.currentPage + 1, true);
    }
  };

  const isNavigating = useRef(false);
  const openChatRoom = (room: RoomResponse) => {
    if (isNavigating.current) return;
    isNavigating.current = true;

    router.push({
      pathname: "/(app)/messages/[roomId]",
      params: { roomId: room.roomId.toString() },
    });

    // Reset flag after a short delay to allow future navigations
    setTimeout(() => {
      isNavigating.current = false;
    }, 500);
  };

  const filteredRooms = rooms.filter((room) => {
    if (!searchQuery) return true;
    const displayName = getRoomDisplayName(room, userSession);
    return displayName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const renderItem = ({ item }: { item: RoomResponse }) => {
    const displayName = getRoomDisplayName(item, userSession);
    const avatar = getRoomAvatar(item, userSession);
    const preview = getLastMessagePreview(item, userSession);
    const isOnline = isOtherParticipantOnline(item, userSession);
    const time = item.lastMessage ? formatMessageTime(item.lastMessage.createdAt) : "";
    // Unread logic mock: normally you'd check a real unreadCount.
    const customItem = item as any;
    const isUnread = customItem.unreadCount ? customItem.unreadCount > 0 : false;
    const displayUnreadCount = customItem.unreadCount || 0;

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => openChatRoom(item)}
        className="flex-row items-center py-3.5 px-3.5 mb-2.5 mx-4 rounded-2xl bg-card border border-border"
      >
        <View className="relative">
          {avatar ? (
            <Image
              source={{ uri: avatar }}
              className="w-14 h-14 rounded-full"
            />
          ) : (
            <View className="w-14 h-14 rounded-full bg-primary/10 items-center justify-center border border-primary/20">
              <Users size={22} color={primaryColor} />
            </View>
          )}
          {isOnline && (
            <View className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-[2.5px] border-background z-10" />
          )}
        </View>
        
        <View className="flex-1 ml-3 justify-center">
          <View className="flex-row justify-between items-center mb-0.5">
            <Text className="text-[16px] flex-1 mr-2 font-semibold text-foreground" numberOfLines={1}>
              {displayName}
            </Text>
            <Text className="text-[12px] font-medium text-muted-foreground">
              {time}
            </Text>
          </View>
          
          <View className="flex-row justify-between items-center pr-1 mt-0.5">
            <View className="flex-1 mr-4">
              <Text className="text-[13px] text-muted-foreground" numberOfLines={1}>
                {preview}
              </Text>
              {item.roomType === "GROUP" ? (
                <Text className="text-[11px] text-primary/90 mt-0.5 font-semibold" numberOfLines={1}>
                  Nhóm chat
                </Text>
              ) : null}
            </View>
            {isUnread && (
              <View className="bg-primary min-w-[22px] h-[22px] rounded-full items-center justify-center px-1.5">
                <Text className="text-white text-[11px] font-extrabold">{displayUnreadCount}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const primaryColor = "#DF40A3";
  const grayColor = "#9CA3AF";

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "left", "right"]}>
      {/* Header */}
      <View className="px-5 pt-4 pb-3 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <View className="w-11 h-11 rounded-full overflow-hidden border border-primary/20">
            <Image
              source={{ uri: userSession?.avatarUrl || "https://i.pravatar.cc/150?img=11" }}
              className="w-full h-full"
            />
          </View>
          <View className="ml-3">
            <Text className="text-[22px] font-bold text-foreground tracking-tight">Tin nhắn</Text>
            <Text className="text-[12px] text-muted-foreground">
              {rooms.length} cuộc trò chuyện
            </Text>
          </View>
        </View>
        <TouchableOpacity
          className="h-10 px-3 rounded-full bg-primary flex-row items-center"
          onPress={() => setShowCreateGroupModal(true)}
        >
          <Plus size={16} color="#FFFFFF" />
          <Text className="text-white text-[13px] font-bold ml-1.5">Tạo nhóm</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View className="px-5 mt-1 mb-3">
        <View className="flex-row items-center h-12 px-4 rounded-2xl bg-card border border-border">
          <Search size={18} color={grayColor} />
          <TextInput
            className="flex-1 ml-3 text-[15px] text-foreground"
            placeholder="Tìm kiếm cuộc trò chuyện"
            placeholderTextColor={grayColor}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* List Header */}
      <View className="px-5 flex-row justify-between items-center mb-2">
        <Text className="text-[14px] font-semibold text-muted-foreground uppercase tracking-wide">
          Gần đây
        </Text>
        <TouchableOpacity>
          <Text className="text-[13px] font-medium text-primary">Đánh dấu đã đọc</Text>
        </TouchableOpacity>
      </View>

      {/* Chat List */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={primaryColor} />
          <Text className="mt-3 text-[13px] text-muted-foreground">
            Đang tải tin nhắn...
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredRooms}
          keyExtractor={(item) => item.roomId.toString()}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: tabBarHeight + 20, paddingTop: 6 }}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            pagination.isLoadingMore ? (
              <View className="py-4 items-center">
                <ActivityIndicator size="small" color={primaryColor} />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View className="items-center justify-center mt-14 px-8">
              <View className="w-16 h-16 rounded-full bg-primary/10 items-center justify-center mb-4 border border-primary/20">
                <MessageCircle size={32} color={primaryColor} />
              </View>
              <Text className="text-base font-semibold text-foreground mb-1.5">
                Chưa có tin nhắn
              </Text>
              <Text className="text-[13px] text-muted-foreground">
                Bắt đầu cuộc trò chuyện mới nhé!
              </Text>
            </View>
          }
        />
      )}

      <CreateGroupModal
        visible={showCreateGroupModal}
        onClose={() => setShowCreateGroupModal(false)}
        onGroupCreated={(createdRoom) => {
          setRooms((prev) => upsertRoomToTop(prev, createdRoom));
          setShowCreateGroupModal(false);
          router.push({
            pathname: "/(app)/messages/[roomId]",
            params: { roomId: createdRoom.roomId.toString() },
          });
        }}
      />
    </SafeAreaView>
  );
}
