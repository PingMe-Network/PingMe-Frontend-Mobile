import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAppDispatch, useAppSelector } from "@/features/store";
import { logoutThunk } from "@/features/slices/authThunk";

export default function AccountScreen() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const handleLogout = async () => {
    await dispatch(logoutThunk());
    router.replace("/(public)/login" as never);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-6 pt-6">
        {/* Header */}
        <Text className="text-2xl font-bold text-gray-800 mb-6">Tai khoan</Text>

        {/* User Info */}
        <View className="bg-gray-50 rounded-xl p-4 mb-6">
          <Text className="text-lg font-semibold text-gray-800">
            {user?.name || "Nguoi dung"}
          </Text>
          <Text className="text-gray-500 mt-1">
            {user?.email || "email@example.com"}
          </Text>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          className="bg-red-500 p-4 rounded-xl items-center mt-auto mb-6"
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Text className="text-white font-semibold text-base">Dang xuat</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
