import { Slot, useRouter, useSegments } from "expo-router";
import { useEffect, useState, useCallback } from "react";
import { Provider } from "react-redux";
import { View, ActivityIndicator } from "react-native";
import { store, useAppSelector } from "@/features/store";
import { setupAxiosInterceptors } from "@/lib/axiosClient";
import { logoutThunk } from "@/features/slices/authThunk";
import { getTokens } from "@/utils/storage";
import { setAuthData, updateTokenManually } from "@/features/slices/authSlice";
import "../global.css";

function RootLayoutNav() {
  const router = useRouter();
  const segments = useSegments();
  const { isLoggedIn, accessToken } = useAppSelector((state) => state.auth);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const loadAuthFromStorage = async () => {
      const { accessToken } = await getTokens();
      if (accessToken) {
        store.dispatch(setAuthData({ user: null, token: accessToken }));
      }
      setIsReady(true);
    };

    loadAuthFromStorage();
  }, []);

  const handleNavigation = useCallback(() => {
    if (!isReady) return;

    const firstSegment = segments[0] as string | undefined;
    const inPublicGroup = firstSegment === "(public)";
    const inAppGroup = firstSegment === "(app)";

    if (isLoggedIn || accessToken) {
      // User is logged in, redirect to app if in public routes
      if (inPublicGroup || !firstSegment) {
        router.replace("/(app)/messages" as never);
      }
    } else {
      // User is not logged in, redirect to login if in app routes
      if (inAppGroup || !firstSegment) {
        router.replace("/(public)/login" as never);
      }
    }
  }, [isReady, segments, isLoggedIn, accessToken, router]);

  useEffect(() => {
    handleNavigation();
  }, [handleNavigation]);

  if (!isReady) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return <Slot />;
}

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
  }, []);

  return (
    <Provider store={store}>
      <RootLayoutNav />
    </Provider>
  );
}
