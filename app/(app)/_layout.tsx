import { Tabs } from "expo-router";
import {
  MessageCircle,
  Users,
  Music,
  Film,
  CircleUserRound,
} from "lucide-react-native";

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#2563EB",
        tabBarInactiveTintColor: "#9CA3AF",
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopWidth: 1,
          borderTopColor: "#E5E7EB",
          paddingTop: 8,
          paddingBottom: 8,
          height: 70,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "500",
          marginTop: 4,
        },
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
