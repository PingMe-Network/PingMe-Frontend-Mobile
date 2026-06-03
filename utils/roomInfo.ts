import type { RoomResponse } from "@/types/chat/room";
import type { CurrentUserSessionResponse } from "@/types/auth";
import {
  ENCRYPTED_TEXT_PREVIEW,
  isEncryptedTextContent,
} from "@/utils/textMessageCrypto";

const formatPreviewLabel = (label: string, preview?: string | null) => {
  return preview ? `${label}: ${preview}` : label;
};

export const getRoomDisplayName = (
  room: RoomResponse,
  userSession: CurrentUserSessionResponse | null
) => {
  if (room.name) return room.name;

  if (room.roomType === "DIRECT" && userSession) {
    const otherParticipant = room.participants.find(
      (p) => p.name !== userSession.name
    );
    return otherParticipant?.name || "Unknown";
  }

  return room.participants[0]?.name || "Unknown";
};

export const getRoomAvatar = (
  room: RoomResponse,
  userSession: CurrentUserSessionResponse | null
) => {
  if (room.roomType === "GROUP") {
    return room.roomImgUrl;
  }

  if (room.roomType === "DIRECT" && userSession) {
    const otherParticipant = room.participants.find(
      (p) => p.name !== userSession.name
    );
    return otherParticipant?.avatarUrl;
  }

  return room.participants[0]?.avatarUrl;
};

export const getLastMessagePreview = (
  room: RoomResponse,
  userSession: CurrentUserSessionResponse | null
) => {
  if (!room.lastMessage) return "Bắt đầu cuộc trò chuyện";

  const senderParticipant = room.participants.find(
    (p) => p.userId === room.lastMessage?.senderId
  );
  const senderName = senderParticipant?.name || "Unknown";

  let messageContent = "";

  switch (room.lastMessage.messageType) {
    case "IMAGE":
      messageContent = "📷 Hình ảnh";
      break;
    case "VIDEO":
      messageContent = "🎬 Video";
      break;
    case "FILE":
      messageContent = "📎 Tệp đính kèm";
      break;
    case "WEATHER":
      messageContent = "🌤 Thời tiết";
      break;
    case "POLL":
      messageContent = "📊 Bình chọn";
      break;
    case "NOTE":
      messageContent = formatPreviewLabel("Ghi chú", room.lastMessage.preview);
      break;
    case "REMINDER":
      messageContent = formatPreviewLabel("Nhắc hẹn", room.lastMessage.preview);
      break;
    case "SYSTEM":
      messageContent = room.lastMessage.preview;
      break;
    case "TEXT":
    default:
      messageContent = isEncryptedTextContent(room.lastMessage.preview)
        ? ENCRYPTED_TEXT_PREVIEW
        : room.lastMessage.preview;
      break;
  }

  if (senderName === userSession?.name) {
    return `Bạn: ${messageContent}`;
  } else {
    return `${senderName}: ${messageContent}`;
  }
};

export const getOtherParticipant = (
  room: RoomResponse,
  userSession: CurrentUserSessionResponse | null
) => {
  if (room.roomType === "DIRECT" && userSession) {
    return room.participants.find((p) => p.userId !== userSession.id);
  }
  return null;
};

export const isOtherParticipantOnline = (
  room: RoomResponse,
  userSession: CurrentUserSessionResponse | null
): boolean => {
  if (room.roomType === "DIRECT" && userSession) {
    const other = room.participants.find((p) => p.userId !== userSession.id);
    return other?.status === "ONLINE";
  }
  return false;
};
