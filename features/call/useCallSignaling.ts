import { useAppDispatch, useAppSelector } from "@/features/store";
import { sendSignalingApi } from "@/services/call";
import type { CallType } from "@/types/call/call";
import {
  markCallConnected,
  markCallEnded,
  markCallError,
  markCallRejected,
  resetCallState,
  startOutgoingCall,
} from "./callSlice";

type InviteParams = {
  roomId: number;
  callType: CallType;
  targetUserId?: number; // undefined = group call (gọi cả phòng)
};

export function useCallSignaling() {
  const dispatch = useAppDispatch();
  const { userSession } = useAppSelector((state) => state.auth);
  const callState = useAppSelector((state) => state.call);

  const currentUserId = userSession?.id;

  const sendSignaling = async (
    roomId: number,
    type: string,
    callSessionId?: string,
    payload?: object
  ) => {
    try {
      await sendSignalingApi({ roomId, type: type as any, callSessionId, payload: payload as any });
    } catch (error) {
      console.error("[Call] sendSignaling failed:", error);
      dispatch(markCallError("Gửi tín hiệu thất bại"));
      throw error;
    }
  };

  const startCall = async ({ roomId, callType, targetUserId }: InviteParams) => {
    if (!currentUserId) {
      dispatch(markCallError("Không tìm thấy thông tin người dùng"));
      return null;
    }

    const callSessionId = generateUUID();
    const isGroup = !targetUserId;

    dispatch(startOutgoingCall({
      roomId,
      callSessionId,
      callerId: currentUserId,
      callType,
      isGroup,
      targetUserId,
    }));

    await sendSignaling(roomId, "INVITE", callSessionId, { callType });

    return callSessionId;
  };

  const acceptCall = async (roomId: number, callSessionId?: string) => {
    dispatch(markCallConnected());
    await sendSignaling(roomId, "ACCEPT", callSessionId ?? callState.callSessionId, {});
  };

  const rejectCall = async (
    roomId: number,
    callSessionId?: string,
    reason = "REJECTED_BY_USER"
  ) => {
    dispatch(markCallRejected(reason));
    await sendSignaling(roomId, "REJECT", callSessionId ?? callState.callSessionId, { reason });
  };

  const leaveCall = async (roomId: number, callSessionId?: string) => {
    // Rời call nhóm — call tiếp tục cho người còn lại
    dispatch(markCallEnded());
    await sendSignaling(roomId, "LEAVE", callSessionId ?? callState.callSessionId, {});
  };

  const hangupCall = async (roomId: number, callSessionId?: string) => {
    const { isGroup } = callState;
    dispatch(markCallEnded());

    // Mobile cần đồng bộ với web: room group thì luôn LEAVE để không force-end người khác.
    // Session sẽ tự kết thúc ở BE khi người cuối cùng rời.
    const signalType = isGroup ? "LEAVE" : "HANGUP";

    await sendSignaling(
      roomId,
      signalType,
      callSessionId ?? callState.callSessionId,
      {}
    );
  };

  return {
    callState,
    startCall,
    acceptCall,
    rejectCall,
    leaveCall,
    hangupCall,
    resetCallState: () => dispatch(resetCallState()),
  };
}

// Tương đương crypto.randomUUID() trên React Native
function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
