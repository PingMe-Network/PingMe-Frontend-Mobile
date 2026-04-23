import { useCallback, useEffect, useMemo, useRef, useState, memo, forwardRef } from "react";
import {
  findNodeHandle,
  Platform,
  PermissionsAndroid,
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Phone, PhoneOff, Video, Users, Mic, MicOff, Camera, CameraOff, Volume2, VolumeX } from "lucide-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAppDispatch, useAppSelector } from "@/features/store";
import { receiveIncomingCall, useCallSignaling } from "@/features/call";
import { getZegoCredentials, ZegoCallEngine } from "@/services/call";
import type { CallType } from "@/types/call/call";
import { getCurrentUserRoomsApi } from "@/services/chat";
import type { RoomResponse } from "@/types/chat/room";
import { ZegoTextureView } from "zego-express-engine-reactnative";

const ZegoTextureViewLazy = forwardRef((props: any, ref: any) => {
  return <ZegoTextureView ref={ref} {...props} />;
});
ZegoTextureViewLazy.displayName = "ZegoTextureViewLazy";

// ── RemoteStreamView ──────────────────────────────────────────────────────────
// Renders one remote participant's video tile and self-attaches to Zego engine.
const RemoteStreamView = memo(({
  streamId,
  style,
  displayName,
}: {
  streamId: string;
  style: object;
  displayName: string;
}) => {
  const viewRef = useRef<any>(null);

  const handleLayout = useCallback(() => {
    // Slight delay so the native view has time to actually render before we
    // ask for its node handle — without this, findNodeHandle returns null on
    // some Android versions.
    setTimeout(() => {
      requestAnimationFrame(() => {
        const tag = findNodeHandle(viewRef.current);
        if (typeof tag === "number") {
          ZegoCallEngine.attachStreamView(streamId, tag).catch(console.warn);
        }
      });
    }, 100);
  }, [streamId]);

  return (
    <View style={[{ backgroundColor: "#0D0F17" }, style]}>
      <ZegoTextureViewLazy
        ref={viewRef}
        style={{ width: "100%", height: "100%" }}
        onLayout={handleLayout}
      />
      <View
        style={{
          position: "absolute",
          left: 8,
          bottom: 8,
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 999,
          backgroundColor: "rgba(0,0,0,0.45)",
          maxWidth: "75%",
        }}
      >
        <Text numberOfLines={1} style={{ color: "#F8FAFC", fontSize: 11, fontWeight: "600" }}>
          {displayName}
        </Text>
      </View>
    </View>
  );
});
RemoteStreamView.displayName = "RemoteStreamView";

// ── Helpers ───────────────────────────────────────────────────────────────────
type CallMode = "incoming" | "outgoing";

const formatDuration = (seconds: number) => {
  const mm = Math.floor(seconds / 60).toString().padStart(2, "0");
  const ss = (seconds % 60).toString().padStart(2, "0");
  return `${mm}:${ss}`;
};

const requestCallPermissions = async (callType: CallType) => {
  if (Platform.OS !== "android") return true;
  const required = [PermissionsAndroid.PERMISSIONS.RECORD_AUDIO];
  if (callType === "VIDEO") required.push(PermissionsAndroid.PERMISSIONS.CAMERA);
  const result = await PermissionsAndroid.requestMultiple(required);
  return required.every((p) => result[p] === PermissionsAndroid.RESULTS.GRANTED);
};

const isAbortedMediaStartError = (error: unknown) =>
  error instanceof Error && error.message === "ZEGO operation aborted";

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function CallRoomScreen() {
  const params = useLocalSearchParams<{
    roomId: string;
    mode?: CallMode;
    callType?: CallType;
    targetUserId?: string;
    targetName?: string;
    callerId?: string;
    callerName?: string;
    callSessionId?: string;
    isGroup?: string;
  }>();

  const roomId = Number(params.roomId);
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { userSession } = useAppSelector((state) => state.auth);
  const { callState, startCall, acceptCall, rejectCall, leaveCall, hangupCall, resetCallState } =
    useCallSignaling();

  const callType = (params.callType ?? "AUDIO") as CallType;
  const mode = (params.mode ?? "outgoing") as CallMode;
  const targetUserId = params.targetUserId ? Number(params.targetUserId) : undefined;
  const callSessionIdFromParams = params.callSessionId;
  const isGroupFromParams = params.isGroup === "true";

  // ── State ─────────────────────────────────────────────────────────────────
  const [connectedSeconds, setConnectedSeconds] = useState(0);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(callType === "VIDEO");
  const [isCameraOn, setIsCameraOn] = useState(callType === "VIDEO");
  const [localViewTag, setLocalViewTag] = useState<number>();
  // Multi-stream: list of active remote stream IDs
  const [remoteStreamIds, setRemoteStreamIds] = useState<string[]>([]);
  const [participantNameMap, setParticipantNameMap] = useState<Record<number, string>>({});
  const [pipCorner, setPipCorner] = useState<"topRight" | "bottomRight">("topRight");

  const hasStartedOutgoingCallRef = useRef(false);
  const hasJoinedMediaRef = useRef(false);
  const localViewRef = useRef<any>(null);

  const zego = useMemo(() => getZegoCredentials(), []);

  const isGroup = callState.isGroup || isGroupFromParams;
  const callSessionId = callState.callSessionId ?? callSessionIdFromParams;
  const callerName = callState.callerName ?? params.callerName ?? "Người dùng";

  const parseUserIdFromStreamId = useCallback((streamId: string): number | null => {
    const match = streamId.match(/^(\d+)_(\d+)_main$/);
    if (!match) return null;
    const userId = Number(match[2]);
    return Number.isFinite(userId) ? userId : null;
  }, []);

  const getRemoteName = useCallback(
    (streamId: string) => {
      const userId = parseUserIdFromStreamId(streamId);
      if (userId && participantNameMap[userId]) return participantNameMap[userId];
      if (userId) return `User ${userId}`;
      return `Participant ${streamId.slice(0, 6)}`;
    },
    [participantNameMap, parseUserIdFromStreamId]
  );

  // ── Incoming call dispatch ────────────────────────────────────────────────
  useEffect(() => {
    if (mode !== "incoming") return;
    if (callState.status !== "idle") return;
    if (!Number.isFinite(roomId) || roomId <= 0) return;

    const callerId = Number(params.callerId);
    dispatch(
      receiveIncomingCall({
        roomId,
        callSessionId: callSessionIdFromParams ?? "",
        callerId: Number.isFinite(callerId) ? callerId : 0,
        callerName: params.callerName ?? "Người dùng",
        callType,
        isGroup: isGroupFromParams,
        activeParticipantCount: isGroupFromParams ? 3 : 2,
      })
    );
  }, [callState.status, callType, dispatch, mode, params.callerId, params.callerName,
      callSessionIdFromParams, isGroupFromParams, roomId]);

  // UI only: load room participants so each video tile can show a name.
  useEffect(() => {
    if (!Number.isFinite(roomId) || roomId <= 0) return;
    let mounted = true;

    (async () => {
      try {
        const res = await getCurrentUserRoomsApi({ page: 1, size: 100 });
        const rooms = res.data.data.content as RoomResponse[];
        const room = rooms.find((r) => Number(r.roomId) === Number(roomId));
        if (!room || !mounted) return;

        const nextMap: Record<number, string> = {};
        for (const participant of room.participants) {
          nextMap[participant.userId] = participant.name;
        }
        setParticipantNameMap(nextMap);
      } catch {
        // Fallback labels are used if this request fails.
      }
    })();

    return () => {
      mounted = false;
    };
  }, [roomId]);

  // ── Outgoing call init ────────────────────────────────────────────────────
  useEffect(() => {
    if (!Number.isFinite(roomId) || roomId <= 0) {
      Alert.alert("Lỗi", "Room call không hợp lệ", [{ text: "Đóng", onPress: () => router.back() }]);
      return;
    }
    if (mode !== "outgoing") return;
    if (hasStartedOutgoingCallRef.current) return;
    hasStartedOutgoingCallRef.current = true;

    startCall({ roomId, callType, targetUserId }).catch(() => {
      Alert.alert("Lỗi", "Không thể bắt đầu cuộc gọi.");
    });
  }, [mode, roomId, targetUserId, callType, router, startCall]);

  // ── Connected timer ───────────────────────────────────────────────────────
  useEffect(() => {
    if (callState.status !== "connected") return;
    const timer = setInterval(() => setConnectedSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [callState.status]);

  // ── Zego stream events (multi-stream) ─────────────────────────────────────
  useEffect(() => {
    const unsubAdded = ZegoCallEngine.on(
      "remote-stream-added",
      ({ streamId }: { streamId: string }) => {
        setRemoteStreamIds((prev) =>
          prev.includes(streamId) ? prev : [...prev, streamId]
        );
      }
    );

    const unsubRemoved = ZegoCallEngine.on(
      "remote-stream-removed",
      ({ streamId }: { streamId: string }) => {
        setRemoteStreamIds((prev) => prev.filter((id) => id !== streamId));
      }
    );

    const unsubRoom = ZegoCallEngine.on("room-state", (s: any) => {
      if (s?.errorCode && Number(s.errorCode) !== 0) {
        console.error("[Call][ZEGO] Room error:", s);
      }
    });

    // Sync any streams that arrived before this effect ran (reconnect case)
    const existing = ZegoCallEngine.getRemoteStreamIds();
    if (existing.length > 0) setRemoteStreamIds(existing);

    return () => {
      unsubAdded?.();
      unsubRemoved?.();
      unsubRoom?.();
    };
  }, []);

  // ── Start Zego media when connected ──────────────────────────────────────
  useEffect(() => {
    if (callState.status !== "connected") return;
    if (!zego.isReady || !userSession?.id) return;
    if (hasJoinedMediaRef.current) return;
    if (callType === "VIDEO" && !localViewTag) return;

    let isCancelled = false;
    hasJoinedMediaRef.current = true;

    const startMedia = async () => {
      try {
        if (!(await requestCallPermissions(callType))) throw new Error("Permission denied");

        await ZegoCallEngine.joinAndStart({
          appId: zego.appId,
          appSign: zego.appSign,
          roomId,
          userId: userSession.id,
          userName: userSession.name,
          callType,
          localViewTag: callType === "VIDEO" ? localViewTag : undefined,
        });

        if (isCancelled) return;
      } catch (error) {
        hasJoinedMediaRef.current = false;
        if (isCancelled || isAbortedMediaStartError(error)) return;
        console.error("[Call] Failed to start ZEGO media:", error);
        Alert.alert("Lỗi", "Không thể kết nối media. Hãy cấp quyền camera/micro và thử lại.");
      }
    };

    startMedia();
    return () => { isCancelled = true; };
  }, [callState.status, zego.isReady, zego.appId, zego.appSign,
      userSession?.id, userSession?.name, roomId, callType, localViewTag]);

  // ── Auto-navigate back when call ends ────────────────────────────────────
  useEffect(() => {
    if (callState.status === "rejected" || callState.status === "ended") {
      const timeout = setTimeout(() => {
        resetCallState();
        router.back();
      }, 1200);
      return () => clearTimeout(timeout);
    }
  }, [callState.status, resetCallState, router]);

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      ZegoCallEngine.leave().catch(() => {});
      resetCallState();
    };
  }, [resetCallState]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const onEndCall = async () => {
    try {
      await ZegoCallEngine.leave().catch(() => {});

      // Hard rule: cuộc gọi đi mà không có targetUserId => group call.
      // Không phụ thuộc callState để tránh rơi nhầm sang HANGUP.
      const isOutgoingGroup = mode === "outgoing" && !targetUserId;
      const shouldLeaveGroup = isOutgoingGroup || isGroup || isGroupFromParams;

      if (shouldLeaveGroup) {
        await leaveCall(roomId, callSessionId);
      } else {
        await hangupCall(roomId, callSessionId);
      }
    } catch {
      Alert.alert("Lỗi", "Không thể kết thúc cuộc gọi.");
    }
  };

  const onAccept = async () => {
    try {
      await acceptCall(roomId, callSessionId);
    } catch {
      Alert.alert("Lỗi", "Không thể chấp nhận cuộc gọi.");
    }
  };

  const onReject = async () => {
    try {
      await ZegoCallEngine.leave().catch(() => {});
      await rejectCall(roomId, callSessionId);
    } catch {
      Alert.alert("Lỗi", "Không thể từ chối cuộc gọi.");
    }
  };

  const toggleMic = async () => {
    const next = !isMicMuted;
    setIsMicMuted(next);
    try { await ZegoCallEngine.setMicrophoneMuted(next); }
    catch { setIsMicMuted(!next); }
  };

  const toggleSpeaker = async () => {
    const next = !isSpeakerOn;
    setIsSpeakerOn(next);
    try { await ZegoCallEngine.setSpeakerEnabled(next); }
    catch { setIsSpeakerOn(!next); }
  };

  const toggleCamera = async () => {
    const next = !isCameraOn;
    setIsCameraOn(next);
    try { await ZegoCallEngine.setCameraEnabled(next); }
    catch { setIsCameraOn(!next); }
  };

  // ── Labels ────────────────────────────────────────────────────────────────
  const title = isGroup
    ? `Cuộc gọi nhóm${callType === "VIDEO" ? " video" : " thoại"}`
    : callType === "VIDEO" ? "Đang gọi video" : "Đang gọi thoại";

  const subtitle = (() => {
    if (callState.status === "connected") {
      const countLabel =
        isGroup && callState.activeParticipantCount > 1
          ? ` · ${callState.activeParticipantCount} người`
          : "";
      return `Đã kết nối ${formatDuration(connectedSeconds)}${countLabel}`;
    }
    if (callState.status === "calling")  return "Đang đổ chuông...";
    if (callState.status === "ringing")  return mode === "incoming" ? `${callerName} đang gọi` : "Đang chờ trả lời";
    if (callState.status === "rejected") return isGroup ? "Đã từ chối" : "Người nhận đã từ chối";
    if (callState.status === "ended")    return "Cuộc gọi đã kết thúc";
    if (callState.status === "error")    return callState.error ?? "Có lỗi xảy ra";
    return "Khởi tạo cuộc gọi...";
  })();

  const isConnected = callState.status === "connected";
  const showVideoUI = callType === "VIDEO" && isConnected;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#12131A" }} edges={["top", "bottom", "left", "right"]}>
      <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 40, paddingBottom: 48, justifyContent: "space-between" }}>

        {/* ── Video / Avatar area ── */}
        <View style={{ flex: 1, alignItems: "center" }}>

          {showVideoUI ? (
            // Multi-stream video grid
            <View style={{ width: "100%", flex: 1, marginBottom: 16 }}>
              {/* Remote streams grid */}
              <View style={{ flex: 1, borderRadius: 28, overflow: "hidden", backgroundColor: "#1B1E2A", position: "relative" }}>
                {remoteStreamIds.length === 0 ? (
                  <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ color: "#C5CCDA", fontSize: 14 }}>
                      {isGroup ? "Đang chờ người tham gia..." : "Đang chờ video đối phương..."}
                    </Text>
                  </View>
                ) : remoteStreamIds.length === 1 ? (
                  // Single remote: fill the entire space
                  <RemoteStreamView
                    streamId={remoteStreamIds[0]}
                    displayName={getRemoteName(remoteStreamIds[0])}
                    style={{ flex: 1 }}
                  />
                ) : (
                  // Multiple remotes: responsive grid
                  <RemoteVideoGrid streamIds={remoteStreamIds} getRemoteName={getRemoteName} />
                )}

                {/* Local video PiP — tap to switch corner, reducing overlap with remote tiles */}
                <TouchableOpacity
                  activeOpacity={0.95}
                  onPress={() =>
                    setPipCorner((prev) => (prev === "topRight" ? "bottomRight" : "topRight"))
                  }
                  style={{
                    position: "absolute",
                    right: 10,
                    top: pipCorner === "topRight" ? 10 : undefined,
                    bottom: pipCorner === "bottomRight" ? 10 : undefined,
                    width: 92,
                    height: 132,
                    borderRadius: 14,
                    overflow: "hidden",
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.25)",
                    backgroundColor: "#0F1118",
                  }}
                >
                  <ZegoTextureViewLazy
                    ref={localViewRef}
                    style={{ flex: 1, width: "100%", height: "100%" }}
                    onLayout={() => {
                      setTimeout(() => {
                        requestAnimationFrame(() => {
                          const tag = findNodeHandle(localViewRef.current);
                          if (typeof tag === "number") setLocalViewTag(tag);
                        });
                      }, 100);
                    }}
                  />
                  {!isCameraOn && (
                    <View style={{ position: "absolute", inset: 0, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.6)" }}>
                      <CameraOff size={20} color="#9CA3AF" />
                    </View>
                  )}
                  <View
                    style={{
                      position: "absolute",
                      left: 6,
                      bottom: 6,
                      paddingHorizontal: 7,
                      paddingVertical: 3,
                      borderRadius: 999,
                      backgroundColor: "rgba(0,0,0,0.45)",
                    }}
                  >
                    <Text style={{ color: "#F8FAFC", fontSize: 10, fontWeight: "600" }}>Bạn</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            // Avatar placeholder (audio call or pre-connected)
            <>
              <View style={{
                width: 112,
                height: 112,
                borderRadius: 56,
                backgroundColor: "#2A2D3A",
                alignItems: "center",
                justifyContent: "center",
                marginTop: 56,
                marginBottom: 24,
              }}>
                {isGroup
                  ? <Users size={38} color="#FFFFFF" />
                  : callType === "VIDEO"
                    ? <Video size={38} color="#FFFFFF" />
                    : <Phone size={38} color="#FFFFFF" />
                }
              </View>
            </>
          )}

          <Text style={{ color: "#FFFFFF", fontSize: 26, fontWeight: "700", marginTop: showVideoUI ? 8 : 0 }}>
            {title}
          </Text>
          <Text style={{ color: "#A8AFBF", fontSize: 15, marginTop: 8 }}>{subtitle}</Text>

          {/* Participant count badge */}
          {isGroup && isConnected && callState.activeParticipantCount > 1 && (
            <View style={{
              marginTop: 12,
              paddingHorizontal: 16,
              paddingVertical: 6,
              backgroundColor: "#2A2D3A",
              borderRadius: 999,
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
            }}>
              <Users size={14} color="#9CA3AF" />
              <Text style={{ color: "#9CA3AF", fontSize: 13 }}>
                {callState.activeParticipantCount} người tham gia
              </Text>
            </View>
          )}

          {!zego.isReady && (
            <Text style={{ color: "#FCA5A5", textAlign: "center", fontSize: 13, marginTop: 24, paddingHorizontal: 8 }}>
              Chưa có ZEGO credentials. Kiểm tra biến môi trường.
            </Text>
          )}
        </View>

        {/* ── Controls ── */}
        <View>
          {callState.status === "ringing" && mode === "incoming" ? (
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 24, marginBottom: 24 }}>
              <TouchableOpacity
                onPress={onReject}
                style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: "#EF4444", alignItems: "center", justifyContent: "center" }}
              >
                <PhoneOff size={28} color="#FFF" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onAccept}
                style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: "#22C55E", alignItems: "center", justifyContent: "center" }}
              >
                <Phone size={28} color="#FFF" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
              {/* Mic */}
              <ControlButton
                onPress={toggleMic}
                active={!isMicMuted}
                icon={isMicMuted ? <MicOff size={22} color="#FFF" /> : <Mic size={22} color="#FFF" />}
                label={isMicMuted ? "Muted" : "Micro"}
                activeColor="#F59E0B"
              />

              {/* Camera (video calls only) */}
              {callType === "VIDEO" && (
                <ControlButton
                  onPress={toggleCamera}
                  active={isCameraOn}
                  icon={isCameraOn ? <Camera size={22} color="#FFF" /> : <CameraOff size={22} color="#FFF" />}
                  label="Camera"
                  inactiveColor="#64748B"
                />
              )}

              {/* End call */}
              <TouchableOpacity
                onPress={onEndCall}
                style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: "#EF4444", alignItems: "center", justifyContent: "center" }}
              >
                <PhoneOff size={28} color="#FFF" />
              </TouchableOpacity>

              {/* Speaker */}
              <ControlButton
                onPress={toggleSpeaker}
                active={isSpeakerOn}
                icon={isSpeakerOn ? <Volume2 size={22} color="#FFF" /> : <VolumeX size={22} color="#FFF" />}
                label="Loa"
                inactiveColor="#64748B"
              />
            </View>
          )}

          <Text style={{ textAlign: "center", color: "#7A8192", fontSize: 12, marginTop: 24 }}>
            {userSession?.name ?? "Unknown"} · Room {roomId}
            {isGroup ? " · Nhóm" : ""}
          </Text>
        </View>

      </View>
    </SafeAreaView>
  );
}

// ── RemoteVideoGrid ───────────────────────────────────────────────────────────
// Distributes N remote streams into a 2-column responsive grid.
function RemoteVideoGrid({
  streamIds,
  getRemoteName,
}: {
  streamIds: string[];
  getRemoteName: (streamId: string) => string;
}) {
  const count = streamIds.length;
  // Always 2 columns when there are multiple streams
  const numCols = 2;
  const numRows = Math.ceil(count / numCols);

  return (
    <ScrollView
      scrollEnabled={numRows > 3}
      style={{ flex: 1 }}
      contentContainerStyle={{ flexDirection: "row", flexWrap: "wrap", flexGrow: 1 }}
    >
      {streamIds.map((id, idx) => {
        // Last item in an odd-count list: span full width
        const isLastOdd = count % 2 !== 0 && idx === count - 1;
        return (
          <RemoteStreamView
            key={id}
            streamId={id}
            displayName={getRemoteName(id)}
            style={{
              width: isLastOdd ? "100%" : "50%",
              aspectRatio: isLastOdd ? 16 / 9 : 9 / 16,
            }}
          />
        );
      })}
    </ScrollView>
  );
}

// ── ControlButton ─────────────────────────────────────────────────────────────
function ControlButton({
  onPress,
  active,
  icon,
  label,
  activeColor = "#2A2D3A",
  inactiveColor = "#F59E0B",
}: {
  onPress: () => void;
  active: boolean;
  icon: React.ReactNode;
  label: string;
  activeColor?: string;
  inactiveColor?: string;
}) {
  return (
    <View style={{ alignItems: "center", gap: 4 }}>
      <TouchableOpacity
        onPress={onPress}
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: active ? activeColor : inactiveColor,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </TouchableOpacity>
      <Text style={{ color: "#9CA3AF", fontSize: 10 }}>{label}</Text>
    </View>
  );
}
