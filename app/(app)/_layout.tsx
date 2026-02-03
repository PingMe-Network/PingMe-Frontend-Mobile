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

const MessagesIcon = ({ color, size }: { color: string; size: number }) => (
  <MessageCircle size={size} color={color} />
);

const ContactsIcon = ({ color, size }: { color: string; size: number }) => (
  <Users size={size} color={color} />
);

const MusicIcon = ({
  color,
  size,
  isPlaying,
  isMusicTab,
  pulseAnim
}: {
  color: string;
  size: number;
  isPlaying: boolean;
  isMusicTab: boolean;
  pulseAnim: Animated.Value;
}) => {
  if (isPlaying && !isMusicTab) {
    return (
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <Ionicons name="musical-notes" size={size} color={Colors.primary} />
      </Animated.View>
    );
  }
  return <Music size={size} color={color} />;
};

const ReelsIcon = ({ color, size }: { color: string; size: number }) => (
  <Film size={size} color={color} />
);

const AccountIcon = ({ color, size }: { color: string; size: number }) => (
  <CircleUserRound size={size} color={color} />
);

const MusicTabIcon = ({
  color,
  size,
  isPlaying,
  isMusicTab,
  pulseAnim
}: {
  color: string;
  size: number;
  isPlaying: boolean;
  isMusicTab: boolean;
  pulseAnim: Animated.Value;
}) => (
  <MusicIcon
    color={color}
    size={size}
    isPlaying={isPlaying}
    isMusicTab={isMusicTab}
    pulseAnim={pulseAnim}
  />
);

const MusicTabIconWithState = ({
  color,
  size,
  isPlaying,
  isMusicTab,
  pulseAnim,
}: {
  color: string;
  size: number;
  isPlaying: boolean;
  isMusicTab: boolean;
  pulseAnim: Animated.Value;
}) => (
  <MusicTabIcon
    color={color}
    size={size}
    isPlaying={isPlaying}
    isMusicTab={isMusicTab}
    pulseAnim={pulseAnim}
  />
);

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

  const renderMusicTabIcon = useCallback((props: { color: string; size: number }) => (
    <MusicTabIconWithState
      {...props}
      isPlaying={isPlaying}
      isMusicTab={isMusicTab}
      pulseAnim={pulseAnim}
    />
  ), [isPlaying, isMusicTab, pulseAnim]);

  return (
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
          tabBarIcon: MessagesIcon,
        }}
      />
      <Tabs.Screen
        name="contacts"
        options={{
          title: "Danh bạ",
          tabBarIcon: ContactsIcon,
        }}
      />
      <Tabs.Screen
        name="music"
        options={{
          title: "Âm nhạc",
          tabBarIcon: renderMusicTabIcon,
        }}
      />
      <Tabs.Screen
        name="reels"
        options={{
          title: "Thước Phim",
          tabBarIcon: ReelsIcon,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: "Tài khoản",
          tabBarIcon: AccountIcon,
        }}
      />
    </Tabs>
  );
}