import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/features/store";
import { SocketManager } from "@/features/chat";
import { sendSignalingApi } from "@/services/call";
import type { CallType, SignalingPayload, SignalingRequest } from "@/types/call/call";
import {
  applySignalingPayload,
  markCallConnected,
  markCallEnded,
  markCallError,
  markCallRejected,
  resetCallState,
  startOutgoingCall,
} from "./callSlice";

type InviteParams = {
  roomId: number;
  targetUserId: number;
  callType: CallType;
};

export function useCallSignaling() {
  const dispatch = useAppDispatch();
  const { userSession } = useAppSelector((state) => state.auth);
  const callState = useAppSelector((state) => state.call);

  const currentUserId = userSession?.id;

  useEffect(() => {
    if (!currentUserId) return;

    const unsub = SocketManager.on("CALL_SIGNALING", (event: SignalingPayload) => {
      dispatch(applySignalingPayload({ event, currentUserId }));
    });

    return () => {
      unsub?.();
    };
  }, [dispatch, currentUserId]);

  const sendSignaling = async (payload: SignalingRequest) => {
    try {
      await sendSignalingApi(payload);
    } catch (error) {
      console.error("[Call] sendSignaling failed:", error);
      dispatch(markCallError("Goi tin hieu that bai"));
      throw error;
    }
  };

  const startCall = async ({ roomId, targetUserId, callType }: InviteParams) => {
    if (!currentUserId) {
      dispatch(markCallError("Khong tim thay thong tin nguoi dung"));
      return;
    }

    dispatch(startOutgoingCall({ roomId, targetUserId, callType, callerId: currentUserId }));

    await sendSignaling({
      roomId,
      type: "INVITE",
      payload: {
        callType,
        targetUserId,
      },
    });
  };

  const acceptCall = async (roomId: number) => {
    dispatch(markCallConnected());
    await sendSignaling({
      roomId,
      type: "ACCEPT",
    });
  };

  const rejectCall = async (roomId: number, reason = "REJECTED_BY_TARGET") => {
    dispatch(markCallRejected(reason));
    await sendSignaling({
      roomId,
      type: "REJECT",
      payload: { reason },
    });
  };

  const hangupCall = async (roomId: number) => {
    dispatch(markCallEnded());
    await sendSignaling({
      roomId,
      type: "HANGUP",
    });
  };

  return {
    callState,
    startCall,
    acceptCall,
    rejectCall,
    hangupCall,
    resetCallState: () => dispatch(resetCallState()),
  };
}
