import type { SignalingRequest } from "@/types/call/call";
import axiosClient from "@/lib/axiosClient";
import axios from "axios";

// Send signaling message (INVITE/ACCEPT/REJECT/HANGUP)
export async function sendSignalingApi(payload: SignalingRequest) {
  try {
    const response = await axiosClient.post(
      "/core-service/chat/signaling",
      payload,
    );
    return response;
  } catch (error) {
    console.error("[CallAPI] sendSignaling error:", error);
    throw error;
  }
}


export function getZegoCredentials() {
  const appIdRaw = process.env.EXPO_PUBLIC_ZEGO_APP_ID;
  const appSign = process.env.EXPO_PUBLIC_ZEGO_APP_SIGN;

  const appId = Number(appIdRaw);

  return {
    appId,
    appSign,
    isReady: Number.isFinite(appId) && appId > 0 && !!appSign,
  };
}
