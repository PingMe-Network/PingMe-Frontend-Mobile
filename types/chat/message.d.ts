// ======================================================
// REPLIED MESSAGE (nested, not full MessageResponse)
// ======================================================
export interface RepliedMessageSnapshot {
  id: string;
  senderId: number;
  content: string | null;
  type: "TEXT" | "IMAGE" | "VIDEO" | "FILE" | "SYSTEM" | "WEATHER" | "POLL";
  isActive: boolean;
  fileFormat?: string | null;
  mediaUrls?: string[] | null;
  poll?: PollResponse | null;
}

// ======================================================
// FORWARD METADATA
// ======================================================
export interface ForwardMetadata {
  sourceMessageId: string;
  sourceRoomId: number;
  sourceSenderId: number;
}

// ======================================================
// MESSAGE RESPONSE  (server → client)
// ======================================================
export interface MessageResponse {
  id: string;
  roomId: number;
  clientMsgId: string;
  senderId: number;
  content: string | null;
  type: "TEXT" | "IMAGE" | "VIDEO" | "FILE" | "SYSTEM" | "WEATHER" | "POLL";
  createdAt: string;
  isActive: boolean;
  isPinned?: boolean;
  pinnedAt?: string | null;
  pinnedByUserId?: number | null;

  // File / Media
  fileFormat?: string | null;
  mediaUrls?: string[] | null;

  // Replied message
  repliedMessage?: RepliedMessageSnapshot | null;

  // Forward
  isForwarded?: boolean;
  forwardMetadata?: ForwardMetadata | null;

  // Edit
  isEdited?: boolean;
  editedAt?: string | null;
  poll?: PollResponse | null;
}

export interface PollOptionResponse {
  id: string;
  text: string;
  voteCount: number;
  voterIds: number[];
}

export interface PollResponse {
  question: string;
  allowMultiple: boolean;
  expiresAt?: string | null;
  expired: boolean;
  totalVotes: number;
  options: PollOptionResponse[];
}

export interface MessageRecalledResponse {
  id: string;
}

// ======================================================
// HISTORY
// ======================================================
export interface HistoryMessageResponse {
  messageResponses: MessageResponse[];
  hasMore: boolean;
  nextBeforeId: string;
}

// ======================================================
// SEND MESSAGE REQUEST
// ======================================================
export interface SendMessageRequest {
  content: string;
  clientMsgId: string;
  type: "TEXT" | "IMAGE" | "VIDEO" | "FILE";
  roomId: number;
  repliedMessageId?: string | null;
}

export interface SendWeatherMessageRequest {
  roomId: number;
  lat: number;
  lon: number;
  clientMsgId: string;
}

// ======================================================
// FORWARD REQUESTS
// ======================================================
export interface ForwardMessageRequest {
  sourceMessageId: string;
  clientMsgId: string;
  targetRoomId: number;
}

export interface BulkForwardMessageRequest {
  sourceMessageId: string;
  clientMsgId: string;
  targetRoomIds: number[];
}

// ======================================================
// EDIT REQUEST
// ======================================================
export interface EditMessageRequest {
  content: string;
}

export interface CreatePollMessageRequest {
  roomId: number;
  clientMsgId: string;
  question: string;
  options: string[];
  allowMultiple?: boolean;
  expiresAt?: string | null;
  repliedMessageId?: string | null;
}

export interface VotePollRequest {
  optionIds: string[];
}

// ======================================================
// READ STATE
// ======================================================
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
