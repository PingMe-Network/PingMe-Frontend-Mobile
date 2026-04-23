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
  Linking,
  StyleSheet,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Send,
  Phone,
  Video,
  Users,
  Smile,
  Plus,
  Mic,
  X,
  Check,
  Pin,
  ChevronDown,
  ChevronUp,
  Settings,
  Sparkles,
} from "lucide-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAppSelector, useAppDispatch } from "@/features/store";
import {
  SocketManager,
  setCurrentRoom,
  selectMessages,
  selectRecalledMessageIds,
  selectTypingUsers,
  messageDeletedForMe,
  messageCreated,
  messageUpdated,
  expireStaleTyping,
  type RoomUpdatedEventPayload,
  type RoomMemberAddedEventPayload,
  type RoomMemberRemovedEventPayload,
  type RoomMemberRoleChangedEventPayload,
  type RoomDeletedEventPayload,
  type TypingUser,
} from "@/features/chat";
import { useVideoPlayer, VideoView } from "expo-video";
import {
  sendMessageApi,
  getHistoryMessagesApi,
  markAsReadApi,
  getCurrentUserRoomsApi,
  recallMessageApi,
  deleteMessageForMeApi,
  editMessageApi,
  sendFileMessageApi,
  sendImageBatchMessageApi,
  pinMessageApi,
  unpinMessageApi,
  getPinnedMessagesApi,
  createPollMessageApi,
  getGroupMessageSummaryApi,
} from "@/services/chat";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import AttachmentActionSheet, { AttachmentAction } from "@/components/chat/AttachmentActionSheet";
import type { RoomResponse } from "@/types/chat/room";
import type {
  GroupMessageSummaryResponse,
  MessageResponse,
  RepliedMessageSnapshot,
} from "@/types/chat/message";
import { getRoomDisplayName, getRoomAvatar, isOtherParticipantOnline } from "@/utils/roomInfo";
import { formatMessageTime } from "@/utils/formatMessageTime";
import { addUniqueMessage } from "@/utils/addUniqueMessage";
import MessageActionSheet, { type MessageAction } from "@/components/chat/MessageActionSheet";
import ForwardMessageModal from "@/components/chat/ForwardMessageModal";
import ReplyPreview from "@/components/chat/ReplyPreview";
import RepliedMessageBubble from "@/components/chat/RepliedMessageBubble";
import MultiImageGrid from "@/components/chat/MultiImageGrid";
import MessagePoll from "@/components/chat/MessagePoll";
import CreatePollModal from "@/components/chat/CreatePollModal";
import GroupManagementModal from "@/components/chat/GroupManagementModal";

// ─── UUID ────────────────────────────────────────────────────────────
type CryptoLike = {
  randomUUID?: () => string;
  getRandomValues?: (array: Uint8Array) => Uint8Array;
};

let clientMsgIdFallbackCounter = 0;

function toUuidFromBytes(bytes: Uint8Array): string {
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0"));
  return `${hex[0]}${hex[1]}${hex[2]}${hex[3]}-${hex[4]}${hex[5]}-${hex[6]}${hex[7]}-${hex[8]}${hex[9]}-${hex[10]}${hex[11]}${hex[12]}${hex[13]}${hex[14]}${hex[15]}`;
}

function generateUuidFallback(): string {
  clientMsgIdFallbackCounter = (clientMsgIdFallbackCounter + 1) >>> 0;
  const now = Date.now();
  const nowLow = now >>> 0;
  const nowHigh = Math.floor(now / 0x100000000) >>> 0;
  const perfNow =
    typeof performance !== "undefined" && typeof performance.now === "function"
      ? Math.floor(performance.now() * 1000) >>> 0
      : 0;
  const words = [nowLow, nowHigh, perfNow, clientMsgIdFallbackCounter];
  const bytes = new Uint8Array(16);
  for (let i = 0; i < words.length; i += 1) {
    const word = words[i];
    bytes[i * 4] = word & 0xff;
    bytes[i * 4 + 1] = (word >>> 8) & 0xff;
    bytes[i * 4 + 2] = (word >>> 16) & 0xff;
    bytes[i * 4 + 3] = (word >>> 24) & 0xff;
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  return toUuidFromBytes(bytes);
}

function generateUUID(): string {
  const cryptoApi = (globalThis as { crypto?: CryptoLike }).crypto;
  if (cryptoApi?.randomUUID) return cryptoApi.randomUUID();
  if (!cryptoApi?.getRandomValues) return generateUuidFallback();
  const bytes = cryptoApi.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  return toUuidFromBytes(bytes);
}

// ─── Helpers ─────────────────────────────────────────────────────────
const PRIMARY = "#DF40A3";
const GRAY = "#9CA3AF";

function getFileLabel(msg: MessageResponse): string {
  const content = msg.content || "";
  const format = msg.fileFormat;

  try {
    const url = new URL(content);
    let rawName = url.pathname.split("/").pop() || "File";
    rawName = decodeURIComponent(rawName);

    const uuidPrefixRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}_?/i;
    if (uuidPrefixRegex.test(rawName)) {
      rawName = rawName.replace(uuidPrefixRegex, "");
      // if it becomes empty string (e.g. only UUID was there), fallback
      if (!rawName || rawName === `.${format}`) {
        rawName = url.pathname.split("/").pop() || "File";
      }
    }

    if (format) {
      const cleanFormat = format.toLowerCase().replace(/^\./, "");
      if (!rawName.toLowerCase().endsWith(`.${cleanFormat}`)) {
        return `${rawName}.${cleanFormat}`;
      }
    }

    return rawName;
  } catch {
    let rawName = content.split("/").pop() || "Tệp";
    rawName = rawName.split("?")[0];
    try {
      rawName = decodeURIComponent(rawName);
    } catch {
      // Ignored
    }

    if (format) {
      const cleanFormat = format.toLowerCase().replace(/^\./, "");
      if (!rawName.toLowerCase().endsWith(`.${cleanFormat}`)) {
        return `${rawName}.${cleanFormat}`;
      }
    }
    return rawName;
  }
}

// ─── Video Player Component ──────────────────────────────────────────
const MessageVideoPlayer = ({ url, onLongPress }: { url: string; onLongPress?: () => void }) => {
  const player = useVideoPlayer(url, (p) => {
    p.loop = false;
    p.pause();
  });

  return (
    <TouchableOpacity 
      activeOpacity={1}
      onLongPress={onLongPress}
      style={{ width: 220, height: 220, overflow: "hidden", borderRadius: 12, backgroundColor: "#000" }}
    >
      <VideoView
        player={player}
        style={{ flex: 1 }}
        fullscreenOptions={{ enable: true }}
        allowsPictureInPicture
        nativeControls
      />
    </TouchableOpacity>
  );
};

// ─── Component ───────────────────────────────────────────────────────
export default function ChatRoomScreen() {
  const insets = useSafeAreaInsets();
  const { roomId: roomIdParam } = useLocalSearchParams<{ roomId: string }>();
  const roomId = Number(roomIdParam);
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { userSession } = useAppSelector((state) => state.auth);
  const reduxMessages = useAppSelector(selectMessages) as MessageResponse[];
  const recalledMessageIds = useAppSelector(selectRecalledMessageIds) as string[];
  const typingUsers = useAppSelector(selectTypingUsers(roomId)) as TypingUser[];

  // ── Core state ────────────────────────────────────────────
  const [room, setRoom] = useState<RoomResponse | null>(null);
  const [historyMessages, setHistoryMessages] = useState<MessageResponse[]>([]);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [isSending, setIsSending] = useState(false);

  // ── Action sheet ──────────────────────────────────────────
  const [actionTarget, setActionTarget] = useState<MessageResponse | null>(null);

  // ── Reply ─────────────────────────────────────────────────
  const [replyTarget, setReplyTarget] = useState<MessageResponse | null>(null);

  // ── Edit ──────────────────────────────────────────────────
  const [editTarget, setEditTarget] = useState<{ id: string; originalContent: string } | null>(null);

  // ── Forward ───────────────────────────────────────────────
  const [forwardTarget, setForwardTarget] = useState<MessageResponse | null>(null);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [isAttachmentSheetVisible, setIsAttachmentSheetVisible] = useState(false);
  const [pinnedMessages, setPinnedMessages] = useState<MessageResponse[]>([]);
  const [showPinnedList, setShowPinnedList] = useState(false);
  const [showCreatePollModal, setShowCreatePollModal] = useState(false);
  const [isCreatingPoll, setIsCreatingPoll] = useState(false);
  const [showGroupManagementModal, setShowGroupManagementModal] = useState(false);
  const [groupSummary, setGroupSummary] = useState<GroupMessageSummaryResponse | null>(null);
  const [isLoadingGroupSummary, setIsLoadingGroupSummary] = useState(false);
  const [isSummaryDismissed, setIsSummaryDismissed] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const isInitialLoad = useRef(true);
  const pinnedRetryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Fetch room info ───────────────────────────────────────
  const fetchRoom = useCallback(async () => {
    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        setTimeout(resolve, ms);
      });

    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const res = await getCurrentUserRoomsApi({ page: 1, size: 100 });
        const found = res.data.data.content.find((r) => r.roomId === roomId);
        if (found) {
          setRoom(found);
        }
        return;
      } catch (err: any) {
        const status = err?.response?.status;
        if (status === 429 && attempt < 2) {
          await wait((attempt + 1) * 700);
          continue;
        }
        console.error("[ChatRoom] Failed to fetch room:", err);
        return;
      }
    }
  }, [roomId]);

  useEffect(() => {
    void fetchRoom();
  }, [fetchRoom]);

  // ── WS enter/leave room ───────────────────────────────────
  useEffect(() => {
    dispatch(setCurrentRoom(roomId));
    SocketManager.enterRoom(roomId);
    return () => {
      SocketManager.leaveRoom();
      dispatch(setCurrentRoom(null));
    };
  }, [roomId, dispatch]);

  // ── Typing auto-expire ─────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      dispatch(expireStaleTyping({ roomId, maxAgeMs: 6000 }));
    }, 3000);
    return () => clearInterval(interval);
  }, [roomId, dispatch]);

  // ── History messages ──────────────────────────────────────
  const fetchMessages = useCallback(
    async (beforeId?: string, append = false) => {
      try {
        if (append) setIsLoadingMore(true);
        else setIsLoadingMessages(true);

        const response = await getHistoryMessagesApi(roomId, beforeId, 20);
        const hist = response.data.data;

        if (append) {
          setHistoryMessages((prev) => {
            const ids = new Set(prev.map((m) => String(m.id)));
            const unique = hist.messageResponses.filter((m) => !ids.has(String(m.id)));
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

  const fetchPinnedMessages = useCallback(async () => {
    if (room?.roomType !== "GROUP") {
      setPinnedMessages([]);
      return;
    }

    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        setTimeout(resolve, ms);
      });

    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const res = await getPinnedMessagesApi(roomId);
        if (pinnedRetryTimeoutRef.current) {
          clearTimeout(pinnedRetryTimeoutRef.current);
          pinnedRetryTimeoutRef.current = null;
        }
        setPinnedMessages(res.data.data || []);
        return;
      } catch (err: any) {
        const status = err?.response?.status;
        if (status === 429 && attempt < 2) {
          await wait((attempt + 1) * 700);
          continue;
        }
        if (status === 429) {
          if (!pinnedRetryTimeoutRef.current) {
            pinnedRetryTimeoutRef.current = setTimeout(() => {
              pinnedRetryTimeoutRef.current = null;
              void fetchPinnedMessages();
            }, 2200);
          }
          return;
        }
        console.error("[ChatRoom] Failed to fetch pinned messages:", err);
        return;
      }
    }
  }, [room?.roomType, roomId]);

  useEffect(() => {
    fetchPinnedMessages();
  }, [fetchPinnedMessages]);

  useEffect(() => {
    setIsSummaryDismissed(false);
  }, [roomId]);

  useEffect(() => {
    let isMounted = true;

    if (room?.roomType !== "GROUP") {
      setGroupSummary(null);
      setIsLoadingGroupSummary(false);
      return () => {
        isMounted = false;
      };
    }

    setIsLoadingGroupSummary(true);
    getGroupMessageSummaryApi(roomId)
      .then((res) => {
        if (!isMounted) return;
        const payload = res.data?.data ?? null;
        setGroupSummary(payload);
      })
      .catch(() => {
        if (!isMounted) return;
        setGroupSummary(null);
      })
      .finally(() => {
        if (!isMounted) return;
        setIsLoadingGroupSummary(false);
      });

    return () => {
      isMounted = false;
    };
  }, [room?.roomType, roomId]);

  useEffect(() => {
    return () => {
      if (pinnedRetryTimeoutRef.current) {
        clearTimeout(pinnedRetryTimeoutRef.current);
        pinnedRetryTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const upsertCurrentRoom = (nextRoom?: RoomResponse | null) => {
      if (!nextRoom || typeof nextRoom.roomId !== "number") return;
      if (nextRoom.roomId === roomId) {
        setRoom(nextRoom);
      }
    };
    const dispatchSystemMessage = (systemMessage: MessageResponse | undefined, targetRoomId: number) => {
      if (!systemMessage || targetRoomId !== roomId) return;
      dispatch(
        messageCreated({
          chatEventType: "MESSAGE_CREATED",
          messageResponse: systemMessage,
        })
      );
    };

    const unsubs = [
      SocketManager.on("ROOM_UPDATED", (ev: RoomUpdatedEventPayload) => {
        upsertCurrentRoom(ev.roomResponse);
        dispatchSystemMessage(ev.systemMessage, ev.roomResponse.roomId);
      }),
      SocketManager.on("ROOM_MEMBER_ADDED", (ev: RoomMemberAddedEventPayload) => {
        upsertCurrentRoom(ev.roomResponse);
        dispatchSystemMessage(ev.systemMessage, ev.roomResponse.roomId);
      }),
      SocketManager.on("ROOM_MEMBER_ROLE_CHANGED", (ev: RoomMemberRoleChangedEventPayload) => {
        upsertCurrentRoom(ev.roomResponse);
        dispatchSystemMessage(ev.systemMessage, ev.roomResponse.roomId);
      }),
      SocketManager.on("ROOM_MEMBER_REMOVED", (ev: RoomMemberRemovedEventPayload) => {
        if (!ev?.roomResponse || ev.roomResponse.roomId !== roomId) return;
        if (ev.targetUserId === userSession?.id) {
          Alert.alert("Thông báo", "Bạn đã bị xóa khỏi nhóm.");
          router.replace("/(app)/messages");
          return;
        }
        setRoom(ev.roomResponse);
        dispatchSystemMessage(ev.systemMessage, ev.roomResponse.roomId);
      }),
      SocketManager.on("ROOM_DELETED", (ev: RoomDeletedEventPayload) => {
        if (Number(ev?.roomId) !== roomId) return;
        Alert.alert("Thông báo", "Nhóm chat đã được giải tán.");
        router.replace("/(app)/messages");
      }),
      SocketManager.on("MESSAGE_EVENT", (ev: any) => {
        if (!ev || ev.chatEventType !== "MESSAGE_UPDATED") return;
        const updated = ev.messageResponse as MessageResponse | undefined;
        if (!updated || Number(updated.roomId) !== roomId) return;

        setPinnedMessages((prev) => {
          const idx = prev.findIndex((msg) => String(msg.id) === String(updated.id));

          if (!updated.isActive || !updated.isPinned) {
            if (idx === -1) return prev;
            return prev.filter((msg) => String(msg.id) !== String(updated.id));
          }

          if (idx !== -1) {
            const next = [...prev];
            next[idx] = { ...next[idx], ...updated };
            return next.sort((a, b) => {
              const aTime = new Date(a.pinnedAt || a.createdAt).getTime();
              const bTime = new Date(b.pinnedAt || b.createdAt).getTime();
              return bTime - aTime;
            });
          }

          // Newly pinned message may not be in current history slice -> refetch pinned list.
          void fetchPinnedMessages();
          return prev;
        });
      }),
    ];

    return () => {
      unsubs.forEach((unsub) => unsub());
    };
  }, [dispatch, fetchPinnedMessages, roomId, router, userSession?.id]);

  // ── Merge history + redux, apply recalls + updates ────────
  const messages = useMemo(() => {
    const recalledIds = new Set(recalledMessageIds);
    const updatedHistory = historyMessages.map((m) =>
      recalledIds.has(m.id) ? { ...m, isActive: false } : m
    );
    const historyIds = new Set(historyMessages.map((m) => String(m.id)));
    const historyClientIds = new Set(
      historyMessages.map((m) => (m.clientMsgId ? String(m.clientMsgId) : ""))
    );

    const newFromRedux = reduxMessages.filter(
      (m) =>
        !historyIds.has(String(m.id)) &&
        (!m.clientMsgId || !historyClientIds.has(String(m.clientMsgId)))
    );

    // Apply MESSAGE_UPDATED from redux into history
    const reduxById = new Map(reduxMessages.map((m) => [String(m.id), m]));
    const merged = updatedHistory.map((m) => {
      const updated = reduxById.get(String(m.id));
      return updated ? { ...m, ...updated } : m;
    });

    merged.push(...newFromRedux);

    merged.sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      if (timeA !== timeB) return timeB - timeA;
      return String(b.id).localeCompare(String(a.id));
    });

    return merged;
  }, [historyMessages, reduxMessages, recalledMessageIds]);

  useEffect(() => {
    if (room?.roomType !== "GROUP") return;
    setPinnedMessages((prev) => {
      const map = new Map(prev.map((msg) => [String(msg.id), msg]));
      let hasChanges = false;

      messages.forEach((msg) => {
        const id = String(msg.id);
        if (!msg.isActive || !msg.isPinned) {
          if (map.delete(id)) hasChanges = true;
          return;
        }
        const current = map.get(id);
        if (!current || JSON.stringify(current) !== JSON.stringify(msg)) {
          map.set(id, { ...(current || {}), ...msg });
          hasChanges = true;
        }
      });

      if (!hasChanges) return prev;
      return Array.from(map.values()).sort((a, b) => {
        const aTime = new Date(a.pinnedAt || a.createdAt).getTime();
        const bTime = new Date(b.pinnedAt || b.createdAt).getTime();
        return bTime - aTime;
      });
    });
  }, [messages, room?.roomType]);

  // ── Mark as read ──────────────────────────────────────────
  useEffect(() => {
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      markAsReadApi({ lastReadMessageId: lastMsg.id, roomId }).catch(() => {});
    }
  }, [messages, roomId]);

  const handleLoadMore = () => {
    if (hasMoreMessages && !isLoadingMore && messages.length > 0) {
      fetchMessages(messages[messages.length - 1].id, true);
    }
  };

  // ── Send / Edit ───────────────────────────────────────────
  const handleSend = async () => {
    const text = messageText.trim();
    if (!text || isSending) return;
    if (!Number.isFinite(roomId) || roomId <= 0) {
      Alert.alert("Lỗi", "Room chat không hợp lệ.");
      return;
    }

    // ── EDIT MODE ──
    if (editTarget) {
      setIsSending(true);
      setMessageText("");
      const snapshot = editTarget;
      setEditTarget(null);
      try {
        const res = await editMessageApi(snapshot.id, { content: text });
        const updated = res.data.data;
        // update history
        setHistoryMessages((prev) =>
          prev.map((m) => (String(m.id) === String(snapshot.id) ? { ...m, ...updated } : m))
        );
        // update redux
        dispatch(messageUpdated({ chatEventType: "MESSAGE_UPDATED", messageResponse: updated }));
      } catch (err: any) {
        Alert.alert("Lỗi", err?.response?.data?.errorMessage || "Không thể chỉnh sửa.");
        setMessageText(text);
        setEditTarget(snapshot);
      } finally {
        setIsSending(false);
      }
      return;
    }

    // ── SEND MODE ──
    const payload = {
      content: text,
      clientMsgId: generateUUID(),
      type: "TEXT" as const,
      roomId,
      repliedMessageId: replyTarget?.id ?? null,
    };

    setIsSending(true);
    setMessageText("");
    setReplyTarget(null);

    try {
      if (SocketManager.isConnected()) {
        try {
          await SocketManager.sendMessage(roomId, {
            content: payload.content,
            clientMsgId: payload.clientMsgId,
            type: payload.type,
          });
          return;
        } catch {
          // fallback to REST
        }
      }
      const res = await sendMessageApi(payload);
      setHistoryMessages((prev) => addUniqueMessage(prev, res.data.data as MessageResponse));
    } catch (error: any) {
      const apiMessage =
        error?.response?.data?.message ||
        error?.response?.data?.errorMessage ||
        error?.message;
      Alert.alert("Lỗi", apiMessage ? `Không thể gửi: ${apiMessage}` : "Không thể gửi tin nhắn.");
      setMessageText(text);
    } finally {
      setIsSending(false);
    }
  };

  // ── Attachments ───────────────────────────────────────────
  const uploadAttachment = async (type: AttachmentAction) => {
    if (type === "poll") {
      setShowCreatePollModal(true);
      return;
    }

    try {
      if (type === "image") {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.All,
          allowsMultipleSelection: true,
          quality: 0.8,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
          setIsSending(true);
          try {
            const imageAssets = result.assets.filter(a => a.type === "image" || (!a.type?.includes("video") && a.type !== "video"));
            const videoAssets = result.assets.filter(a => a.type === "video" || a.type?.includes("video"));

            // Upload videos individually
            for (const asset of videoAssets) {
              const formData = new FormData();
              const messageRequest = {
                content: "video",
                clientMsgId: generateUUID(),
                type: "VIDEO",
                roomId,
                repliedMessageId: replyTarget?.id ?? null,
              };

              formData.append("message", {
                string: JSON.stringify(messageRequest),
                type: "application/json"
              } as any);

              formData.append("file", {
                uri: asset.uri,
                name: asset.fileName || `video_${Date.now()}.mp4`,
                type: asset.mimeType || "video/mp4",
              } as any);

              const res = await sendFileMessageApi(formData);
              setHistoryMessages((prev) => addUniqueMessage(prev, res.data.data as MessageResponse));
            }

            // Upload images in batch
            if (imageAssets.length > 0) {
              const formData = new FormData();
              const messageRequest = {
                content: "image",
                clientMsgId: generateUUID(),
                type: "IMAGE",
                roomId,
                repliedMessageId: replyTarget?.id ?? null,
              };

              formData.append("message", {
                string: JSON.stringify(messageRequest),
                type: "application/json"
              } as any);

              imageAssets.forEach((asset) => {
                formData.append("files", {
                  uri: asset.uri,
                  name: asset.fileName || `image_${Date.now()}.jpg`,
                  type: asset.mimeType || "image/jpeg",
                } as any);
              });

              const res = await sendImageBatchMessageApi(formData);
              setHistoryMessages((prev) => addUniqueMessage(prev, res.data.data as MessageResponse));
            }

            setReplyTarget(null);
          } catch (err: any) {
            const errDate = err?.response?.data?.errorMessage || "Không thể tải ảnh/video lên.";
            Alert.alert("Lỗi", errDate);
          } finally {
            setIsSending(false);
          }
        }
      } else {
        const result = await DocumentPicker.getDocumentAsync({
          type: "*/*",
          copyToCacheDirectory: true,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
          const asset = result.assets[0];
          setIsSending(true);
          try {
            const formData = new FormData();
            const messageRequest = {
              content: "file",
              clientMsgId: generateUUID(),
              type: "FILE",
              roomId,
              repliedMessageId: replyTarget?.id ?? null,
            };

            // Force application/json type using React Native's internal FormData specification
            formData.append("message", {
              string: JSON.stringify(messageRequest),
              type: "application/json"
            } as any);

            formData.append("file", {
              uri: asset.uri,
              name: asset.name,
              type: asset.mimeType || "application/octet-stream",
            } as any);

            const res = await sendFileMessageApi(formData);
            setHistoryMessages((prev) => addUniqueMessage(prev, res.data.data as MessageResponse));
            setReplyTarget(null);
          } catch (err: any) {
            const errMsg = err?.response?.data?.errorMessage || "Không thể gửi file.";
            Alert.alert("Lỗi", errMsg);
          } finally {
            setIsSending(false);
          }
        }
      }
    } catch {
      Alert.alert("Lỗi", "Không thể mở bộ chọn tệp.");
    }
  };

  // ── Typing ────────────────────────────────────────────────
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleTextChange = (text: string) => {
    setMessageText(text);
    if (text.length > 0) {
      SocketManager.sendTyping(roomId, true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => SocketManager.sendTyping(roomId, false), 3000);
    } else {
      SocketManager.sendTyping(roomId, false);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    }
  };

  // ── Action handlers ───────────────────────────────────────
  const isCurrentUser = (senderId: number) => senderId === userSession?.id;

  const getSenderInfo = (senderId: number) => {
    if (!room) return { name: "Unknown", avatar: undefined };
    const p = room.participants.find((p) => p.userId === senderId);
    return { name: p?.name || "Unknown", avatar: p?.avatarUrl };
  };

  const getSenderName = (senderId: number) => getSenderInfo(senderId).name;

  const getMessagePreview = (message: MessageResponse): string => {
    if (!message.isActive) return "Tin nhắn đã thu hồi";
    switch (message.type) {
      case "IMAGE":
        return "📷 Hình ảnh";
      case "VIDEO":
        return "🎬 Video";
      case "FILE":
        return "📎 Tệp đính kèm";
      case "WEATHER":
        return "🌤 Thời tiết";
      case "POLL":
        return `📊 ${message.poll?.question || "Bình chọn"}`;
      case "TEXT":
      default:
        return message.content || "";
    }
  };

  const updateMessageLocally = (updated: MessageResponse) => {
    setHistoryMessages((prev) =>
      prev.map((msg) => (String(msg.id) === String(updated.id) ? { ...msg, ...updated } : msg))
    );
    dispatch(messageUpdated({ chatEventType: "MESSAGE_UPDATED", messageResponse: updated }));
  };

  const scrollToPinnedMessage = (messageId: string) => {
    const index = messages.findIndex((msg) => String(msg.id) === String(messageId));
    if (index === -1) {
      Alert.alert("Thông báo", "Tin nhắn ghim chưa có trong vùng lịch sử đã tải.");
      return;
    }
    flatListRef.current?.scrollToIndex({ index, animated: true });
    setShowPinnedList(false);
  };

  const handleCreatePoll = async (
    question: string,
    options: string[],
    allowMultiple: boolean
  ) => {
    if (isCreatingPoll) return;
    setIsCreatingPoll(true);
    try {
      const res = await createPollMessageApi({
        roomId,
        clientMsgId: generateUUID(),
        question,
        options,
        allowMultiple,
        repliedMessageId: replyTarget?.id ?? null,
      });
      setHistoryMessages((prev) => addUniqueMessage(prev, res.data.data as MessageResponse));
      setReplyTarget(null);
      setShowCreatePollModal(false);
    } catch (error: any) {
      Alert.alert("Lỗi", error?.response?.data?.errorMessage || "Không thể tạo bình chọn.");
    } finally {
      setIsCreatingPoll(false);
    }
  };

  const handleMessageAction = async (action: MessageAction) => {
    const msg = actionTarget;
    if (!msg) return;

    switch (action) {
      case "reply":
        setReplyTarget(msg);
        setEditTarget(null);
        break;

      case "edit":
        setEditTarget({ id: msg.id, originalContent: msg.content ?? "" });
        setMessageText(msg.content ?? "");
        setReplyTarget(null);
        break;

      case "forward":
        setForwardTarget(msg);
        setShowForwardModal(true);
        break;

      case "deleteForMe":
        Alert.alert(
          "Xóa tin nhắn",
          "Tin nhắn sẽ bị ẩn chỉ phía bạn. Bạn chắc chắn?",
          [
            { text: "Hủy", style: "cancel" },
            {
              text: "Xóa",
              style: "destructive",
              onPress: async () => {
                // optimistic remove
                setHistoryMessages((prev) =>
                  prev.filter((m) => String(m.id) !== String(msg.id))
                );
                dispatch(messageDeletedForMe(msg.id));
                try {
                  await deleteMessageForMeApi(msg.id);
                } catch {
                  // revert if fail by refetching
                  fetchMessages();
                }
              },
            },
          ]
        );
        break;

      case "recall":
        Alert.alert("Thu hồi tin nhắn", "Tin nhắn sẽ bị thu hồi với tất cả mọi người.", [
          { text: "Hủy", style: "cancel" },
          {
            text: "Thu hồi",
            style: "destructive",
            onPress: async () => {
              try {
                await recallMessageApi(msg.id);
                setHistoryMessages((prev) =>
                  prev.map((m) =>
                    String(m.id) === String(msg.id) ? { ...m, isActive: false } : m
                  )
                );
              } catch (err: any) {
                Alert.alert("Lỗi", err?.response?.data?.errorMessage || "Không thể thu hồi.");
              }
            },
          },
        ]);
        break;

      case "pin":
        try {
          const res = await pinMessageApi(msg.id);
          updateMessageLocally(res.data.data);
          fetchPinnedMessages();
        } catch (error: any) {
          Alert.alert("Lỗi", error?.response?.data?.errorMessage || "Không thể ghim tin nhắn.");
        }
        break;

      case "unpin":
        try {
          const res = await unpinMessageApi(msg.id);
          updateMessageLocally(res.data.data);
          setPinnedMessages((prev) => prev.filter((item) => String(item.id) !== String(msg.id)));
        } catch (error: any) {
          Alert.alert("Lỗi", error?.response?.data?.errorMessage || "Không thể bỏ ghim tin nhắn.");
        }
        break;
    }
    setActionTarget(null);
  };

  // ── UI helpers ────────────────────────────────────────────
  const otherUsersTyping = typingUsers.filter(
    (u) => u.userId !== userSession?.id && u.isTyping
  );
  const directPeer = room?.participants.find((p) => p.userId !== userSession?.id);
  const roomName = room ? getRoomDisplayName(room, userSession) : "...";
  const roomAvatar = room ? getRoomAvatar(room, userSession) : undefined;
  const isOnline = room ? isOtherParticipantOnline(room, userSession) : false;
  const latestPinned = pinnedMessages[0];

  const openCall = (callType: "AUDIO" | "VIDEO") => {
    // GROUP room: gọi cả phòng, không gửi targetUserId
    if (room?.roomType === "GROUP") {
      router.push({
        pathname: "/(app)/messages/call/[roomId]",
        params: {
          roomId: String(roomId),
          mode: "outgoing",
          callType,
          isGroup: "true",
        },
      });
      return;
    }

    // DIRECT room: gọi 1-1
    if (!directPeer) {
      Alert.alert("Thông báo", "Không tìm thấy người nhận cuộc gọi.");
      return;
    }

    router.push({
      pathname: "/(app)/messages/call/[roomId]",
      params: {
        roomId: String(roomId),
        mode: "outgoing",
        callType,
        targetUserId: String(directPeer.userId),
        targetName: directPeer.name,
      },
    });
  };

  // ── Render one message ────────────────────────────────────
  const renderMessage = ({ item }: { item: MessageResponse }) => {
    const isMine = isCurrentUser(item.senderId);
    const sender = getSenderInfo(item.senderId);
    const time = formatMessageTime(item.createdAt);
    const bubbleMaxWidthClass = item.type === "POLL" ? "max-w-[92%]" : "max-w-[75%]";

    // SYSTEM
    if (item.type === "SYSTEM") {
      return (
        <View className="items-center my-3 px-4">
          <View className="px-4 py-1.5 rounded-full bg-black/5">
            <Text className="text-xs font-medium text-black/40">{item.content}</Text>
          </View>
        </View>
      );
    }

    // Recalled
    if (!item.isActive) {
      return (
        <TouchableOpacity
          onLongPress={() => setActionTarget(item)}
          delayLongPress={400}
          className={`my-2 px-4 ${isMine ? "items-end" : "items-start"}`}
        >
          <View className="px-5 py-3 rounded-[24px] bg-black/5 border border-black/10 border-dashed">
            <Text className="text-[14px] italic text-black/50">Tin nhắn đã thu hồi</Text>
          </View>
        </TouchableOpacity>
      );
    }

    // Forwarded label
    const forwardedLabel = item.isForwarded ? (
      <Text style={{ fontSize: 10, color: GRAY, marginBottom: 3, fontStyle: "italic" }}>
        ➤ Đã chuyển tiếp
      </Text>
    ) : null;

    // Replied bubble (nested snapshot)
    const repliedBubble =
      item.repliedMessage ? (
        <RepliedMessageBubble
          replied={item.repliedMessage as RepliedMessageSnapshot}
          senderName={getSenderName(item.repliedMessage.senderId)}
          isMine={isMine}
        />
      ) : null;

    // Bubble content
    let bubbleContent: React.ReactNode;

    if (item.type === "IMAGE") {
      const urls = item.mediaUrls ?? (item.content ? [item.content] : []);
      bubbleContent = (
        <MultiImageGrid
          urls={urls}
          onLongPress={() => setActionTarget(item)}
        />
      );
    } else if (item.type === "VIDEO") {
      const url = item.content;
      if (url) {
        bubbleContent = <MessageVideoPlayer url={url} onLongPress={() => setActionTarget(item)} />;
      } else {
        bubbleContent = <Text style={{ color: GRAY, fontStyle: "italic" }}>Video lỗi</Text>;
      }
    } else if (item.type === "FILE") {
      const url = item.content;
      bubbleContent = (
        <TouchableOpacity 
          style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
          onLongPress={() => setActionTarget(item)}
          onPress={() => {
            if (url) {
              Linking.openURL(url).catch(() => Alert.alert("Lỗi", "Không thể mở tệp này."));
            } else {
              Alert.alert("Lỗi", "Đường dẫn không hợp lệ.");
            }
          }}
        >
          <Text style={{ fontSize: 20 }}>📎</Text>
          <Text style={{ fontSize: 14, color: isMine ? "#fff" : "#111827", maxWidth: 160 }} numberOfLines={2}>
            {getFileLabel(item)}
          </Text>
        </TouchableOpacity>
      );
    } else if (item.type === "POLL") {
      bubbleContent = (
        <MessagePoll
          message={item}
          currentUserId={userSession?.id}
          isMine={isMine}
          onMessageUpdated={updateMessageLocally}
        />
      );
    } else {
      bubbleContent = (
        <Text
          className={`text-[15px] ${isMine ? "text-primary-foreground font-medium" : "text-foreground font-medium"}`}
        >
          {item.content}
        </Text>
      );
    }

    // Edited badge
    const editedBadge = item.isEdited ? (
      <Text style={{ fontSize: 10, color: isMine ? "rgba(255,255,255,0.65)" : GRAY, marginTop: 2 }}>
        đã chỉnh sửa
      </Text>
    ) : null;

    return (
      <TouchableOpacity
        onLongPress={() => setActionTarget(item)}
        delayLongPress={400}
        activeOpacity={0.85}
        className={`my-2 px-4 w-full flex-row ${isMine ? "justify-end" : "justify-start"}`}
      >
        {/* Received Avatar */}
        {!isMine && (
          <View className="justify-end pb-5 mr-2">
            {sender.avatar ? (
              <Image source={{ uri: sender.avatar }} className="w-8 h-8 rounded-full" />
            ) : (
              <View className="w-8 h-8 rounded-full bg-primary/10 items-center justify-center">
                <Users size={14} color={PRIMARY} />
              </View>
            )}
          </View>
        )}

        <View className={`${bubbleMaxWidthClass} ${isMine ? "items-end" : "items-start"}`}>
          {forwardedLabel}

        <View
          className={`shadow-sm ${
            isMine
              ? "bg-primary rounded-[24px] rounded-br-[6px]"
              : "bg-secondary/60 rounded-[24px] rounded-bl-[6px]"
          }`}
          style={[
            item.type === "IMAGE" || item.type === "VIDEO"
              ? { padding: 4, borderRadius: 18 }
              : { paddingHorizontal: 16, paddingVertical: 12 },
            // Ensure the bubble is wide enough to show the replied preview
            item.repliedMessage ? { minWidth: 220 } : undefined,
          ]}
        >
            {repliedBubble}
            {bubbleContent}
            {editedBadge}
          </View>

          {/* Timestamp */}
          <View className={`flex-row items-center mt-1.5 ${isMine ? "justify-end" : "justify-start px-2"}`}>
            {item.isPinned && (
              <Text className="text-[11px] mr-1" style={{ color: "#F59E0B" }}>
                📌
              </Text>
            )}
            <Text className="text-[11px] font-medium text-muted-foreground mr-1">{time}</Text>
            {isMine && <Text className="text-[10px] text-primary font-bold">✓✓</Text>}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // ── Header status ─────────────────────────────────────────
  let headerStatusNode: React.ReactNode = null;
  if (otherUsersTyping.length > 0) {
    headerStatusNode = (
      <Text className="text-[12px] font-medium text-primary mt-0.5">
        {otherUsersTyping[0].name} đang nhập...
      </Text>
    );
  } else if (isOnline) {
    headerStatusNode = (
      <Text className="text-[11px] font-semibold text-muted-foreground mt-0.5 tracking-wide uppercase">
        ONLINE
      </Text>
    );
  }

  // ── Input label (edit/reply mode) ─────────────────────────
  const isEditMode = !!editTarget;
  const cancelComposerState = () => {
    setEditTarget(null);
    setReplyTarget(null);
    setMessageText("");
  };

  // ── Render ────────────────────────────────────────────────
  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        enabled={!showCreatePollModal}
      >
        {/* ── Header ── */}
        <View className="flex-row items-center px-4 py-3 bg-card border-b border-border shadow-sm">
          <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2 mr-2">
            <ArrowLeft size={24} color={GRAY} />
          </TouchableOpacity>

          <View className="relative">
            {roomAvatar ? (
              <Image source={{ uri: roomAvatar }} className="w-10 h-10 rounded-full" />
            ) : (
              <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center">
                <Users size={18} color={PRIMARY} />
              </View>
            )}
            {isOnline && (
              <View className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
            )}
          </View>

          <View className="flex-1 ml-3 px-1">
            <Text className="font-bold text-[16px] text-foreground" numberOfLines={1}>
              {roomName}
            </Text>
            {headerStatusNode}
          </View>

          <TouchableOpacity className="p-2" onPress={() => openCall("AUDIO")}>
            <Phone size={22} color={GRAY} />
          </TouchableOpacity>
          <TouchableOpacity className="p-2" onPress={() => openCall("VIDEO")}>
            <Video size={22} color={GRAY} />
          </TouchableOpacity>
          {room?.roomType === "GROUP" && (
            <TouchableOpacity
              className="p-2"
              onPress={() => setShowGroupManagementModal(true)}
            >
              <Settings size={22} color={GRAY} />
            </TouchableOpacity>
          )}
        </View>

        {room?.roomType === "GROUP" && pinnedMessages.length > 0 && (
          <View style={{ borderBottomWidth: 1, borderBottomColor: "#E5E7EB", backgroundColor: "#FFFFFF" }}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setShowPinnedList((prev) => !prev)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 14,
                paddingVertical: 9,
              }}
            >
              <Pin size={16} color="#F59E0B" />
              <View style={{ flex: 1, marginLeft: 10 }}>
                {pinnedMessages.length > 1 ? (
                  <Text style={{ fontSize: 13, fontWeight: "700", color: "#111827" }}>
                    {pinnedMessages.length} tin nhắn đã ghim
                  </Text>
                ) : null}
                <Text style={{ fontSize: 12, color: "#6B7280" }} numberOfLines={1}>
                  {latestPinned ? getMessagePreview(latestPinned) : ""}
                </Text>
              </View>
              {showPinnedList ? (
                <ChevronUp size={16} color="#6B7280" />
              ) : (
                <ChevronDown size={16} color="#6B7280" />
              )}
            </TouchableOpacity>

            {showPinnedList && (
              <View style={{ borderTopWidth: 1, borderTopColor: "#F3F4F6", maxHeight: 220 }}>
                <FlatList
                  data={pinnedMessages}
                  keyExtractor={(item) => `pinned-${item.id}`}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() => scrollToPinnedMessage(item.id)}
                      style={{
                        paddingHorizontal: 14,
                        paddingVertical: 10,
                        borderBottomWidth: StyleSheet.hairlineWidth,
                        borderBottomColor: "#F3F4F6",
                        flexDirection: "row",
                        alignItems: "center",
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 12, fontWeight: "600", color: "#111827" }} numberOfLines={1}>
                          {getSenderName(item.senderId)}
                        </Text>
                        <Text style={{ fontSize: 12, color: "#6B7280" }} numberOfLines={1}>
                          {getMessagePreview(item)}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={async (event) => {
                          event.stopPropagation();
                          try {
                            const res = await unpinMessageApi(item.id);
                            updateMessageLocally(res.data.data);
                            setPinnedMessages((prev) =>
                              prev.filter((entry) => String(entry.id) !== String(item.id))
                            );
                          } catch (error: any) {
                            Alert.alert(
                              "Lỗi",
                              error?.response?.data?.errorMessage ||
                                "Không thể bỏ ghim tin nhắn."
                            );
                          }
                        }}
                        style={{
                          marginLeft: 8,
                          paddingHorizontal: 8,
                          paddingVertical: 6,
                          borderRadius: 8,
                          backgroundColor: "#FEF2F2",
                        }}
                      >
                        <Text style={{ color: "#DC2626", fontSize: 12, fontWeight: "600" }}>
                          Bỏ ghim
                        </Text>
                      </TouchableOpacity>
                    </TouchableOpacity>
                  )}
                />
              </View>
            )}
          </View>
        )}

        {room?.roomType === "GROUP" &&
          !isSummaryDismissed &&
          (isLoadingGroupSummary || groupSummary?.summary) && (
          <View
            style={{
              marginHorizontal: 12,
              marginTop: 10,
              marginBottom: 4,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: "#F5D0FE",
              backgroundColor: "#FDF4FF",
              paddingHorizontal: 12,
              paddingVertical: 10,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
              <Sparkles size={14} color="#C026D3" />
              <Text
                style={{
                  marginLeft: 6,
                  fontSize: 12,
                  fontWeight: "700",
                  color: "#A21CAF",
                  flex: 1,
                }}
              >
                Tóm tắt AI (20 tin nhắn gần nhất)
              </Text>
              <TouchableOpacity
                onPress={() => setIsSummaryDismissed(true)}
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#F5D0FE",
                }}
              >
                <X size={13} color="#A21CAF" />
              </TouchableOpacity>
            </View>

            {isLoadingGroupSummary ? (
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <ActivityIndicator size="small" color="#C026D3" />
                <Text style={{ marginLeft: 8, fontSize: 12, color: "#6B7280" }}>
                  AI đang tóm tắt cuộc trò chuyện...
                </Text>
              </View>
            ) : (
              <Text style={{ fontSize: 13, lineHeight: 19, color: "#3F3F46" }}>
                {groupSummary?.summary}
              </Text>
            )}
          </View>
        )}

        {/* ── Messages ── */}
        {isLoadingMessages ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={PRIMARY} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            inverted
            keyExtractor={(item, index) => item.id || `msg-${index}`}
            renderItem={renderMessage}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingVertical: 12 }}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.2}
            scrollEventThrottle={200}
            ListHeaderComponent={
              isLoadingMore ? (
                <View className="py-3 items-center">
                  <ActivityIndicator size="small" color={PRIMARY} />
                </View>
              ) : null
            }
            ListEmptyComponent={
              <View className="items-center px-8">
                <Text className="text-[15px] text-muted-foreground text-center">
                  Hãy gửi tin nhắn đầu tiên 👋
                </Text>
              </View>
            }
          />
        )}

        {/* ── Editing Banner ── */}
        {isEditMode && (
          <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#FFF7ED", paddingHorizontal: 14, paddingVertical: 8, borderTopWidth: 1, borderTopColor: "#FED7AA" }}>
            <Check size={14} color="#F97316" />
            <Text style={{ flex: 1, marginLeft: 8, fontSize: 13, color: "#92400E" }}>
              Đang chỉnh sửa tin nhắn...
            </Text>
            <TouchableOpacity onPress={cancelComposerState}>
              <X size={18} color={GRAY} />
            </TouchableOpacity>
          </View>
        )}

        {/* ── Reply Banner ── */}
        {!isEditMode && replyTarget && (
          <ReplyPreview
            target={replyTarget}
            senderName={getSenderName(replyTarget.senderId)}
            onCancel={() => setReplyTarget(null)}
          />
        )}

        {/* ── Input ── */}
        <View 
          className="flex-row items-end px-4 pt-3 bg-background"
          style={{ paddingBottom: Math.max(insets.bottom, 12) }}
        >
          <View className="flex-1 flex-row items-center bg-card rounded-full px-2 py-1.5 shadow-sm border border-border">
            <TouchableOpacity 
              onPress={() => setIsAttachmentSheetVisible(true)}
              className="w-8 h-8 rounded-full bg-muted-foreground items-center justify-center ml-1"
            >
              <Plus size={18} color="#FFF" />
            </TouchableOpacity>

            <TextInput
              className="flex-1 px-3 text-[15px] text-foreground max-h-[100px]"
              placeholder={isEditMode ? "Nhập nội dung chỉnh sửa..." : "Nhập tin nhắn..."}
              placeholderTextColor={GRAY}
              value={messageText}
              onChangeText={handleTextChange}
              multiline
              blurOnSubmit={false}
              textAlignVertical="center"
            />

            <TouchableOpacity className="p-2">
              <Smile size={20} color={GRAY} />
            </TouchableOpacity>
            {!isEditMode && (
              <TouchableOpacity className="p-2 mr-1">
                <Mic size={20} color={GRAY} />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            onPress={handleSend}
            disabled={!messageText.trim() || isSending}
            className={`w-10 h-10 ml-2 rounded-full items-center justify-center shadow-sm ${
              messageText.trim() ? "bg-primary" : "bg-primary/50"
            }`}
          >
            {isSending ? (
              <ActivityIndicator size={16} color="#fff" />
            ) : (
              <Send size={18} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* ── Action Sheet ── */}
      <MessageActionSheet
        visible={!!actionTarget}
        message={actionTarget}
        isOwnMessage={actionTarget ? isCurrentUser(actionTarget.senderId) : false}
        isGroupRoom={room?.roomType === "GROUP"}
        onAction={handleMessageAction}
        onClose={() => setActionTarget(null)}
      />

      {/* ── Forward Modal ── */}
      <ForwardMessageModal
        visible={showForwardModal}
        message={forwardTarget}
        currentRoomId={roomId}
        currentUserId={userSession?.id}
        onClose={() => {
          setShowForwardModal(false);
          setForwardTarget(null);
        }}
      />

      {/* ── Attachment Sheet ── */}
      <AttachmentActionSheet
        visible={isAttachmentSheetVisible}
        allowPoll={room?.roomType === "GROUP"}
        onClose={() => setIsAttachmentSheetVisible(false)}
        onAction={(action) => uploadAttachment(action)}
      />

      <CreatePollModal
        visible={showCreatePollModal}
        loading={isCreatingPoll}
        onClose={() => {
          if (!isCreatingPoll) setShowCreatePollModal(false);
        }}
        onSubmit={handleCreatePoll}
      />

      {room?.roomType === "GROUP" && userSession?.id ? (
        <GroupManagementModal
          visible={showGroupManagementModal}
          room={room}
          currentUserId={userSession.id}
          onClose={() => setShowGroupManagementModal(false)}
          onRoomUpdated={(updatedRoom) => {
            if (!updatedRoom || typeof updatedRoom.roomId !== "number") {
              return;
            }
            setRoom(updatedRoom);
          }}
          onLeftOrDissolved={() => {
            setShowGroupManagementModal(false);
            router.replace("/(app)/messages");
          }}
        />
      ) : null}
    </SafeAreaView>
  );
}
