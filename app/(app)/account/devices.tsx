import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ChevronLeft, Smartphone, Laptop, Trash2 } from "lucide-react-native";
import { useAppSelector } from "@/features/store";
import { getCurrentUserAllDeviceMetasApi, deleteCurrentUserDeviceMetaApi } from "@/services/user/currentUserSessionApi";
import type { CurrentUserSessionMetaResponse } from "@/types/auth";

export default function DevicesScreen() {
  const { mode } = useAppSelector((state) => state.theme);
  const isDark = mode === "dark";

  const [devices, setDevices] = useState<CurrentUserSessionMetaResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDevices = async () => {
    setLoading(true);
    try {
      const res = await getCurrentUserAllDeviceMetasApi();
      if (res.data.data) {
        setDevices(res.data.data);
      }
    } catch (err) {
      console.log("Error fetching devices", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const revokeSession = async (sessionId: string) => {
    try {
      await deleteCurrentUserDeviceMetaApi(sessionId);
      setDevices((prev) => prev.filter((d) => d.sessionId !== sessionId));
    } catch (error) {
      console.log("Error deleting session", error);
      Alert.alert("Lỗi", "Không thể xóa phiên đăng nhập này.");
    }
  };

  const handleRevoke = (sessionId: string) => {
    Alert.alert("Đăng xuất thiết bị", "Bạn có chắc chắn muốn đăng xuất khỏi thiết bị này?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Đồng ý",
        style: "destructive",
        onPress: () => {
          void revokeSession(sessionId);
        },
      },
    ]);
  };

  const bgClass = isDark ? "bg-background-dark" : "bg-background-light";
  const bgCardClass = isDark ? "bg-[#252123]" : "bg-white border border-gray-100 shadow-sm";
  const textTitleClass = isDark ? "text-white" : "text-gray-900";
  const textSubClass = isDark ? "text-gray-400" : "text-gray-500";
  const iconColor = isDark ? "#FFF" : "#111";

  const getDeviceIcon = (deviceType?: string, os?: string) => {
    const normalizedType = (deviceType || "").toLowerCase();
    const normalizedOs = (os || "").toLowerCase();

    if (normalizedType.includes("desktop") || normalizedType.includes("laptop") || normalizedOs.includes("windows") || normalizedOs.includes("mac") || normalizedOs.includes("linux")) {
      return <Laptop size={24} color={iconColor} />;
    }
    return <Smartphone size={24} color={iconColor} />;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Không xác định";
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const renderDeviceItem = (device: CurrentUserSessionMetaResponse) => {
    const isCurrent = device.current;

    return (
      <View key={device.sessionId} className={`p-4 rounded-[20px] mb-4 flex-row items-center border ${isDark ? "border-[#363234]" : "border-gray-100"} ${bgCardClass}`}>
        <View className={`w-12 h-12 rounded-full items-center justify-center ${isDark ? "bg-gray-800" : "bg-gray-50"}`}>
          {getDeviceIcon(device.deviceType, device.os)}
        </View>

        <View className="flex-1 ml-4 pr-2">
          <View className="flex-row items-center">
            <Text className={`font-bold text-[15px] ${textTitleClass}`}>{device.deviceType || "Thiết bị không rõ"}</Text>
            {isCurrent && (
              <View className="ml-2 px-2 py-0.5 bg-green-500 rounded-md">
                <Text className="text-[10px] font-bold text-white uppercase">Hiện tại</Text>
              </View>
            )}
          </View>
          <Text className={`text-xs mt-1 ${textSubClass}`}>OS: {device.os || "N/A"}</Text>
          <Text className={`text-xs mt-0.5 ${textSubClass}`}>Trình duyệt: {device.browser || "N/A"}</Text>
          <Text className={`text-xs mt-0.5 ${textSubClass}`}>Hoạt động gần nhất: {formatDate(device.lastActiveAt)}</Text>
        </View>

        {!isCurrent && (
          <TouchableOpacity
            className="p-3 rounded-full bg-red-500/10 items-center justify-center"
            onPress={() => handleRevoke(device.sessionId)}
          >
            <Trash2 size={20} color="#EF4444" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView className={`flex-1 ${bgClass}`} edges={['top', 'left', 'right']}>
      <View className="px-4 py-4 flex-row items-center border-b" style={{ borderBottomColor: isDark ? '#363234' : '#f3f4f6' }}>
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <ChevronLeft size={24} color={iconColor} />
        </TouchableOpacity>
        <Text className={`ml-2 text-xl font-bold ${textTitleClass}`}>Quản lý thiết bị</Text>
      </View>

      <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
        <Text className={`mb-6 ${textSubClass}`}>
          Danh sách các thiết bị hiện đang đăng nhập vào tài khoản PingMe của bạn.
        </Text>

        {loading ? (
          <ActivityIndicator size="large" color="#DF40A3" className="mt-10" />
        ) : (
          devices.map(renderDeviceItem)
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
