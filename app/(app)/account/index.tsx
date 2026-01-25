import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAppDispatch, useAppSelector } from "@/features/store";
import { logoutThunk } from "@/features/slices/authThunk";
import { toggleTheme } from "@/features/slices/themeSlice";
import { useTabBarHeight } from "@/hooks/useTabBarHeight";

export default function AccountScreen() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { mode } = useAppSelector((state) => state.theme);
  const isDark = mode === "dark";
  const tabBarHeight = useTabBarHeight();

  const handleLogout = async () => {
    await dispatch(logoutThunk());
    router.replace("/(public)/login" as never);
  };

  return (
    <SafeAreaView className={`flex-1 ${isDark ? "bg-background-dark" : "bg-background-light"}`}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: tabBarHeight + 20 }}
        className="px-6 pt-6"
        showsVerticalScrollIndicator={false}
        decelerationRate="fast"
        scrollEventThrottle={16}
        bounces={true}
        overScrollMode="never"
      >
        {/* Header */}
        <Text className={`text-2xl font-bold mb-6 ${isDark ? "text-white" : "text-midnight-velvet"}`}>Tai khoan</Text>

        {/* User Info */}
        <View className={`${isDark ? "bg-white/5 border-white/10" : "bg-white border-gray-100 shadow-sm"} border rounded-custom p-4 mb-6`}>
          <Text className={`text-lg font-semibold ${isDark ? "text-white" : "text-midnight-velvet"}`}>
            {user?.name || "Nguoi dung"}
          </Text>
          <Text className="text-gray-400 mt-1">
            {user?.email || "email@example.com"}
          </Text>
        </View>

        {/* Theme Settings */}
        <View className="mb-6">
          <Text className={`font-medium mb-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}>Giao diện</Text>
          <TouchableOpacity
            className={`${isDark ? "bg-white/5 border-white/10" : "bg-white border-gray-100 shadow-sm"} border rounded-custom p-4 mb-3 flex-row justify-between items-center`}
            onPress={() => dispatch(toggleTheme())}
          >
            <Text className={isDark ? "text-white" : "text-midnight-velvet"}>Chế độ tối</Text>
            {/* Simple toggle indicator */}
            <View className={`w-12 h-6 rounded-full ${isDark ? 'bg-primary' : 'bg-gray-300'} justify-center px-1`}>
              <View className={`w-4 h-4 rounded-full bg-white ${isDark ? 'self-end' : 'self-start'}`} />
            </View>
          </TouchableOpacity>
        </View>

        {/* General Settings */}
        <View className="mb-6">
          <Text className={`font-medium mb-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}>Cài đặt chung</Text>
          {["Thông báo", "Quyền riêng tư", "Ngôn ngữ", "Trợ giúp", "Về chúng tôi"].map((item, index) => (
            <View key={index} className={`${isDark ? "bg-white/5 border-white/10" : "bg-white border-gray-100 shadow-sm"} border rounded-custom p-4 mb-3`}>
              <Text className={isDark ? "text-white" : "text-midnight-velvet"}>{item}</Text>
            </View>
          ))}
        </View>

        {/* Logout Button - Pushed to bottom if content is short, purely by layout flow if content is long */}
        <View className="mt-auto">
          <TouchableOpacity
            className="bg-red-500 p-4 rounded-custom items-center"
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <Text className="text-white font-semibold text-base">Dang xuat</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
