export interface MessageResponse {
  id: string;
  roomId: number;
  clientMsgId: string;
  senderId: number;
  content: string;
  type: "TEXT" | "IMAGE" | "VIDEO" | "FILE" | "SYSTEM" | "WEATHER";
  createdAt: string;
  isActive: boolean;
}

export interface MessageRecalledResponse {
  id: string;
}

export interface HistoryMessageResponse {
  messageResponses: MessageResponse[];
  hasMore: boolean;
  nextBeforeId: string;
}

export interface SendMessageRequest {
  content: string;
  clientMsgId: string;
  type: "TEXT" | "IMAGE" | "VIDEO" | "FILE";
  roomId: number;
}

export interface SendWeatherMessageRequest {
  roomId: number;
  lat: number;
  lon: number;
  clientMsgId: string;
}

export interface ReadStateResponse {
  roomId: number;
  userId: number;
  lastReadMessageId: string | null;
  lastReadAt: string | null;
  unreadCount: number;
}

export interface MarkReadRequest {
  lastReadMessageId: string;
  roomId: number;
}
