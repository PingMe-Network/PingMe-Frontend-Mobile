import { useState, useEffect, useCallback } from "react";
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
import { Search, Plus, Users, MessageCircle } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useAppSelector } from "@/features/store";
import { useTabBarHeight } from "@/hooks/useTabBarHeight";
import { getCurrentUserRoomsApi } from "@/services/chat";
import { SocketManager } from "@/features/chat";
import type { RoomResponse } from "@/types/chat/room";
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
} from "@/features/chat";

export default function MessagesScreen() {
  const { userSession } = useAppSelector((state) => state.auth);
  const tabBarHeight = useTabBarHeight();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [rooms, setRooms] = useState<RoomResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 0,
    hasMore: true,
    isLoadingMore: false,
  });

  const fetchRooms = useCallback(
    async (page: number, append = false) => {
      try {
        if (!append) setIsLoading(true);
        else setPagination((p) => ({ ...p, isLoadingMore: true }));

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
      setRooms((prev) => {
        const idx = prev.findIndex((r) => r.roomId === incoming.roomId);
        if (idx === -1) return [incoming, ...prev];
        const merged = { ...prev[idx], ...incoming };
        const filtered = prev.filter((r) => r.roomId !== incoming.roomId);
        return [merged, ...filtered];
      });
    };

    const unsubs = [
      SocketManager.on("MESSAGE_CREATED", (ev: MessageCreatedEventPayload) => {
        const message = ev.messageResponse;
        setRooms((prev) => {
          const targetRoom = prev.find((r) => r.roomId === message.roomId);
          if (!targetRoom) return prev;
          const updatedRoom = {
            ...targetRoom,
            lastMessage: {
              messageId: message.id,
              senderId: message.senderId,
              preview: message.content,
              messageType: message.type as any,
              createdAt: message.createdAt,
            },
          };
          const otherRooms = prev.filter((r) => r.roomId !== message.roomId);
          return [updatedRoom, ...otherRooms];
        });
      }),
      SocketManager.on("ROOM_CREATED", (ev: RoomCreatedEventPayload) => upsertRoom(ev.roomResponse)),
      SocketManager.on("ROOM_UPDATED", (ev: RoomUpdatedEventPayload) => upsertRoom(ev.roomResponse)),
      SocketManager.on("ROOM_MEMBER_ADDED", (ev: RoomMemberAddedEventPayload) => upsertRoom(ev.roomResponse)),
      SocketManager.on("ROOM_MEMBER_REMOVED", (ev: RoomMemberRemovedEventPayload) => {
          if (ev.targetUserId === userSession?.id) {
            setRooms((prev) => prev.filter((r) => r.roomId !== ev.roomResponse.roomId));
          } else {
            upsertRoom(ev.roomResponse);
          }
        }
      ),
      SocketManager.on("USER_STATUS", (statusPayload) => {
        setRooms((prevRooms) =>
          prevRooms.map((room) => ({
            ...room,
            participants: room.participants.map((p) =>
              p.userId === Number(statusPayload.userId)
                ? { ...p, status: statusPayload.isOnline ? "ONLINE" : "OFFLINE" }
                : p
            ),
          }))
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

  const openChatRoom = (room: RoomResponse) => {
    router.push({
      pathname: "/(app)/messages/[roomId]",
      params: { roomId: room.roomId.toString() },
    });
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

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => openChatRoom(item)}
        className="flex-row items-center py-3.5 px-4 mb-2 mx-4 bg-card rounded-3xl shadow-sm"
      >
          {avatar ? (
            <Image
              source={{ uri: avatar }}
              className="w-14 h-14 rounded-full border-2 border-primary/20"
            />
          ) : (
            <View className="w-14 h-14 rounded-full bg-primary/10 items-center justify-center border-2 border-primary/20">
              <Users size={22} color="#c026d3" className="text-primary" />
            </View>
          )}
          {isOnline && (
            <View className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-[2.5px] border-card z-10" />
          )}
        </View>
        <View className="flex-1 ml-3.5">
          <View className="flex-row justify-between items-center mb-1">
            <Text className="font-bold text-[15px] text-foreground flex-1 mr-2" numberOfLines={1}>
              {displayName}
            </Text>
            <Text className="text-[11px] text-muted-foreground font-medium">
              {time}
            </Text>
          </View>
          <Text className="text-[13px] text-muted-foreground" numberOfLines={1}>
            {preview}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const iconColor = "#c026d3"; // Vibrant Pink-Violet

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "left", "right"]}>
      {/* Header */}
      <View className="px-6 pt-5 pb-2 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <View className="w-11 h-11 rounded-full overflow-hidden border-2 border-primary/30">
            <Image
              source={{ uri: userSession?.avatarUrl || "https://i.pravatar.cc/150?img=11" }}
              className="w-full h-full"
            />
          </View>
          <View className="ml-3">
            <Text className="text-2xl font-black text-foreground tracking-tight">
              Tin nhắn
            </Text>
            <Text className="text-xs text-muted-foreground mt-0.5">
              {rooms.length} cuộc trò chuyện
            </Text>
          </View>
        </View>
        <TouchableOpacity className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center border border-primary/20">
          <Plus size={20} className="text-primary" color={iconColor} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View className="px-6 mt-2 mb-3">
        <View className="flex-row items-center h-11 px-4 rounded-[16px] bg-muted/60 border border-border">
          <Search size={18} className="text-muted-foreground" color="#71717A" />
          <TextInput
            className="flex-1 ml-2.5 text-[14px] text-foreground"
            placeholder="Tìm cuộc trò chuyện..."
            placeholderTextColor="#71717A"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Chat List */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={iconColor} />
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
          contentContainerStyle={{ paddingBottom: tabBarHeight + 20, paddingTop: 4 }}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            pagination.isLoadingMore ? (
              <View className="py-4 items-center">
                <ActivityIndicator size="small" color={iconColor} />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View className="items-center justify-center mt-14">
              <View className="w-16 h-16 rounded-full bg-primary/10 items-center justify-center mb-4 border border-primary/20">
                <MessageCircle size={32} className="text-primary" color={iconColor} />
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
    </SafeAreaView>
  );
}
