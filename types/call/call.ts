export type CallStatus =
  | "idle"
  | "calling"
  | "ringing"
  | "connected"
  | "rejected"
  | "ended"
  | "error";

export type CallType = "AUDIO" | "VIDEO";

export type SignalingType =
  | "INVITE"
  | "ACCEPT"
  | "REJECT"
  | "LEAVE"
  | "HANGUP"
  | "SESSION_ENDED";

export interface CallState {
  status: CallStatus;
  callType: CallType;
  callSessionId?: string;
  callerId?: number;
  callerName?: string;
  targetUserId?: number;
  roomId?: number;
  isInitiator: boolean;
  isGroup: boolean;
  activeParticipantCount: number;
  startTime?: Date;
  endTime?: Date;
  rejectReason?: string;
  error?: string;
}

// Shape nhận từ BE qua WebSocket (khớp với SignalingResponse Java)
export interface SignalingPayload {
  type: SignalingType;
  senderId: number;
  senderName: string;
  roomId: number;
  callSessionId: string;
  activeParticipantCount: number;
  payload?: {
    callType?: CallType;
    reason?: string;
  };
}

// Request gửi lên BE
export interface SignalingRequest {
  roomId: number;
  type: SignalingType;
  callSessionId?: string;
  payload?: {
    callType?: CallType;
    reason?: string;
  };
}
