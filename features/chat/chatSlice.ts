import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { MessageResponse } from "@/types/chat/message";


// =================================================================
// Event Payload Types (from WebSocket)
// =================================================================
export interface MessageCreatedEventPayload {
  chatEventType: "MESSAGE_CREATED";
  messageResponse: MessageResponse;
}

export interface MessageRecalledEventPayload {
  chatEventType: "MESSAGE_RECALLED";
  messageRecalledResponse: { id: string };
}

export interface ReadStateChangedEvent {
  chatEventType: "READ_STATE_CHANGED";
  roomId: number;
  userId?: number;
  lastReadMessageId: string;
  lastReadAt: string;
}

export interface TypingSignalPayload {
  roomId: number;
  userId: number;
  name: string;
  avatar?: string;
  isTyping: boolean;
}

export interface TypingUser {
  userId: number;
  name: string;
  avatar?: string;
  isTyping: boolean;
  timestamp: number;
}

export interface RoomCreatedEventPayload {
  chatEventType: "ROOM_CREATED";
  roomResponse: import("@/types/chat/room").RoomResponse;
}

export interface RoomUpdatedEventPayload {
  chatEventType: "ROOM_UPDATED";
  roomResponse: import("@/types/chat/room").RoomResponse;
  systemMessage?: MessageResponse;
}

export interface RoomMemberAddedEventPayload {
  chatEventType: "MEMBER_ADDED";
  roomResponse: import("@/types/chat/room").RoomResponse;
  targetUserId: number;
  actorUserId: number;
  systemMessage?: MessageResponse;
}

export interface RoomMemberRemovedEventPayload {
  chatEventType: "MEMBER_REMOVED";
  roomResponse: import("@/types/chat/room").RoomResponse;
  targetUserId: number;
  actorUserId: number;
  systemMessage?: MessageResponse;
}

export interface RoomMemberRoleChangedEventPayload {
  chatEventType: "MEMBER_ROLE_CHANGED";
  roomResponse: import("@/types/chat/room").RoomResponse;
  targetUserId: number;
  oldRole: "OWNER" | "ADMIN" | "MEMBER";
  newRole: "OWNER" | "ADMIN" | "MEMBER";
  actorUserId: number;
  systemMessage?: MessageResponse;
}

// =================================================================
// Typing User Type
// =================================================================
export interface TypingUser {
  userId: number;
  name: string;
  avatar?: string;
  isTyping: boolean;
  timestamp: number;
}

// =================================================================
// State
// =================================================================
export interface ChatState {
  currentRoomId: number | null;
  messages: MessageResponse[];
  recalledMessageIds: string[];
  typingUsers: Record<number, TypingUser[]>;
}

const initialState: ChatState = {
  currentRoomId: null,
  messages: [],
  recalledMessageIds: [],
  typingUsers: {},
};

// =================================================================
// Slice
// =================================================================
const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setCurrentRoom(state, action: PayloadAction<number | null>) {
      const nextRoomId = action.payload;
      
      if (nextRoomId !== null && state.currentRoomId !== nextRoomId) {
          const firstMsg = state.messages[0];
          if (firstMsg && Number(firstMsg.roomId) !== Number(nextRoomId)) {
            state.messages = [];
            state.recalledMessageIds = [];
          }
      }
      
      state.currentRoomId = nextRoomId;
    },

    clearMessages(state) {
      state.messages = [];
      state.recalledMessageIds = [];
    },

    messageCreated(state, action: PayloadAction<MessageCreatedEventPayload>) {
      const message = action.payload.messageResponse;
      const targetRoomId = Number(message.roomId);
      const currentRoomId = Number(state.currentRoomId);

      console.log(`[ChatSlice] Processing message for room ${targetRoomId} (Current: ${currentRoomId})`);

      if (currentRoomId === targetRoomId) {
        const isDuplicate = state.messages.some(
          (m) => String(m.id) === String(message.id) || 
                 (message.clientMsgId && m.clientMsgId === message.clientMsgId)
        );

        if (!isDuplicate) {
          // Immer sẽ tự xử lý việc tạo reference mới cho state.messages
          state.messages.push(message);
          console.log("[ChatSlice] Message pushed to state successfully");
        }
      }
    },

    messageRecalled(state, action: PayloadAction<MessageRecalledEventPayload>) {
      const messageId = action.payload.messageRecalledResponse.id;
      if (!state.recalledMessageIds.includes(messageId)) {
        state.recalledMessageIds.push(messageId);
      }
      const idx = state.messages.findIndex((m) => m.id === messageId);
      if (idx !== -1) {
        state.messages[idx].isActive = false;
      }
    },

    readStateChanged(state, action: PayloadAction<ReadStateChangedEvent>) {
      state.messages.forEach((msg) => {
        if (msg.roomId === action.payload.roomId) {
          // Update lastReadMessageId logic if needed
        }
      });
    },

    userTyping(state, action: PayloadAction<TypingSignalPayload>) {
      const { roomId, userId, name, avatar, isTyping } = action.payload;

      if (!state.typingUsers[roomId]) {
        state.typingUsers[roomId] = [];
      }

      const existingIdx = state.typingUsers[roomId].findIndex(
        (u) => u.userId === userId,
      );

      if (isTyping) {
        const typingUser: TypingUser = {
          userId,
          name,
          avatar,
          isTyping: true,
          timestamp: Date.now(),
        };

        if (existingIdx >= 0) {
          state.typingUsers[roomId][existingIdx] = typingUser;
        } else {
          state.typingUsers[roomId].push(typingUser);
        }
      } else {
        if (existingIdx >= 0) {
          state.typingUsers[roomId].splice(existingIdx, 1);
        }
      }
    },

    clearRoomTyping(state, action: PayloadAction<number>) {
      delete state.typingUsers[action.payload];
    },
  },
});

// =================================================================
// Export
// =================================================================
export const {
  setCurrentRoom,
  clearMessages,
  messageCreated,
  messageRecalled,
  readStateChanged,
  userTyping,
  clearRoomTyping,
} = chatSlice.actions;

export default chatSlice.reducer;

const EMPTY_ARRAY: any[] = [];

// =================================================================
// Selectors
// =================================================================
// Selectors - Use a local type for state to avoid circular dependency with store.ts
export const selectCurrentRoomId = (state: any) => state.chat.currentRoomId;
export const selectMessages = (state: any) => state.chat.messages;
export const selectRecalledMessageIds = (state: any) => state.chat.recalledMessageIds;
export const selectTypingUsers = (roomId: number) => (state: any) => 
  state.chat?.typingUsers?.[roomId] || EMPTY_ARRAY;
