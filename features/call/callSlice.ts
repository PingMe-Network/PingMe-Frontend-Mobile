import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { CallState, CallType, SignalingPayload } from "@/types/call/call";

const initialState: CallState = {
  status: "idle",
  callType: "AUDIO",
  isInitiator: false,
  isGroup: false,
  activeParticipantCount: 0,
};

type OutgoingCallPayload = {
  roomId: number;
  callSessionId: string;
  callerId: number;
  callType: CallType;
  isGroup: boolean;
  targetUserId?: number; // undefined = group call
};

type IncomingCallPayload = {
  roomId: number;
  callSessionId: string;
  callerId: number;
  callerName: string;
  callType: CallType;
  isGroup: boolean;
  activeParticipantCount: number;
};

const callSlice = createSlice({
  name: "call",
  initialState,
  reducers: {
    startOutgoingCall(state, action: PayloadAction<OutgoingCallPayload>) {
      state.status = "calling";
      state.callType = action.payload.callType;
      state.callSessionId = action.payload.callSessionId;
      state.callerId = action.payload.callerId;
      state.targetUserId = action.payload.targetUserId;
      state.roomId = action.payload.roomId;
      state.isInitiator = true;
      state.isGroup = action.payload.isGroup;
      state.activeParticipantCount = 1;
      state.startTime = undefined;
      state.endTime = undefined;
      state.rejectReason = undefined;
      state.error = undefined;
    },

    receiveIncomingCall(state, action: PayloadAction<IncomingCallPayload>) {
      state.status = "ringing";
      state.callType = action.payload.callType;
      state.callSessionId = action.payload.callSessionId;
      state.callerId = action.payload.callerId;
      state.callerName = action.payload.callerName;
      state.roomId = action.payload.roomId;
      state.targetUserId = undefined;
      state.isInitiator = false;
      state.isGroup = action.payload.isGroup;
      state.activeParticipantCount = action.payload.activeParticipantCount;
      state.startTime = undefined;
      state.endTime = undefined;
      state.rejectReason = undefined;
      state.error = undefined;
    },

    markCallConnected(state) {
      state.status = "connected";
      state.startTime = new Date();
      state.endTime = undefined;
      state.rejectReason = undefined;
    },

    markCallRejected(state, action: PayloadAction<string | undefined>) {
      state.status = "rejected";
      state.rejectReason = action.payload;
      state.endTime = new Date();
    },

    markCallEnded(state) {
      state.status = "ended";
      state.endTime = new Date();
    },

    markCallError(state, action: PayloadAction<string>) {
      state.status = "error";
      state.error = action.payload;
      state.endTime = new Date();
    },

    updateParticipantCount(state, action: PayloadAction<number>) {
      state.activeParticipantCount = action.payload;
    },

    resetCallState() {
      return initialState;
    },

    applySignalingPayload(
      state,
      action: PayloadAction<{ event: SignalingPayload; currentUserId: number }>
    ) {
      const { event, currentUserId } = action.payload;

      if (event.type === "INVITE") {
        const isGroup = event.activeParticipantCount > 2;

        if (event.senderId === currentUserId) {
          // Chính mình gọi đi
          state.status = "calling";
          state.isInitiator = true;
          state.targetUserId = undefined;
        } else {
          // Người khác gọi đến
          state.status = "ringing";
          state.isInitiator = false;
          state.callerId = event.senderId;
          state.callerName = event.senderName;
        }

        state.callType = event.payload?.callType ?? state.callType;
        state.callSessionId = event.callSessionId;
        state.roomId = event.roomId;
        state.isGroup = isGroup;
        state.activeParticipantCount = event.activeParticipantCount;
        state.error = undefined;
        state.rejectReason = undefined;
        return;
      }

      if (event.type === "ACCEPT") {
        state.status = "connected";
        state.activeParticipantCount = event.activeParticipantCount;
        state.startTime = new Date();
        state.endTime = undefined;
        state.error = undefined;
        state.rejectReason = undefined;
        return;
      }

      if (event.type === "REJECT") {
        if (state.isGroup) {
          // Group call: 1 người từ chối không ảnh hưởng call của người khác
          // Chỉ cập nhật count, không đổi status
          return;
        }
        // 1-1: đối phương từ chối → kết thúc
        state.status = "rejected";
        state.rejectReason = event.payload?.reason ?? "REJECTED";
        state.endTime = new Date();
        return;
      }

      if (event.type === "LEAVE") {
        const remaining = event.activeParticipantCount;
        state.activeParticipantCount = remaining;

        // Group call: không auto-end theo LEAVE để tránh văng cả phòng
        // khi backend trả participant count lệch.
        // Kết thúc group call nên dựa vào HANGUP/SESSION_ENDED hoặc user tự rời.
        if (!state.isGroup && remaining <= 1) {
          // 1-1: đối phương rời => kết thúc
          state.status = "ended";
          state.endTime = new Date();
        }
        return;
      }

      if (event.type === "HANGUP") {
        state.status = "ended";
        state.endTime = new Date();
        return;
      }

      if (event.type === "SESSION_ENDED") {
        // Session đã hết trước khi user kịp join
        state.status = "ended";
        state.endTime = new Date();
      }
    },
  },
});

export const {
  startOutgoingCall,
  receiveIncomingCall,
  markCallConnected,
  markCallRejected,
  markCallEnded,
  markCallError,
  updateParticipantCount,
  resetCallState,
  applySignalingPayload,
} = callSlice.actions;

export default callSlice.reducer;
