import type { SignalingRequest } from "@/types/call/call";
import axiosClient from "@/lib/axiosClient";

type GetZegoRoomTokenRequest = {
  roomId: number;
  userId: number;
  callType: "AUDIO" | "VIDEO";
};

// Send signaling message (INVITE/ACCEPT/REJECT/HANGUP)
export async function sendSignalingApi(payload: SignalingRequest) {
  try {
    const response = await axiosClient.post("/core-service/chat/signaling", payload);
    return response;
  } catch (error) {
    console.error("[CallAPI] sendSignaling error:", error);
    throw error;
  }
}

export async function getZegoRoomTokenApi(payload: GetZegoRoomTokenRequest) {
  const response = await axiosClient.post("/core-service/chat/call/token", payload);
  const data = response?.data?.data;

  if (typeof data === "string" && data.length > 0) {
    return data;
  }

  const tokenCandidate =
    data?.token ?? data?.zegoToken ?? data?.roomToken ?? data?.accessToken;

  if (typeof tokenCandidate === "string" && tokenCandidate.length > 0) {
    return tokenCandidate;
  }

  throw new Error("ZEGO room token response is invalid");
}

export function getZegoCredentials() {
  const appIdRaw = process.env.EXPO_PUBLIC_ZEGO_APP_ID ?? process.env.VITE_ZEGO_APP_ID ?? "";
  const appSign =
    process.env.EXPO_PUBLIC_ZEGO_SERVER_SECRET ??
    process.env.VITE_ZEGO_SERVER_SECRET ??
    "";

  const appId = Number(appIdRaw);

  return {
    appId,
    appSign,
    isReady: Number.isFinite(appId) && appId > 0 && !!appSign,
  };
}
