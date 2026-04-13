import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Send,
  Phone,
  Video,
  MoreVertical,
  Image as ImageIcon,
  Users,
  Smile,
} from "lucide-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAppSelector, useAppDispatch } from "@/features/store";
import {
  SocketManager,
  setCurrentRoom,
  selectMessages,
  selectRecalledMessageIds,
  selectTypingUsers,
  type TypingUser,
} from "@/features/chat";
import {
  sendMessageApi,
  getHistoryMessagesApi,
  markAsReadApi,
  getCurrentUserRoomsApi,
} from "@/services/chat";
import type { RoomResponse } from "@/types/chat/room";
import type {
  MessageResponse,
  HistoryMessageResponse,
} from "@/types/chat/message";
import { getRoomDisplayName, getRoomAvatar } from "@/utils/roomInfo";
import { formatMessageTime } from "@/utils/formatMessageTime";
import { addUniqueMessage } from "@/utils/addUniqueMessage";

function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export default function ChatRoomScreen() {
  const { roomId: roomIdParam } = useLocalSearchParams<{ roomId: string }>();
  const roomId = Number(roomIdParam);
  const router = useRouter();
  const dispatch = useAppDispatch();

  const { mode } = useAppSelector((state) => state.theme);
  const isDark = mode === "dark";
  const { userSession } = useAppSelector((state) => state.auth);
  const reduxMessages = useAppSelector(selectMessages) as MessageResponse[];
  const recalledMessageIds = useAppSelector(selectRecalledMessageIds) as string[];
  const typingUsers = useAppSelector(selectTypingUsers(roomId)) as TypingUser[];

  const [room, setRoom] = useState<RoomResponse | null>(null);
  const [historyMessages, setHistoryMessages] = useState<MessageResponse[]>([]);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [isSending, setIsSending] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const isInitialLoad = useRef(true);

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const res = await getCurrentUserRoomsApi({ page: 1, size: 100 });
        const found = res.data.data.content.find((r) => r.roomId === roomId);
        if (found) setRoom(found);
      } catch (err) {
        console.error("[ChatRoom] Failed to fetch room:", err);
      }
    };
    fetchRoom();
  }, [roomId]);

  useEffect(() => {
    dispatch(setCurrentRoom(roomId));
    SocketManager.enterRoom(roomId);
    return () => {
      SocketManager.leaveRoom();
      dispatch(setCurrentRoom(null));
    };
  }, [roomId, dispatch]);

  const fetchMessages = useCallback(
    async (beforeId?: string, append = false) => {
      try {
        if (!append) setIsLoadingMessages(true);
        else setIsLoadingMore(true);

        const response = await getHistoryMessagesApi(roomId, beforeId, 20);
        const hist: HistoryMessageResponse = response.data.data;

        if (append) {
          setHistoryMessages((prev) => {
            const ids = new Set(prev.map((m) => String(m.id)));
            const unique = hist.messageResponses.filter((m) => !ids.has(String(m.id)));
            // Trong inverted list, tin nhắn cũ phải nằm ở CUỐI mảng
            return [...prev, ...unique];
          });
        } else {
          setHistoryMessages(hist.messageResponses);
        }
        setHasMoreMessages(hist.hasMore);
      } catch (err) {
        console.error("[ChatRoom] Failed to fetch messages:", err);
      } finally {
        setIsLoadingMessages(false);
        setIsLoadingMore(false);
      }
    },
    [roomId]
  );

  useEffect(() => {
    if (roomId) {
      isInitialLoad.current = true;
      setHistoryMessages([]);
      setHasMoreMessages(true);
      fetchMessages();
    }
  }, [roomId, fetchMessages]);

  const messages = useMemo(() => {
    const recalledIds = new Set(recalledMessageIds);
    const updatedHistory = historyMessages.map((m) =>
      recalledIds.has(m.id) ? { ...m, isActive: false } : m
    );
    const historyIds = new Set(historyMessages.map((m) => String(m.id)));
    const historyClientIds = new Set(
      historyMessages.map((m) => m.clientMsgId ? String(m.clientMsgId) : "")
    );

    const newFromRedux = reduxMessages.filter(
      (m) =>
        !historyIds.has(String(m.id)) &&
        (!m.clientMsgId || !historyClientIds.has(String(m.clientMsgId)))
    );

    const merged = [...updatedHistory, ...newFromRedux];

    // SẮP XẾP: LUÔN LUÔN Mới nhất ở index 0 (Dưới cùng màn hình)
    merged.sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;

      if (timeA !== timeB) {
        return timeB - timeA;
      }
      return String(b.id).localeCompare(String(a.id));
    });

    return merged;
  }, [historyMessages, reduxMessages, recalledMessageIds]);

  useEffect(() => {
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      markAsReadApi({ lastReadMessageId: lastMsg.id, roomId }).catch(() => {});
    }
  }, [messages.length, roomId]);

  const handleLoadMore = () => {
    if (hasMoreMessages && !isLoadingMore && messages.length > 0) {
      // In inverted mode, the "top" of the list (older messages) is the end of the array
      fetchMessages(messages[messages.length - 1].id, true);
    }
  };

  const handleSend = async () => {
    const text = messageText.trim();
    if (!text || isSending) return;
    setIsSending(true);
    setMessageText("");
    try {
      const res = await sendMessageApi({
        content: text,
        clientMsgId: generateUUID(),
        type: "TEXT",
        roomId,
      });
      setHistoryMessages((prev) =>
        addUniqueMessage(prev, res.data.data as MessageResponse)
      );
    } catch {
      Alert.alert("Lỗi", "Không thể gửi tin nhắn.");
      setMessageText(text);
    } finally {
      setIsSending(false);
    }
  };

  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleTextChange = (text: string) => {
    setMessageText(text);
    if (text.length > 0) {
      SocketManager.sendTyping(roomId, true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(
        () => SocketManager.sendTyping(roomId, false),
        3000
      );
    } else {
      SocketManager.sendTyping(roomId, false);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    }
  };

  const isCurrentUser = (senderId: number) => senderId === userSession?.id;
  const getSenderInfo = (senderId: number) => {
    if (!room) return { name: "Unknown", avatar: undefined };
    const p = room.participants.find((p) => p.userId === senderId);
    return { name: p?.name || "Unknown", avatar: p?.avatarUrl };
  };

  const otherUsersTyping = typingUsers.filter(
    (u) => u.userId !== userSession?.id && u.isTyping
  );
  const roomName = room ? getRoomDisplayName(room, userSession) : "...";
  const roomAvatar = room ? getRoomAvatar(room, userSession) : undefined;
  
  const iconColor = isDark ? "#c084fc" : "#9333ea";

  const renderMessage = ({ item }: { item: MessageResponse }) => {
    const isMine = isCurrentUser(item.senderId);
    const sender = getSenderInfo(item.senderId);
    const time = formatMessageTime(item.createdAt);

    if (item.type === "SYSTEM") {
      return (
        <View className="items-center my-2 px-4">
          <View className="px-3.5 py-1.5 rounded-full bg-muted/60">
            <Text className="text-[11px] text-muted-foreground">{item.content}</Text>
          </View>
        </View>
      );
    }

    if (!item.isActive) {
      return (
        <View className={`my-1 px-4 ${isMine ? "items-end" : "items-start"}`}>
          <View className="px-4 py-2.5 rounded-2xl bg-muted/30 border border-muted-foreground/30 border-dashed">
            <Text className="text-[13px] italic text-muted-foreground">Tin nhắn đã thu hồi</Text>
          </View>
        </View>
      );
    }

    return (
      <View className={`my-1 px-4 ${isMine ? "items-end" : "items-start"}`}>
        {!isMine && room?.roomType === "GROUP" && (
          <Text className="text-[11px] font-semibold text-muted-foreground mb-0.5 ml-11">
            {sender.name}
          </Text>
        )}

        <View className={`flex-row items-end gap-2 max-w-[80%] ${isMine ? "flex-row-reverse" : ""}`}>
          {!isMine && (
            <View>
              {sender.avatar ? (
                <Image
                  source={{ uri: sender.avatar }}
                  className="w-8 h-8 rounded-full border-[1.5px] border-primary/20"
                />
              ) : (
                <View className="w-8 h-8 rounded-full bg-primary/10 items-center justify-center border border-primary/20">
                  <Users size={14} className="text-primary" color={iconColor} />
                </View>
              )}
            </View>
          )}

          <View
            className={`px-4 py-2.5 rounded-2xl ${
              isMine
                ? "bg-primary rounded-br-[6px]"
                : "bg-card border border-border rounded-bl-[6px]"
            }`}
          >
            {item.type === "IMAGE" ? (
              <Image
                source={{ uri: item.content }}
                className="w-48 h-48 rounded-[14px]"
                resizeMode="cover"
              />
            ) : (
              <Text
                className={`text-[15px] leading-[21px] ${
                  isMine ? "text-primary-foreground" : "text-foreground"
                }`}
              >
                {item.content}
              </Text>
            )}
            <Text
              className={`text-[10px] mt-1 text-right ${
                isMine ? "text-primary-foreground/70" : "text-muted-foreground"
              }`}
            >
              {time}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View className="flex-row items-center px-4 py-3 bg-card border-b border-border z-10">
          <TouchableOpacity onPress={() => router.back()} className="mr-2.5 p-1 rounded-xl">
            <ArrowLeft size={22} className="text-foreground" color={isDark ? "#FFF" : "#000"} />
          </TouchableOpacity>

          {roomAvatar ? (
            <Image
              source={{ uri: roomAvatar }}
              className="w-10 h-10 rounded-full border-2 border-primary/20"
            />
          ) : (
            <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center border border-primary/20">
              <Users size={18} className="text-primary" color={iconColor} />
            </View>
          )}

          <View className="flex-1 ml-3">
            <Text className="font-bold text-base text-foreground" numberOfLines={1}>
              {roomName}
            </Text>
            {otherUsersTyping.length > 0 && (
              <Text className="text-xs font-medium text-primary">
                {otherUsersTyping[0].name} đang nhập...
              </Text>
            )}
          </View>

          <TouchableOpacity className="p-2">
            <Phone size={20} className="text-primary" color={iconColor} />
          </TouchableOpacity>
          <TouchableOpacity className="p-2">
            <Video size={20} className="text-primary" color={iconColor} />
          </TouchableOpacity>
          <TouchableOpacity className="p-2">
            <MoreVertical size={20} className="text-muted-foreground" color={isDark ? "#9CA3AF" : "#6B7280"} />
          </TouchableOpacity>
        </View>

        {/* Messages */}
        {isLoadingMessages ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={iconColor} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            inverted
            keyExtractor={(item, index) => item.id || `msg-${index}`}
            renderItem={renderMessage}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingVertical: 12,
            }}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.2}
            scrollEventThrottle={200}
            ListHeaderComponent={
              isLoadingMore ? (
                <View className="py-3 items-center">
                  <ActivityIndicator size="small" color={iconColor} />
                </View>
              ) : null
            }
            ListEmptyComponent={
              <View className="items-center px-8">
                <View className="w-16 h-16 rounded-full bg-primary/10 items-center justify-center mb-3 border border-primary/20">
                  <Smile size={28} className="text-primary" color={iconColor} />
                </View>
                <Text className="text-[15px] text-muted-foreground text-center">
                  Hãy gửi tin nhắn đầu tiên 👋
                </Text>
              </View>
            }
          />
        )}

        {/* Input */}
        <View className="flex-row items-end px-4 py-2.5 bg-card border-t border-border">
          <TouchableOpacity className="p-2 mr-1 mb-0.5">
            <ImageIcon size={22} className="text-primary" color={iconColor} />
          </TouchableOpacity>

          <View className="flex-1 flex-row items-end rounded-full px-4 py-2 bg-muted/30 border border-border min-h-[42px] max-h-[120px]">
            <TextInput
              className="flex-1 text-[15px] text-foreground max-h-[100px]"
              placeholder="Nhập tin nhắn..."
              placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
              value={messageText}
              onChangeText={handleTextChange}
              multiline
              textAlignVertical="center"
            />
          </View>

          <TouchableOpacity
            onPress={handleSend}
            disabled={!messageText.trim() || isSending}
            className={`p-2.5 ml-2 mb-0.5 rounded-full ${
              messageText.trim() ? "bg-primary" : "bg-primary/30"
            }`}
          >
            {isSending ? (
              <ActivityIndicator size={18} color="#fff" />
            ) : (
              <Send size={18} color={messageText.trim() ? "#fff" : isDark ? "#c084fc" : "#E9D5FF"} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
