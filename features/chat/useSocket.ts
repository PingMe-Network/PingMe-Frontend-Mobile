import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/features/store";
import { SocketManager } from "./socketManager";

export const useSocket = () => {
  const dispatch = useAppDispatch();
  const { userSession, isLogin } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (!userSession?.id || !isLogin) return;

    const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;
    if (!BASE_URL) return;

    console.log("[PingMe] Connecting SocketManager via useSocket...");

    SocketManager.connect({
      baseUrl: BASE_URL,
      dispatch: dispatch,
      onDisconnect: (reason?: string) => {
        console.warn("[PingMe] SocketManager disconnected:", reason);
      },
    });

    return () => {
      console.log("[PingMe] Disconnecting SocketManager...");
      SocketManager.disconnect();
    };
  }, [userSession?.id, isLogin, dispatch]);
};
