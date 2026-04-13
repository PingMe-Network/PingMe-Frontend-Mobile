import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Platform, Image, Switch } from "react-native";
import { router } from "expo-router";
import { Globe, MapPin, Calendar } from "lucide-react-native";
import { useAppDispatch, useAppSelector } from "@/features/store";
import { logoutThunk } from "@/features/auth/authThunk";
import { useTabBarHeight } from "@/hooks/useTabBarHeight";
import { Feather } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";
import { useAvatarUpdate } from "@/hooks/useAvatarUpdate";
import { useColorScheme } from "nativewind";
import { toggleTheme } from "@/features/theme/themeSlice";
import { AccountLayout } from "@/components/ui/AccountLayout";
import { getCurrentUserInfoApi } from "@/services/user/currentUserProfileApi";
import type { CurrentUserProfileResponse } from "@/types/auth";

type AccountMenuItem = {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentProps<typeof Feather>["name"];
  onPress: () => void;
};

type ProfileHeaderProps = {
  avatarSource: { uri: string };
  name: string;
  email: string;
  roleName: string;
  gender: string;
  address?: string;
  dob?: string;
  loading: boolean;
  isDark: boolean;
  updatingAvatar: boolean;
  onUpdateAvatar: () => void;
};

function ProfileHeader({
  avatarSource,
  name,
  email,
  roleName,
  gender,
  address,
  dob,
  loading,
  isDark,
  updatingAvatar,
  onUpdateAvatar,
}: Readonly<ProfileHeaderProps>) {
  return (
    <>
      <View className="h-40 bg-primary w-full" />

      <View className="items-center -mt-16 px-6">
        <View className="relative">
          <Image
            source={avatarSource}
            className="w-32 h-32 rounded-full border-4 border-white dark:border-background-dark bg-white"
            resizeMode="cover"
          />
          <TouchableOpacity
            className="absolute bottom-0 right-0 bg-white p-2 border border-gray-200 rounded-full shadow-sm"
            activeOpacity={0.8}
            onPress={onUpdateAvatar}
            disabled={updatingAvatar}
          >
            {updatingAvatar ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Feather name="camera" size={16} color={Colors.primary} />
            )}
          </TouchableOpacity>
        </View>

        <Text
          className={`text-2xl font-bold mt-4 ${
            isDark ? "text-white" : "text-midnight-velvet"
          }`}
        >
          {name}
        </Text>
        <View className="bg-gray-200 dark:bg-white/10 px-4 py-1.5 rounded-full mt-2">
          <Text className={`text-sm ${isDark ? "text-gray-300" : "text-gray-600"}`}>
            {email}
          </Text>
        </View>

        <View className="flex-row flex-wrap gap-2 mt-3">
          <View className="px-3 py-1 rounded-full bg-primary/10">
            <Text className="text-[10px] font-bold uppercase tracking-wider text-primary">
              {roleName}
            </Text>
          </View>
          <View className="px-3 py-1 rounded-full bg-secondary/10">
            <Text className="text-[10px] font-bold uppercase tracking-wider text-secondary">
              {gender}
            </Text>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator size="small" className="mt-4" color={Colors.primary} />
        ) : (
          <View className="mt-4 flex-row justify-center space-x-6">
            {address && (
              <View className="flex-row items-center space-x-1">
                <MapPin size={14} color={isDark ? "#9ca3af" : "#6b7280"} />
                <Text className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                  {address}
                </Text>
              </View>
            )}
            {dob && (
              <View className="flex-row items-center space-x-1">
                <Calendar size={14} color={isDark ? "#9ca3af" : "#6b7280"} />
                <Text className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                  {dob}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    </>
  );
}

type SettingsSectionProps = {
  isDark: boolean;
  menuItems: AccountMenuItem[];
  isThemeEnabled: boolean;
  thumbColor: string | undefined;
  onToggleTheme: () => void;
};

function SettingsSection({
  isDark,
  menuItems,
  isThemeEnabled,
  thumbColor,
  onToggleTheme,
}: Readonly<SettingsSectionProps>) {
  return (
    <View className="px-6 mt-8">
      <View className="flex-row items-center justify-between mb-4">
        <Text
          className={`text-xl font-bold ${
            isDark ? "text-white" : "text-midnight-velvet"
          }`}
        >
          Cài đặt tài khoản
        </Text>
        <TouchableOpacity>
          <Feather
            name="help-circle"
            size={20}
            color={isDark ? "#9ca3af" : "#6b7280"}
          />
        </TouchableOpacity>
      </View>

      <View
        className={`${
          isDark ? "bg-white/5" : "bg-white"
        } rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 overflow-hidden`}
      >
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={item.id}
            className={`flex-row items-center p-4 ${
              index === menuItems.length - 1
                ? ""
                : "border-b border-gray-100 dark:border-white/5"
            }`}
            onPress={item.onPress}
            activeOpacity={0.7}
          >
            <View
              className={`w-10 h-10 rounded-full items-center justify-center ${
                isDark ? "bg-primary/20" : "bg-primary/10"
              }`}
            >
              <Feather name={item.icon} size={20} color={Colors.primary} />
            </View>
            <View className="ml-4 flex-1">
              <Text
                className={`text-base font-semibold ${
                  isDark ? "text-white" : "text-midnight-velvet"
                }`}
              >
                {item.title}
              </Text>
              <Text
                className={`text-xs mt-0.5 ${
                  isDark ? "text-gray-400" : "text-gray-500"
                }`}
              >
                {item.description}
              </Text>
            </View>
            <Feather
              name="chevron-right"
              size={20}
              color={isDark ? "#4b5563" : "#d1d5db"}
            />
          </TouchableOpacity>
        ))}

        <TouchableOpacity className="flex-row items-center p-4 border-t border-gray-100 dark:border-white/5">
          <View
            className={`w-10 h-10 rounded-full items-center justify-center ${
              isDark ? "bg-primary/20" : "bg-primary/10"
            }`}
          >
            <Globe size={20} color={Colors.primary} />
          </View>
          <View className="ml-4 flex-1">
            <Text
              className={`text-base font-semibold ${
                isDark ? "text-white" : "text-midnight-velvet"
              }`}
            >
              Ngôn ngữ
            </Text>
            <Text
              className={`text-xs mt-0.5 ${
                isDark ? "text-gray-400" : "text-gray-500"
              }`}
            >
              Tiếng Việt
            </Text>
          </View>
          <Feather
            name="chevron-right"
            size={20}
            color={isDark ? "#4b5563" : "#d1d5db"}
          />
        </TouchableOpacity>

        <View className="flex-row items-center p-4 border-t border-gray-100 dark:border-white/5">
          <View
            className={`w-10 h-10 rounded-full items-center justify-center ${
              isDark ? "bg-primary/20" : "bg-primary/10"
            }`}
          >
            <Feather name={isThemeEnabled ? "moon" : "sun"} size={20} color={Colors.primary} />
          </View>
          <View className="ml-4 flex-1">
            <Text
              className={`text-base font-semibold ${
                isDark ? "text-white" : "text-midnight-velvet"
              }`}
            >
              Chế độ tối
            </Text>
            <Text
              className={`text-xs mt-0.5 ${
                isDark ? "text-gray-400" : "text-gray-500"
              }`}
            >
              {isThemeEnabled ? "Đang bật" : "Đang tắt"}
            </Text>
          </View>
          <Switch
            value={isThemeEnabled}
            onValueChange={onToggleTheme}
            trackColor={{ false: "#d1d5db", true: Colors.primary }}
            thumbColor={thumbColor}
          />
        </View>
      </View>
    </View>
  );
}

type LogoutSectionProps = {
  onLogout: () => void;
};

function LogoutSection({ onLogout }: Readonly<LogoutSectionProps>) {
  return (
    <View className="px-6 mt-10">
      <TouchableOpacity
        className="bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 p-4 rounded-xl flex-row items-center justify-center space-x-2"
        onPress={onLogout}
        activeOpacity={0.8}
      >
        <Feather name="log-out" size={20} color="#ef4444" />
        <Text className="text-red-500 font-semibold text-base ml-2">Đăng xuất</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function AccountScreen() {
  const dispatch = useAppDispatch();
  const { userSession: user } = useAppSelector((state) => state.auth);
  const { mode } = useAppSelector((state) => state.theme);
  const isDark = mode === "dark";
  const { setColorScheme } = useColorScheme();
  const tabBarHeight = useTabBarHeight();
  const { updatingAvatar, handleUpdateAvatar } = useAvatarUpdate();

  const [profile, setProfile] = useState<CurrentUserProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync Redux theme with NativeWind colorscheme
  useEffect(() => {
    setColorScheme(mode);
  }, [mode]);

  useEffect(() => {
    let mounted = true;
    getCurrentUserInfoApi()
      .then((res) => {
        if (mounted && res.data.data) {
          setProfile(res.data.data);
        }
      })
      .catch((err) => {
        console.log("Error fetching full profile", err);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const handleLogout = async () => {
    await dispatch(logoutThunk());
    router.replace("/(public)/login" as never);
  };

  const handleEditProfile = () => {
    router.push("/(app)/account/edit-profile");
  };

  const handleOpenDevices = () => {
    router.push("/(app)/account/devices");
  };

  const handleChangePassword = () => {
    router.push("/(app)/account/change-password");
  };

  const handleToggleTheme = () => {
    dispatch(toggleTheme());
  };

  const menuItems: AccountMenuItem[] = [
    {
      id: "edit-profile",
      title: "Chỉnh sửa thông tin",
      description: "Cập nhật tên, địa chỉ, ngày sinh",
      icon: "user",
      onPress: handleEditProfile,
    },
    {
      id: "devices",
      title: "Quản lý thiết bị",
      description: "Xem các phiên đăng nhập",
      icon: "monitor",
      onPress: handleOpenDevices,
    },
    {
      id: "password",
      title: "Thay đổi mật khẩu",
      description: "Bảo vệ tài khoản với mật khẩu mới",
      icon: "shield",
      onPress: handleChangePassword,
    },
  ];

  const thumbColor = Platform.select({
    ios: undefined,
    default: isDark ? "#fff" : "#f4f3f4",
  });

  const avatarUrl = (profile?.avatarUrl || user?.avatarUrl || "").trim();
  const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    profile?.name || user?.name || "User"
  )}&background=DF40A3&color=fff&size=200`;
  const avatarSource = avatarUrl ? { uri: avatarUrl } : { uri: defaultAvatar };
  const displayName = profile?.name || user?.name || "Người dùng";
  const displayEmail = profile?.email || user?.email || "email@example.com";
  const displayRole = profile?.roleName || user?.roleName || "MEMBER";
  const displayGender = profile?.gender || "OTHER";

  return (
    <AccountLayout noScrollView={true}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: tabBarHeight + 20 }}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <ProfileHeader
          avatarSource={avatarSource}
          name={displayName}
          email={displayEmail}
          roleName={displayRole}
          gender={displayGender}
          address={profile?.address}
          dob={profile?.dob}
          loading={loading}
          isDark={isDark}
          updatingAvatar={updatingAvatar}
          onUpdateAvatar={handleUpdateAvatar}
        />

        <SettingsSection
          isDark={isDark}
          menuItems={menuItems}
          isThemeEnabled={isDark}
          thumbColor={thumbColor}
          onToggleTheme={handleToggleTheme}
        />

        <LogoutSection onLogout={handleLogout} />
      </ScrollView>
    </AccountLayout>
  );
}
