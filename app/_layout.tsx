import { Slot, useRouter, useSegments } from "expo-router";
import { useEffect, useCallback } from "react";
import { Provider } from "react-redux";
import { View, ActivityIndicator } from "react-native";
import { store, persistor, useAppSelector } from "@/features/store";
import { setupAxiosInterceptors } from "@/lib/axiosClient";
import { logoutThunk } from "@/features/slices/authThunk";
import { updateTokenManually } from "@/features/slices/authSlice";
import { PersistGate } from "redux-persist/integration/react";
import { Colors } from "@/constants/Colors";
import "../global.css";

function RootLayoutNav() {
  const router = useRouter();
  const segments = useSegments();
  const { isLoggedIn, accessToken } = useAppSelector((state) => state.auth);
  // Remove manual isReady state as PersistGate handles waiting

  const handleNavigation = useCallback(() => {
    // Basic navigation protection
    const firstSegment = segments[0] as string | undefined;
    const inPublicGroup = firstSegment === "(public)";
    const inAppGroup = firstSegment === "(app)";

    if (isLoggedIn || accessToken) {
      if (inPublicGroup || !firstSegment) {
        router.replace("/(app)/messages" as never);
      }
    } else {
      if (inAppGroup || !firstSegment) {
        router.replace("/(public)/login" as never);
      }
    }
  }, [segments, isLoggedIn, accessToken, router]);

  useEffect(() => {
    handleNavigation();
  }, [handleNavigation]);

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
      <PersistGate
        loading={
          <View className="flex-1 items-center justify-center bg-black">
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        }
        persistor={persistor}
      >
        <RootLayoutNav />
      </PersistGate>
    </Provider>
  );
}
