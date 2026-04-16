export type CallStatus =
  | "idle"
  | "calling" // Outgoing call ringing
  | "ringing" // Incoming call notification
  | "connected" // In active call
  | "rejected" // Call was rejected
  | "ended" // Call ended normally
  | "error"; // Error state

export type CallType = "AUDIO" | "VIDEO";

export interface CallState {
  status: CallStatus;
  callType: CallType;
  callerId?: number; // Who initiated the call
  targetUserId?: number; // Who is being called
  roomId?: number; // Room context
  isInitiator: boolean; // Is current user initiating?
  startTime?: Date;
  endTime?: Date;
  rejectReason?: string; // "REJECTED_BY_USER" | "REJECTED_BY_TARGET" | "NO_ANSWER"
  error?: string;
}

export interface SignalingPayload {
  type: "INVITE" | "ACCEPT" | "REJECT" | "HANGUP";
  senderId: number; // Backend always includes this
  roomId: number;
  payload?: {
    callType?: CallType;
    targetUserId?: number;
    reason?: string;
  };
}

export interface SignalingRequest {
  roomId: number;
  type: "INVITE" | "ACCEPT" | "REJECT" | "HANGUP";
  payload?: {
    callType?: CallType;
    targetUserId?: number;
    reason?: string;
  };
}

export type SignalingResponse = SignalingPayload;
