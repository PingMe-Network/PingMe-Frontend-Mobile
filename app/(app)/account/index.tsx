import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, Image, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { 
  LogOut, ChevronRight, User,
  Shield, Globe, MapPin, Calendar, Activity, Laptop
} from "lucide-react-native";
import { useAppDispatch, useAppSelector } from "@/features/store";
import { logoutThunk } from "@/features/auth/authThunk";
import { useTabBarHeight } from "@/hooks/useTabBarHeight";
import { getCurrentUserInfoApi } from "@/services/user/currentUserProfileApi";
import type { CurrentUserProfileResponse } from "@/types/auth";

export default function AccountScreen() {
  const dispatch = useAppDispatch();
  const { userSession } = useAppSelector((state) => state.auth);
  const tabBarHeight = useTabBarHeight();

  const [profile, setProfile] = useState<CurrentUserProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    getCurrentUserInfoApi().then(res => {
      if(mounted && res.data.data) {
        setProfile(res.data.data);
      }
    }).catch(err => {
      console.log('Error fetching full profile', err);
    }).finally(() => {
      if(mounted) setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  const handleLogout = async () => {
    await dispatch(logoutThunk());
    router.replace("/(public)/login" as never);
  };

  const bgClass = "bg-background";
  const bgCardClass = "bg-card shadow-sm";
  const textTitleClass = "text-foreground";
  const textSubClass = "text-muted-foreground";
  const iconColor = "#71717A"; 
  const primaryIconColor = "#09090B";

  const renderSettingItem = (icon: React.ReactNode, title: string, subtitle?: string, hasArrow: boolean = true, isDestructive: boolean = false, onPress?: () => void) => (
    <TouchableOpacity 
      className={`flex-row items-center p-4 border-b border-gray-100 last:border-0`}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View className={`w-10 h-10 rounded-full items-center justify-center mr-4 ${isDestructive ? "bg-red-500/10" : "bg-primary/5"}`}>
        {icon}
      </View>
      <View className="flex-1">
        <Text className={`text-[15px] font-medium ${isDestructive ? "text-red-500" : textTitleClass}`}>{title}</Text>
        {subtitle && <Text className={`text-[13px] mt-0.5 ${textSubClass}`}>{subtitle}</Text>}
      </View>
      {hasArrow && <ChevronRight size={20} color={iconColor} />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className={`flex-1 ${bgClass}`} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: tabBarHeight + 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Branding */}
        <View className="px-6 py-6 pb-4">
          <Text className={`text-3xl font-black tracking-tight ${textTitleClass}`}>Tài khoản</Text>
        </View>

        {/* Profile Card */}
        <View className="px-6 mb-6">
          <View className={`p-5 rounded-[24px] ${bgCardClass}`}>
            <View className="flex-row items-center">
              <View className="relative">
                <Image 
                  source={{ uri: profile?.avatarUrl || userSession?.avatarUrl || "https://i.pravatar.cc/150?img=11" }} 
                  className="w-20 h-20 rounded-full bg-gray-200"
                />
                <View className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 rounded-full items-center justify-center border-2 border-white">
                  <Activity size={12} color="#fff" />
                </View>
              </View>
              
              <View className="ml-5 flex-1">
                <Text className={`text-xl font-bold ${textTitleClass}`} numberOfLines={1}>
                  {profile?.name || userSession?.name || "Người dùng"}
                </Text>
                <Text className={`text-sm mt-1 ${textSubClass}`} numberOfLines={1}>
                  {profile?.email || userSession?.email}
                </Text>

                <View className="flex-row flex-wrap gap-2 mt-3">
                  <View className={`px-2 py-1 rounded-md bg-primary/10`}>
                    <Text className={`text-[10px] font-bold uppercase tracking-wider text-primary`}>
                      {profile?.roleName || userSession?.roleName || "MEMBER"}
                    </Text>
                  </View>
                  <View className={`px-2 py-1 rounded-md bg-secondary`}>
                    <Text className={`text-[10px] font-bold uppercase tracking-wider text-secondary-foreground`}>
                      {profile?.gender || "OTHER"}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {loading ? (
               <ActivityIndicator size="small" className="mt-4" color="#c026d3" />
            ) : (
              <View className={`mt-5 pt-4 flex-row border-t border-gray-100`}>
                <View className="flex-1 flex-row items-center justify-center gap-2 border-r border-gray-200 pr-2">
                  <MapPin size={14} color={iconColor} />
                  <Text className={`text-xs ${textSubClass}`} numberOfLines={1}>{profile?.address || "Chưa cập nhật TT"}</Text>
                </View>
                <View className="flex-1 flex-row items-center justify-center gap-2 pl-2">
                  <Calendar size={14} color={iconColor} />
                  <Text className={`text-xs ${textSubClass}`}>{profile?.dob || "Chưa có ngày sinh"}</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Section: App Settings */}
        <View className="px-6 mb-6">
          <Text className={`text-sm font-bold uppercase tracking-wider mb-3 ml-2 text-primary/70`}>Cài đặt ứng dụng</Text>
          <View className={`rounded-[24px] overflow-hidden ${bgCardClass}`}>
            {renderSettingItem(<Globe size={20} color={primaryIconColor} />, "Ngôn ngữ", "Tiếng Việt", true, false)}
          </View>
        </View>

        {/* Section: Account Actions */}
        <View className="px-6 mb-8">
          <Text className={`text-sm font-bold uppercase tracking-wider mb-3 ml-2 text-primary/70`}>Bảo mật & Tài khoản</Text>
          <View className={`rounded-[24px] overflow-hidden ${bgCardClass}`}>
            {renderSettingItem(<User size={20} color={primaryIconColor} />, "Chỉnh sửa thông tin", "Cập nhật tên, địa chỉ, tuổi", true, false, () => router.push("/(app)/account/edit-profile" as never))}
            {renderSettingItem(<Shield size={20} color={primaryIconColor} />, "Đổi mật khẩu", "Bảo mật & xác thực 2 lớp", true, false, () => router.push("/(app)/account/change-password" as never))}
            {renderSettingItem(<Laptop size={20} color={primaryIconColor} />, "Quản lý thiết bị", "Xem các phiên đăng nhập", true, false, () => router.push("/(app)/account/devices" as never))}
            {renderSettingItem(<LogOut size={20} color="#EF4444" />, "Đăng xuất", "Thoát tài khoản PingMe", false, true, handleLogout)}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
