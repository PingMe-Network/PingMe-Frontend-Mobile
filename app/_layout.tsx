import { Slot, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { Provider } from "react-redux";
import { View, ActivityIndicator } from "react-native";
import { PersistGate } from "redux-persist/integration/react";
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
} from "@/features/slices/authThunk";
import { updateUserSession } from "@/features/slices/authSlice";
import { getTokens } from "@/utils/storage";
import { Colors } from "@/constants/Colors";
import { AlertProvider } from "@/components/ui/AlertProvider";
import "../global.css";

// ===============================
// AUTH + SESSION BOOTSTRAP + GUARD
// ===============================
function RootLayoutNav() {
  const router = useRouter();
  const segments = useSegments();
  const dispatch = useAppDispatch();
  const { isLogin } = useAppSelector((state) => state.auth);

  // =======================
  // Session Bootstrap
  // =======================
  useEffect(() => {
    let mounted = true;

    (async () => {
      const { accessToken } = await getTokens();
      if (mounted && isLogin && accessToken) {
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

// ===============================
// ROOT
// ===============================
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
          <View className="flex-1 items-center justify-center bg-black">
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        }
      >
        <AlertProvider>
          <RootLayoutNav />
        </AlertProvider>
      </PersistGate>
    </Provider>
  );
}
