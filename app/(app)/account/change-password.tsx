import { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useAppSelector } from "@/features/store";
import { updateCurrentUserPasswordApi } from "@/services/user/currentUserProfileApi";
import { InputField } from "@/components/ui/InputField";
import { Button } from "@/components/ui/Button";

export default function ChangePasswordScreen() {
  const { mode } = useAppSelector((state) => state.theme);
  const isDark = mode === "dark";

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ các trường.");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Lỗi", "Mật khẩu mới không khớp!");
      return;
    }
    setSaving(true);
    try {
      await updateCurrentUserPasswordApi({
        oldPassword,
        newPassword
      });
      Alert.alert("Thành công", "Đổi mật khẩu thành công!", [
        { text: "OK", onPress: () => router.back() }
      ]);
    } catch (error: any) {
      console.log("Change password error:", error);
      const msg = error?.response?.data?.message || "Không thể đổi mật khẩu. Vui lòng kiểm tra lại.";
      Alert.alert("Thất bại", msg);
    } finally {
      setSaving(false);
    }
  };

  const bgClass = isDark ? "bg-background-dark" : "bg-background-light";
  const textTitleClass = isDark ? "text-white" : "text-gray-900";
  const textSubClass = isDark ? "text-gray-400" : "text-gray-500";
  const iconColor = isDark ? "#FFF" : "#111";

  return (
    <SafeAreaView className={`flex-1 ${bgClass}`} edges={['top', 'left', 'right']}>
      <View className="px-4 py-4 flex-row items-center border-b" style={{ borderBottomColor: isDark ? '#363234' : '#f3f4f6' }}>
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <ChevronLeft size={24} color={iconColor} />
        </TouchableOpacity>
        <Text className={`ml-2 text-xl font-bold ${textTitleClass}`}>Đổi mật khẩu</Text>
      </View>

      <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
        <Text className={`mb-6 ${textSubClass}`}>
          Mật khẩu mới của bạn phải chứa ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số.
        </Text>

        <InputField
          label="Mật khẩu hiện tại"
          value={oldPassword}
          onChangeText={setOldPassword}
          placeholder="Nhập mật khẩu cũ"
          secureTextEntry
        />
        
        <InputField
          label="Mật khẩu mới"
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="Nhập mật khẩu mới"
          secureTextEntry
        />
        
        <InputField
          label="Xác nhận mật khẩu mới"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Nhập lại mật khẩu mới"
          secureTextEntry
        />

        <View className="mt-6">
          <Button
            title={saving ? "Đang xử lý..." : "Cập nhật mật khẩu"}
            onPress={handleSave}
            disabled={saving}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
