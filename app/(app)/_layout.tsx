import { Tabs } from "expo-router";
import {
  MessageCircle,
  Users,
  Music,
  Film,
  CircleUserRound,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform, View } from "react-native";
import { useAppSelector } from "@/features/store";
import { Colors } from "@/constants/Colors";

export default function AppLayout() {
  const { mode } = useAppSelector((state) => state.theme);
  const insets = useSafeAreaInsets(); // Get safe area insets
  const isDark = mode === "dark";

  // Dynamic height calculation
  // Base height 60 + bottom inset (or 10px min padding if no inset like some Androids)
  // Dynamic height calculation
  // Base content height 65 + bottom inset (or 20px padding for devices without home indicator)
  const bottomPadding = insets.bottom > 0 ? insets.bottom : 20;
  const tabBarHeight = 65 + bottomPadding;

  // Define colors based on theme
  const colors = {
    tabBarBackground: isDark
      ? (Platform.OS === "ios" ? "rgba(28, 25, 27, 0.85)" : Colors.background.dark)
      : (Platform.OS === "ios" ? "rgba(255, 249, 250, 0.85)" : Colors.background.light),
    tabBarActive: Colors.primary,
    tabBarInactive: isDark ? Colors.tabBar.inactiveDark : Colors.tabBar.inactiveLight,
    iosBlur: isDark ? "bg-black/80" : "bg-white/90",
  };

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
        tabBarBackground: () => (
          Platform.OS === "ios" ? (
            <View className={`flex-1 ${colors.iosBlur}`} />
          ) : undefined
        ),
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
          tabBarIcon: ({ color, size }) => <Music size={size} color={color} />,
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
  );
}
