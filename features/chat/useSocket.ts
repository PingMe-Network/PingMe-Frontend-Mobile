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

    SocketManager.connect({
      baseUrl: BASE_URL,
      dispatch: dispatch,
    });

    return () => {
      SocketManager.disconnect();
    };
  }, [userSession?.id, isLogin, dispatch]);
};
