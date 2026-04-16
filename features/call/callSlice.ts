import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { CallState, CallType, SignalingPayload } from "@/types/call/call";

const initialState: CallState = {
  status: "idle",
  callType: "AUDIO",
  isInitiator: false,
};

type OutgoingCallPayload = {
  roomId: number;
  targetUserId: number;
  callerId: number;
  callType: CallType;
};

type IncomingCallPayload = {
  roomId: number;
  callerId: number;
  callType: CallType;
};

const callSlice = createSlice({
  name: "call",
  initialState,
  reducers: {
    startOutgoingCall(state, action: PayloadAction<OutgoingCallPayload>) {
      state.status = "calling";
      state.callType = action.payload.callType;
      state.callerId = action.payload.callerId;
      state.targetUserId = action.payload.targetUserId;
      state.roomId = action.payload.roomId;
      state.isInitiator = true;
      state.startTime = undefined;
      state.endTime = undefined;
      state.rejectReason = undefined;
      state.error = undefined;
    },

    receiveIncomingCall(state, action: PayloadAction<IncomingCallPayload>) {
      state.status = "ringing";
      state.callType = action.payload.callType;
      state.callerId = action.payload.callerId;
      state.roomId = action.payload.roomId;
      state.targetUserId = undefined;
      state.isInitiator = false;
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

    resetCallState() {
      return initialState;
    },

    applySignalingPayload(
      state,
      action: PayloadAction<{ event: SignalingPayload; currentUserId: number }>
    ) {
      const { event, currentUserId } = action.payload;

      if (event.type === "INVITE") {
        if (event.senderId === currentUserId) {
          state.status = "calling";
          state.isInitiator = true;
          state.targetUserId = event.payload?.targetUserId;
        } else {
          state.status = "ringing";
          state.isInitiator = false;
          state.callerId = event.senderId;
        }

        state.callType = event.payload?.callType ?? state.callType;
        state.roomId = event.roomId;
        state.error = undefined;
        state.rejectReason = undefined;
        return;
      }

      if (event.type === "ACCEPT") {
        state.status = "connected";
        state.startTime = new Date();
        state.endTime = undefined;
        state.error = undefined;
        state.rejectReason = undefined;
        return;
      }

      if (event.type === "REJECT") {
        state.status = "rejected";
        state.rejectReason = event.payload?.reason ?? "REJECTED";
        state.endTime = new Date();
        return;
      }

      if (event.type === "HANGUP") {
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
  resetCallState,
  applySignalingPayload,
} = callSlice.actions;

export default callSlice.reducer;
