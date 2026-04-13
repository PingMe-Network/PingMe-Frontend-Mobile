import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { MessageResponse } from "@/types/chat/message";
import type { RootState } from "@/features/store";

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
      state.currentRoomId = action.payload;
      state.messages = [];
      state.recalledMessageIds = [];
    },

    clearMessages(state) {
      state.messages = [];
      state.recalledMessageIds = [];
    },

    messageCreated(state, action: PayloadAction<MessageCreatedEventPayload>) {
      const message = action.payload.messageResponse;
      if (state.currentRoomId === message.roomId) {
        const isDuplicate = state.messages.some(
          (m) =>
            m.id === message.id ||
            (message.clientMsgId && m.clientMsgId === message.clientMsgId),
        );
        if (!isDuplicate) {
          state.messages.push(message);
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

// =================================================================
// Selectors
// =================================================================
export const selectCurrentRoomId = (state: RootState) =>
  state.chat.currentRoomId;
export const selectMessages = (state: RootState) => state.chat.messages;
export const selectRecalledMessageIds = (state: RootState) =>
  state.chat.recalledMessageIds;
export const selectTypingUsers = (roomId: number) => (state: RootState) =>
  state.chat.typingUsers[roomId] || [];
