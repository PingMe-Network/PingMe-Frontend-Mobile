import { Stack } from "expo-router";
import { useEffect } from "react";
import { Provider } from "react-redux";
import { store } from "@/features/store";
import { setupAxiosInterceptors } from "@/lib/axiosClient";
import { logoutThunk } from "@/features/slices/authThunk";
import { getTokens } from "@/utils/storage";
import { setAuthData, updateTokenManually } from "@/features/slices/authSlice";
import "../global.css";

export default function RootLayout() {
  useEffect(() => {
    setupAxiosInterceptors({
      onTokenRefreshed: (payload) => {
        store.dispatch(updateTokenManually(payload));
      },
      onLogout: () => {
        store.dispatch(logoutThunk());
      },
    });

    const loadAuthFromStorage = async () => {
      const { accessToken } = await getTokens();
      if (accessToken) {
        store.dispatch(setAuthData({ user: null, token: accessToken }));
      }
    };

    loadAuthFromStorage();
  }, []);

  return (
    <Provider store={store}>
      <Stack screenOptions={{ headerShown: false }}></Stack>
    </Provider>
  );
}
