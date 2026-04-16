import { useEffect, useMemo, useRef, useState } from "react";
import {
  findNodeHandle,
  Platform,
  PermissionsAndroid,
  View,
  Text,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Phone, PhoneOff, Video } from "lucide-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import axios from "axios";
import { useAppDispatch, useAppSelector } from "@/features/store";
import { receiveIncomingCall, useCallSignaling } from "@/features/call";
import { getZegoCredentials, getZegoRoomTokenApi, ZegoCallEngine } from "@/services/call";
import type { CallType } from "@/types/call/call";
import { ZegoTextureView } from "zego-express-engine-reactnative";

type CallMode = "incoming" | "outgoing";

const formatDuration = (seconds: number) => {
  const mm = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const ss = (seconds % 60).toString().padStart(2, "0");
  return `${mm}:${ss}`;
};

const requestCallPermissions = async (callType: CallType) => {
  if (Platform.OS !== "android") return true;

  const required = [PermissionsAndroid.PERMISSIONS.RECORD_AUDIO];
  if (callType === "VIDEO") {
    required.push(PermissionsAndroid.PERMISSIONS.CAMERA);
  }

  const result = await PermissionsAndroid.requestMultiple(required);
  return required.every((permission) => result[permission] === PermissionsAndroid.RESULTS.GRANTED);
};

const resolveZegoRoomToken = async ({
  roomId,
  userId,
  callType,
}: {
  roomId: number;
  userId: number;
  callType: CallType;
}) => {
  try {
    return await getZegoRoomTokenApi({ roomId, userId, callType });
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return undefined;
    }

    throw error;
  }
};

const isAbortedMediaStartError = (error: unknown) =>
  error instanceof Error && error.message === "ZEGO operation aborted";

export default function CallRoomScreen() {
  const params = useLocalSearchParams<{
    roomId: string;
    mode?: CallMode;
    callType?: CallType;
    targetUserId?: string;
    targetName?: string;
    callerId?: string;
  }>();

  const roomId = Number(params.roomId);
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { userSession } = useAppSelector((state) => state.auth);
  const { callState, startCall, acceptCall, rejectCall, hangupCall, resetCallState } =
    useCallSignaling();

  const callType = (params.callType ?? "AUDIO") as CallType;
  const mode = (params.mode ?? "outgoing") as CallMode;
  const targetUserId = Number(params.targetUserId);

  const [connectedSeconds, setConnectedSeconds] = useState(0);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(callType === "VIDEO");
  const [isCameraOn, setIsCameraOn] = useState(callType === "VIDEO");
  const [localViewTag, setLocalViewTag] = useState<number>();
  const [remoteViewTag, setRemoteViewTag] = useState<number>();
  const [remoteStreamReady, setRemoteStreamReady] = useState(false);
  const [zegoReady, setZegoReady] = useState(false);
  const hasStartedOutgoingCallRef = useRef(false);
  const hasJoinedMediaRef = useRef(false);
  const localViewRef = useRef<any>(null);
  const remoteViewRef = useRef<any>(null);

  const zego = useMemo(() => getZegoCredentials(), []);

  useEffect(() => {
    if (mode !== "incoming") return;
    if (callState.status !== "idle") return;
    if (!Number.isFinite(roomId) || roomId <= 0) return;

    const callerId = Number(params.callerId);

    dispatch(
      receiveIncomingCall({
        roomId,
        callerId: Number.isFinite(callerId) ? callerId : 0,
        callType,
      }),
    );
  }, [callState.status, callType, dispatch, mode, params.callerId, roomId]);

  useEffect(() => {
    if (!Number.isFinite(roomId) || roomId <= 0) {
      Alert.alert("Loi", "Room call khong hop le", [{ text: "Dong", onPress: () => router.back() }]);
      return;
    }

    if (mode === "outgoing") {
      if (hasStartedOutgoingCallRef.current) return;

      if (!Number.isFinite(targetUserId)) {
        Alert.alert("Loi", "Khong tim thay nguoi nhan cuoc goi", [
          { text: "Dong", onPress: () => router.back() },
        ]);
        return;
      }

      hasStartedOutgoingCallRef.current = true;

      startCall({ roomId, targetUserId, callType }).catch(() => {
        Alert.alert("Loi", "Khong the bat dau cuoc goi.");
      });
    }
  }, [mode, roomId, targetUserId, callType, router, startCall]);

  useEffect(() => {
    if (callState.status !== "connected") return;

    const timer = setInterval(() => {
      setConnectedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [callState.status]);

  useEffect(() => {
    const unsubRemoteAdded = ZegoCallEngine.on("remote-stream-added", () => {
      setRemoteStreamReady(true);
    });

    const unsubRemoteRemoved = ZegoCallEngine.on("remote-stream-removed", () => {
      setRemoteStreamReady(false);
    });

    const unsubRoomState = ZegoCallEngine.on("room-state", (state) => {
      if (state?.errorCode && Number(state.errorCode) !== 0) {
        console.error("[Call][ZEGO] Room state error:", state);
      }
    });

    const unsubPublisherState = ZegoCallEngine.on("publisher-state", (state) => {
      if (state?.errorCode && Number(state.errorCode) !== 0) {
        console.error("[Call][ZEGO] Publisher state error:", state);
      }
    });

    const unsubPlayerState = ZegoCallEngine.on("player-state", (state) => {
      if (state?.errorCode && Number(state.errorCode) !== 0) {
        console.error("[Call][ZEGO] Player state error:", state);
      }
    });

    return () => {
      unsubRemoteAdded?.();
      unsubRemoteRemoved?.();
      unsubRoomState?.();
      unsubPublisherState?.();
      unsubPlayerState?.();
    };
  }, []);

  useEffect(() => {
    if (callState.status !== "connected") return;
    if (!zego.isReady || !userSession?.id) return;
    if (hasJoinedMediaRef.current) return;
    if (callType === "VIDEO" && !localViewTag) return;

    let isCancelled = false;
    hasJoinedMediaRef.current = true;

    const startMedia = async () => {
      try {
        if (!(await requestCallPermissions(callType))) {
          throw new Error("Permission denied");
        }

        const roomToken = await resolveZegoRoomToken({ roomId, userId: userSession.id, callType });

        await ZegoCallEngine.joinAndStart({
          appId: zego.appId,
          appSign: zego.appSign,
          roomId,
          userId: userSession.id,
          userName: userSession.name,
          callType,
          roomToken,
          localViewTag: callType === "VIDEO" ? localViewTag : undefined,
        });

        if (isCancelled) return;
        setZegoReady(true);
      } catch (error) {
        hasJoinedMediaRef.current = false;

        if (isCancelled) return;
        if (isAbortedMediaStartError(error)) return;

        console.error("[Call] Failed to start ZEGO media:", error);
        const detail = error instanceof Error ? error.message : undefined;
        Alert.alert(
          "Loi",
          detail
            ? `Khong the ket noi media call ZEGO: ${detail}`
            : "Khong the ket noi media call ZEGO. Hay cap quyen camera/micro va thu lai."
        );
      }
    };

    startMedia();

    return () => {
      isCancelled = true;
    };
  }, [callState.status, zego.isReady, zego.appId, zego.appSign, userSession?.id, userSession?.name, roomId, callType, localViewTag]);

  useEffect(() => {
    if (!zegoReady || callType !== "VIDEO") return;

    ZegoCallEngine.attachRemoteView({ remoteViewTag }).catch((error) => {
      console.error("[Call] Failed to attach remote ZEGO view:", error);
    });
  }, [zegoReady, callType, remoteViewTag]);

  useEffect(() => {
    if (callState.status === "rejected" || callState.status === "ended") {
      const timeout = setTimeout(() => {
        resetCallState();
        router.back();
      }, 1200);

      return () => clearTimeout(timeout);
    }
  }, [callState.status, resetCallState, router]);

  useEffect(() => {
    return () => {
      ZegoCallEngine.leave().catch(() => {});
      resetCallState();
    };
  }, [resetCallState]);

  useEffect(() => {
    if (callType !== "VIDEO") return;

    if (!localViewTag && localViewRef.current) {
      const tag = findNodeHandle(localViewRef.current);
      if (tag) setLocalViewTag(tag);
    }

    if (!remoteViewTag && remoteViewRef.current) {
      const tag = findNodeHandle(remoteViewRef.current);
      if (tag) setRemoteViewTag(tag);
    }
  }, [callType, localViewTag, remoteViewTag]);

  let title = "Dang goi thoai";
  if (callType === "VIDEO") {
    title = "Dang goi video";
  }
  if (mode === "incoming") {
    title = "Cuoc goi den";
  }

  const subtitle = (() => {
    if (callState.status === "connected") {
      return `Da ket noi ${formatDuration(connectedSeconds)}`;
    }

    if (callState.status === "calling") {
      return "Dang do chuong...";
    }

    if (callState.status === "ringing") {
      return "Dang cho ban tra loi";
    }

    if (callState.status === "rejected") {
      return "Nguoi nhan da tu choi";
    }

    if (callState.status === "ended") {
      return "Cuoc goi da ket thuc";
    }

    if (callState.status === "error") {
      return callState.error ?? "Co loi xay ra";
    }

    return "Khoi tao cuoc goi...";
  })();

  const onEndCall = async () => {
    try {
      await ZegoCallEngine.leave().catch(() => {});
      await hangupCall(roomId);
    } catch {
      Alert.alert("Loi", "Khong the ket thuc cuoc goi.");
    }
  };

  const onAccept = async () => {
    try {
      await acceptCall(roomId);
    } catch {
      Alert.alert("Loi", "Khong the chap nhan cuoc goi.");
    }
  };

  const onReject = async () => {
    try {
      await ZegoCallEngine.leave().catch(() => {});
      await rejectCall(roomId);
    } catch {
      Alert.alert("Loi", "Khong the tu choi cuoc goi.");
    }
  };

  const toggleMic = async () => {
    const next = !isMicMuted;
    setIsMicMuted(next);
    try {
      await ZegoCallEngine.setMicrophoneMuted(next);
    } catch {
      setIsMicMuted(!next);
    }
  };

  const toggleSpeaker = async () => {
    const next = !isSpeakerOn;
    setIsSpeakerOn(next);
    try {
      await ZegoCallEngine.setSpeakerEnabled(next);
    } catch {
      setIsSpeakerOn(!next);
    }
  };

  const toggleCamera = async () => {
    const next = !isCameraOn;
    setIsCameraOn(next);
    try {
      await ZegoCallEngine.setCameraEnabled(next);
    } catch {
      setIsCameraOn(!next);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#12131A]" edges={["top", "bottom", "left", "right"]}>
      <View className="flex-1 px-6 pt-10 pb-12 justify-between">
        <View className="items-center mt-14">
          {callType === "VIDEO" && callState.status === "connected" ? (
            <View className="w-full h-[420px] rounded-[28px] overflow-hidden bg-[#1B1E2A] mb-6 relative">
              <ZegoTextureView
                ref={remoteViewRef}
                className="w-full h-full"
                onLayout={() => {
                  const tag = findNodeHandle(remoteViewRef.current);
                  if (typeof tag === "number") setRemoteViewTag(tag);
                }}
              />

              {!remoteStreamReady && (
                <View className="absolute inset-0 items-center justify-center">
                  <Text className="text-[#C5CCDA] text-[14px]">Dang cho video doi phuong...</Text>
                </View>
              )}

              <View className="absolute right-3 top-3 w-28 h-40 rounded-2xl overflow-hidden border border-white/20 bg-[#0F1118]">
                <ZegoTextureView
                  ref={localViewRef}
                  className="w-full h-full"
                  onLayout={() => {
                    const tag = findNodeHandle(localViewRef.current);
                    if (typeof tag === "number") setLocalViewTag(tag);
                  }}
                />
              </View>
            </View>
          ) : (
            <View className="w-28 h-28 rounded-full bg-[#2A2D3A] items-center justify-center mb-6">
              {callType === "VIDEO" ? <Video size={38} color="#FFFFFF" /> : <Phone size={38} color="#FFFFFF" />}
            </View>
          )}
          <Text className="text-white text-[28px] font-bold">{title}</Text>
          <Text className="text-[#A8AFBF] text-[15px] mt-2">{subtitle}</Text>
          {!zego.isReady && (
            <Text className="text-[#FCA5A5] text-center text-[13px] mt-6 px-2">
              Chua co ZEGO credentials. Kiem tra bien moi truong EXPO_PUBLIC_ZEGO_APP_ID / EXPO_PUBLIC_ZEGO_SERVER_SECRET.
            </Text>
          )}
        </View>

        <View>
          {callState.status === "ringing" && mode === "incoming" ? (
            <View className="flex-row items-center justify-center gap-6 mb-6">
              <TouchableOpacity
                onPress={onReject}
                className="w-16 h-16 rounded-full bg-[#EF4444] items-center justify-center"
              >
                <PhoneOff size={28} color="#FFF" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onAccept}
                className="w-16 h-16 rounded-full bg-[#22C55E] items-center justify-center"
              >
                <Phone size={28} color="#FFF" />
              </TouchableOpacity>
            </View>
          ) : (
            <View className="flex-row items-center justify-center gap-6">
              <TouchableOpacity
                onPress={toggleMic}
                className={`w-14 h-14 rounded-full items-center justify-center ${
                  isMicMuted ? "bg-[#F59E0B]" : "bg-[#2A2D3A]"
                }`}
              >
                <Text className="text-white text-xs font-semibold">MIC</Text>
              </TouchableOpacity>
              {callType === "VIDEO" && (
                <TouchableOpacity
                  onPress={toggleCamera}
                  className={`w-14 h-14 rounded-full items-center justify-center ${
                    isCameraOn ? "bg-[#2A2D3A]" : "bg-[#64748B]"
                  }`}
                >
                  <Text className="text-white text-xs font-semibold">CAM</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={onEndCall}
                className="w-16 h-16 rounded-full bg-[#EF4444] items-center justify-center"
              >
                <PhoneOff size={28} color="#FFF" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={toggleSpeaker}
                className={`w-14 h-14 rounded-full items-center justify-center ${
                  isSpeakerOn ? "bg-[#2A2D3A]" : "bg-[#64748B]"
                }`}
              >
                <Text className="text-white text-xs font-semibold">SPK</Text>
              </TouchableOpacity>
            </View>
          )}

          <Text className="text-center text-[#7A8192] text-[12px] mt-8">
            User: {userSession?.name ?? "Unknown"} | Room: {roomId}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
