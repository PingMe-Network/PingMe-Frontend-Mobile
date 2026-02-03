import { Tabs, usePathname } from "expo-router";
import { useCallback, useEffect, useRef } from "react";
import {
  MessageCircle,
  Users,
  Music,
  Film,
  CircleUserRound,
} from "lucide-react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform, Animated, Easing } from "react-native";
import { useAppSelector, useAppDispatch } from "@/features/store";
import { pauseSong } from "@/features/slices/playerSlice";
import { Colors } from "@/constants/Colors";
import { TabBarBackground } from "@/components/ui/TabBarBackground";

export default function AppLayout() {
  const dispatch = useAppDispatch();
  const { mode } = useAppSelector((state) => state.theme);
  const { isPlaying } = useAppSelector((state) => state.player);
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const isDark = mode === "dark";
  const bottomPadding = insets.bottom > 0 ? insets.bottom : 20;
  const tabBarHeight = 65 + bottomPadding;

  // Animation for music icon
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const isMusicTab = pathname?.includes('/music');
  const isReelsTab = pathname?.includes('/reels');

  // Pause music when switching to reels tab
  useEffect(() => {
    if (isReelsTab && isPlaying) {
      dispatch(pauseSong());
    }
  }, [isReelsTab, isPlaying, dispatch]);

  useEffect(() => {
    if (isPlaying && !isMusicTab) {
      // Start pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      // Reset animation
      pulseAnim.setValue(1);
    }
  }, [isPlaying, isMusicTab, pulseAnim]);

  // Helper to determine tab bar background color
  const getTabBarBackground = () => {
    if (Platform.OS === "ios") {
      if (isDark) {
        return "rgba(28, 25, 27, 0.85)";
      }
      return "rgba(255, 249, 250, 0.85)";
    }

    if (isDark) {
      return Colors.background.dark;
    }
    return Colors.background.light;
  };

  const getTabBarInactiveColor = () => {
    if (isDark) {
      return Colors.tabBar.inactiveDark;
    }
    return Colors.tabBar.inactiveLight;
  };

  const getIosBlurClass = () => {
    if (isDark) {
      return "bg-black/80";
    }
    return "bg-white/90";
  }

  const colors = {
    tabBarBackground: getTabBarBackground(),
    tabBarActive: Colors.primary,
    tabBarInactive: getTabBarInactiveColor(),
    iosBlur: getIosBlurClass(),
  };

  const renderTabBarBackground = useCallback(() => (
    <TabBarBackground iosBlurClass={colors.iosBlur} />
  ), [colors.iosBlur]);

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.tabBarActive,
          tabBarInactiveTintColor: colors.tabBarInactive,
          tabBarLabelPosition: "below-icon",
          tabBarStyle: {
            backgroundColor: colors.tabBarBackground,
            borderTopWidth: 0,
            elevation: 0,
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: tabBarHeight,
            paddingTop: 10,
            paddingBottom: bottomPadding,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "500",
            marginTop: 4,
          },
          tabBarBackground: renderTabBarBackground,
        }}
      >
        <Tabs.Screen
          name="messages"
          options={{
            title: "Tin nhắn",
            tabBarIcon: ({ color, size }) => (
              <MessageCircle size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="contacts"
          options={{
            title: "Danh bạ",
            tabBarIcon: ({ color, size }) => <Users size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="music"
          options={{
            title: "Âm nhạc",
            tabBarIcon: ({ color, size }) => {
              // Show animated icon when playing and NOT on music tab
              if (isPlaying && !isMusicTab) {
                return (
                  <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                    <Ionicons name="musical-notes" size={size} color={Colors.primary} />
                  </Animated.View>
                );
              }
              // Show normal icon when on music tab or not playing
              return <Music size={size} color={color} />;
            },
          }}
        />
        <Tabs.Screen
          name="reels"
          options={{
            title: "Thước Phim",
            tabBarIcon: ({ color, size }) => <Film size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="account"
          options={{
            title: "Tài khoản",
            tabBarIcon: ({ color, size }) => (
              <CircleUserRound size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </>
  );
}
