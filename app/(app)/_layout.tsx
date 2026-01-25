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

// Standalone component for TabBarBackground
const TabBarBackground = ({ iosBlurClass }: { iosBlurClass: string }) => {
  if (Platform.OS === "ios") {
    return <View className={`flex-1 ${iosBlurClass}`} />;
  }
  return null;
};

export default function AppLayout() {
  const { mode } = useAppSelector((state) => state.theme);
  const insets = useSafeAreaInsets();
  const isDark = mode === "dark";
  const bottomPadding = insets.bottom > 0 ? insets.bottom : 20;
  const tabBarHeight = 65 + bottomPadding;

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
        tabBarBackground: () => <TabBarBackground iosBlurClass={colors.iosBlur} />,
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
