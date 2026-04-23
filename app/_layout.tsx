import { Slot, useRouter, useSegments } from "expo-router";
import { useEffect, useRef } from "react";
import { Provider } from "react-redux";
import { View, ActivityIndicator } from "react-native";
import { StatusBar } from "expo-status-bar";
import { PersistGate } from "redux-persist/integration/react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  store,
  persistor,
  useAppSelector,
  useAppDispatch,
} from "@/features/store";
import { setupAxiosInterceptors } from "@/lib/axiosClient";
import {
  logoutThunk,
  getCurrentUserSession,
} from "@/features/auth/authThunk";
import { updateUserSession } from "@/features/auth/authSlice";
import { getTokens, isRefreshTokenExpired } from "@/utils/storage";
import { AlertProvider } from "@/components/ui/AlertProvider";
import { SocketManager } from "@/features/chat";
import { useSocket } from "@/features/chat/useSocket";
import type { SignalingPayload } from "@/types/call/call";
import { applySignalingPayload } from "@/features/call";
import "../global.css";

// ===============================
// AUTH + SESSION BOOTSTRAP + GUARD
// ===============================
function RootLayoutNav() {
  const router = useRouter();
  const segments = useSegments();
  const dispatch = useAppDispatch();
  const { isLogin, userSession } = useAppSelector((state) => state.auth);
  const callState = useAppSelector((state) => state.call);
  const latestSegmentsRef = useRef<string[]>([]);

  // Connect WebSocket when logged in
  useSocket();

  // =======================
  // Session Bootstrap
  // =======================
  useEffect(() => {
    let mounted = true;

    (async () => {
      const { accessToken } = await getTokens();

      if (mounted && isLogin && accessToken) {
        // Kiểm tra refresh token có hết hạn chưa
        const refreshExpired = await isRefreshTokenExpired();
        if (refreshExpired) {
          console.log("[Auth] Refresh token đã hết hạn, auto logout...");
          dispatch(logoutThunk());
          return;
        }

        dispatch(getCurrentUserSession());
      }
    })();

    return () => {
      mounted = false;
    };
  }, [isLogin, dispatch]);

  // =======================
  // Auth Guard
  // =======================
  useEffect(() => {
    latestSegmentsRef.current = segments as string[];
  }, [segments]);

  useEffect(() => {
    if (!isLogin || !userSession?.id) return;

    const unsub = SocketManager.on("CALL_SIGNALING", (event: SignalingPayload) => {
      // SESSION_ENDED là reply về chính user → không filter bởi senderId
      const isSelf = event.senderId === userSession.id;
      if (isSelf && event.type !== "SESSION_ENDED") {
        dispatch(applySignalingPayload({ event, currentUserId: userSession.id }));
        return;
      }

      dispatch(applySignalingPayload({ event, currentUserId: userSession.id }));

      const inCallScreen =
        latestSegmentsRef.current.includes("messages") &&
        latestSegmentsRef.current.includes("call");

      if (event.type !== "INVITE") return;
      if (isSelf) return;

      // Đang trong 1 cuộc gọi active thì bỏ qua INVITE mới
      const isActiveCall =
        callState.status === "calling" ||
        callState.status === "ringing" ||
        callState.status === "connected";
      if (isActiveCall && inCallScreen) return;

      const isGroup = event.activeParticipantCount > 2;

      router.push({
        pathname: "/(app)/messages/call/[roomId]",
        params: {
          roomId: String(event.roomId),
          mode: "incoming",
          callType: event.payload?.callType ?? "AUDIO",
          callerId: String(event.senderId),
          callerName: event.senderName ?? "",
          callSessionId: event.callSessionId,
          isGroup: isGroup ? "true" : "false",
          inviteNonce: `${event.callSessionId}-${Date.now()}`,
        },
      });
    });

    return () => {
      unsub?.();
    };
  }, [dispatch, isLogin, userSession?.id, router, callState.status]);

  useEffect(() => {
    const firstSegment = segments[0] as string | undefined;
    const inPublicGroup = firstSegment === "(public)";

    // Ma trận điều hướng:
    // - Chưa login: chỉ cho ở (public)
    // - Đã login: không cho ở (public)

    if (!isLogin && !inPublicGroup) {
      router.replace("/(public)/login");
      return;
    }

    if (isLogin && inPublicGroup) {
      router.replace("/(app)/messages");
      return;
    }
  }, [isLogin, segments, router]);

  return <Slot />;
}

export default function RootLayout() {
  useEffect(() => {
    setupAxiosInterceptors({
      onTokenRefreshed: (payload) => {
        if (payload.userSession) {
          store.dispatch(updateUserSession(payload));
        }
      },
      onLogout: () => {
        store.dispatch(logoutThunk());
      },
    });
  }, []);

  return (
    <Provider store={store}>
      <PersistGate
        persistor={persistor}
        loading={
          <View className="flex-1 items-center justify-center bg-background">
            <ActivityIndicator size="large" color="#9333ea" />
          </View>
        }
      >
        <SafeAreaProvider>
          <AlertProvider>
            <StatusBar style="auto" />
            <RootLayoutNav />
          </AlertProvider>
        </SafeAreaProvider>
      </PersistGate>
    </Provider>
  );
}
