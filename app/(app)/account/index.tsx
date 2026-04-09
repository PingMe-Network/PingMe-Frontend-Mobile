import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Platform, Alert, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, Stack } from "expo-router";
import { useAppDispatch, useAppSelector } from "@/features/store";
import { logoutThunk, getCurrentUserSession } from "@/features/auth/authThunk";
import { useTabBarHeight } from "@/hooks/useTabBarHeight";
import { Ionicons, Feather } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";
import * as ImagePicker from "expo-image-picker";
import { updateCurrentUserAvatarApi } from "@/services/user/currentUserProfileApi";
import { getErrorMessage } from "@/utils/errorMessageHandler";
import { useColorScheme } from "nativewind";
import { toggleTheme } from "@/features/theme/themeSlice";
import { Switch } from "react-native";

export default function AccountScreen() {
  const dispatch = useAppDispatch();
  const { userSession: user } = useAppSelector((state) => state.auth);
  const { mode } = useAppSelector((state) => state.theme);
  const isDark = mode === "dark";
  const { colorScheme, setColorScheme } = useColorScheme();
  const tabBarHeight = useTabBarHeight();
  const [updatingAvatar, setUpdatingAvatar] = useState(false);

  // Sync Redux theme with NativeWind colorscheme
  React.useEffect(() => {
    setColorScheme(mode);
  }, [mode]);

  const handleLogout = async () => {
    await dispatch(logoutThunk());
    router.replace("/(public)/login" as never);
  };

  const handleUpdateAvatar = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Lỗi", "Bạn cần cấp quyền truy cập thư viện ảnh để thay đổi ảnh đại diện");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setUpdatingAvatar(true);
        const selectedImage = result.assets[0];
        
        const formData = new FormData();
        formData.append('avatar', {
          uri: selectedImage.uri,
          name: 'avatar.jpg',
          type: 'image/jpeg',
        } as any);

        await updateCurrentUserAvatarApi(formData);
        await dispatch(getCurrentUserSession());
        Alert.alert("Thành công", "Cập nhật ảnh đại diện thành công");
      }
    } catch (error) {
      console.error("Update avatar error:", error);
      Alert.alert("Lỗi", getErrorMessage(error, "Không thể cập nhật ảnh đại diện"));
    } finally {
      setUpdatingAvatar(false);
    }
  };

  const menuItems = [
    {
      id: "profile",
      title: "Thông tin cá nhân",
      description: "Quản lý thông tin cá nhân của bạn",
      icon: "user",
      iconType: "feather",
      onPress: () => router.push("/(app)/account/profile"),
    },
    {
      id: "password",
      title: "Thay đổi mật khẩu",
      description: "Bảo vệ tài khoản với mật khẩu mới",
      icon: "key",
      iconType: "feather",
      onPress: () => router.push("/(app)/account/password"),
    },
  ];

  return (
    <SafeAreaView className={`flex-1 ${isDark ? "bg-background-dark" : "bg-background-light"}`} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: tabBarHeight + 20 }}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Cover Image Area */}
        <View className="h-40 bg-primary w-full" />
        
        {/* Profile Info Overlapping Cover */}
        <View className="items-center -mt-16 px-6">
          <View className="relative">
            <Image
              source={
                user?.avatarUrl 
                  ? { uri: user.avatarUrl.trim() } 
                  : { uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "User")}&background=DF40A3&color=fff&size=200` }
              }
              className="w-32 h-32 rounded-full border-4 border-white dark:border-background-dark bg-white"
              resizeMode="cover"
            />
            <TouchableOpacity 
              className="absolute bottom-0 right-0 bg-white p-2 border border-gray-200 rounded-full shadow-sm"
              activeOpacity={0.8}
              onPress={handleUpdateAvatar}
              disabled={updatingAvatar}
            >
              {updatingAvatar ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <Feather name="camera" size={16} color={Colors.primary} />
              )}
            </TouchableOpacity>
          </View>
          
          <Text className={`text-2xl font-bold mt-4 ${isDark ? "text-white" : "text-midnight-velvet"}`}>
            {user?.name || "Người dùng"}
          </Text>
          <View className="bg-gray-200 dark:bg-white/10 px-4 py-1.5 rounded-full mt-2">
            <Text className={`text-sm ${isDark ? "text-gray-300" : "text-gray-600"}`}>
              {user?.email || "email@example.com"}
            </Text>
          </View>
        </View>

        {/* Cài đặt tài khoản section */}
        <View className="px-6 mt-8">
          <View className="flex-row items-center justify-between mb-4">
            <Text className={`text-xl font-bold ${isDark ? "text-white" : "text-midnight-velvet"}`}>
              Cài đặt tài khoản
            </Text>
            <TouchableOpacity>
              <Feather name="help-circle" size={20} color={isDark ? "#9ca3af" : "#6b7280"} />
            </TouchableOpacity>
          </View>

          <View className={`${isDark ? "bg-white/5" : "bg-white"} rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 overflow-hidden`}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={item.id}
                className={`flex-row items-center p-4 ${index !== menuItems.length - 1 ? 'border-b border-gray-100 dark:border-white/5' : ''}`}
                onPress={item.onPress}
                activeOpacity={0.7}
              >
                <View className={`w-10 h-10 rounded-full items-center justify-center ${isDark ? 'bg-primary/20' : 'bg-primary/10'}`}>
                  {item.iconType === "feather" ? (
                    <Feather name={item.icon as any} size={20} color={Colors.primary} />
                  ) : (
                    <Ionicons name={item.icon as any} size={20} color={Colors.primary} />
                  )}
                </View>
                <View className="ml-4 flex-1">
                  <Text className={`text-base font-semibold ${isDark ? "text-white" : "text-midnight-velvet"}`}>
                    {item.title}
                  </Text>
                  <Text className={`text-xs mt-0.5 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                    {item.description}
                  </Text>
                </View>
                  <Feather name="chevron-right" size={20} color={isDark ? "#4b5563" : "#d1d5db"} />
                </TouchableOpacity>
              ))}

              {/* Theme Toggle Row */}
              <View className="flex-row items-center p-4 border-t border-gray-100 dark:border-white/5">
                <View className={`w-10 h-10 rounded-full items-center justify-center ${isDark ? 'bg-primary/20' : 'bg-primary/10'}`}>
                  <Feather name={isDark ? "moon" : "sun"} size={20} color={Colors.primary} />
                </View>
                <View className="ml-4 flex-1">
                  <Text className={`text-base font-semibold ${isDark ? "text-white" : "text-midnight-velvet"}`}>
                    Chế độ tối
                  </Text>
                  <Text className={`text-xs mt-0.5 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                    {isDark ? "Đang bật" : "Đang tắt"}
                  </Text>
                </View>
                <Switch
                  value={isDark}
                  onValueChange={() => { dispatch(toggleTheme()); }}
                  trackColor={{ false: "#d1d5db", true: Colors.primary }}
                  thumbColor={Platform.OS === "ios" ? undefined : (isDark ? "#fff" : "#f4f3f4")}
                />
              </View>
            </View>
          </View>

        {/* Logout */}
        <View className="px-6 mt-10">
          <TouchableOpacity
            className="bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 p-4 rounded-xl flex-row items-center justify-center space-x-2"
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <Feather name="log-out" size={20} color="#ef4444" />
            <Text className="text-red-500 font-semibold text-base ml-2">Đăng xuất</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
