import type { SignalingRequest } from "@/types/call/call";
import axiosClient from "@/lib/axiosClient";
import axios from "axios";

type GetZegoRoomTokenRequest = {
  roomId: number;
  userId: number;
  callType: "AUDIO" | "VIDEO";
};

const resolveTokenEndpoint = () => {
  const configured =
    process.env.EXPO_PUBLIC_ZEGO_TOKEN_ENDPOINT ?? process.env.VITE_ZEGO_TOKEN_ENDPOINT ?? "";

  const normalized = configured.trim();
  return normalized.length > 0 ? normalized : null;
};

const parseTokenFromResponse = (response: any) => {
  const data = response?.data?.data;

  if (typeof data === "string" && data.length > 0) {
    return data;
  }

  const tokenCandidate =
    data?.token ?? data?.zegoToken ?? data?.roomToken ?? data?.accessToken;

  if (typeof tokenCandidate === "string" && tokenCandidate.length > 0) {
    return tokenCandidate;
  }

  return null;
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

export async function getZegoRoomTokenApi(
  payload: GetZegoRoomTokenRequest,
): Promise<string | undefined> {
  const tokenEndpoint = resolveTokenEndpoint();

  if (!tokenEndpoint) {
    return undefined;
  }

  try {
    const response = await axiosClient.post(tokenEndpoint, payload);
    const token = parseTokenFromResponse(response);

    if (token) {
      return token;
    }

    throw new Error("ZEGO room token response is invalid");
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      console.warn(
        `[CallAPI] ZEGO token endpoint not found: ${tokenEndpoint}. Fallback to AppID/AppSign mode.`,
      );
      return undefined;
    }

    throw error;
  }
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
