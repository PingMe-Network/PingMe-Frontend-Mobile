import { useState } from "react";
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator, Alert } from "react-native";
import { router } from "expo-router";
import { updateCurrentUserPasswordApi } from "@/services/user/currentUserProfileApi";
import { Feather, Ionicons } from "@expo/vector-icons";
import { getErrorMessage } from "@/utils/errorMessageHandler";
import { Colors } from "@/constants/Colors";
import { useAppSelector } from "@/features/store";
import { AccountLayout } from "@/components/ui/AccountLayout";

const InputAuthField = ({ label, value, onChangeText, showPassword, setShowPassword, placeholder, isDark }: any) => (
  <View className="mb-6">
    <Text className={`text-sm font-medium mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
      {label} <Text className="text-red-500">*</Text>
    </Text>
    <View className={`flex-row items-center px-4 py-1 border rounded-xl ${isDark ? "border-white/20" : "border-gray-200"}`}>
      <Feather name="lock" size={18} color={isDark ? "#9ca3af" : "#6b7280"} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={isDark ? "#6b7280" : "#9ca3af"}
        secureTextEntry={!showPassword}
        className={`flex-1 py-3 px-3 text-base ${isDark ? "text-white" : "text-midnight-velvet"}`}
      />
      <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="p-2">
        <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color={isDark ? "#9ca3af" : "#6b7280"} />
      </TouchableOpacity>
    </View>
  </View>
);

export default function PasswordScreen() {
  const { mode } = useAppSelector((state) => state.theme);
  const isDark = mode === "dark";

  const [submitting, setSubmitting] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSave = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert("Lỗi", "Vui lòng điền đầy đủ các trường");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Lỗi", "Mật khẩu mới không khớp");
      return;
    }

    try {
      setSubmitting(true);
      await updateCurrentUserPasswordApi({
        oldPassword,
        newPassword
      });

      Alert.alert("Thành công", "Đổi mật khẩu thành công", [
        { text: "OK", onPress: () => router.back() }
      ]);
    } catch (error) {
      Alert.alert("Lỗi", getErrorMessage(error, "Đổi mật khẩu thất bại"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AccountLayout title="Thay đổi mật khẩu">
      <View className="flex-row items-center mb-1">
        <View className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${isDark ? 'bg-primary/20' : 'bg-primary/10'}`}>
          <Feather name="key" size={16} color={Colors.primary} />
        </View>
        <Text className={`text-xl font-bold ${isDark ? "text-white" : "text-midnight-velvet"}`}>Thay đổi mật khẩu</Text>
      </View>
      <Text className={`text-sm mb-6 ${isDark ? "text-gray-400" : "text-gray-500"}`}>Bảo vệ tài khoản của bạn bằng mật khẩu mạnh</Text>

      <View className={`${isDark ? "bg-white/5" : "bg-white"} p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5`}>
        <InputAuthField 
          label="Mật khẩu hiện tại" 
          value={oldPassword}
          onChangeText={setOldPassword}
          showPassword={showOldPassword}
          setShowPassword={setShowOldPassword}
          placeholder="Nhập mật khẩu hiện tại"
          isDark={isDark}
        />

        <InputAuthField 
          label="Mật khẩu mới" 
          value={newPassword}
          onChangeText={setNewPassword}
          showPassword={showNewPassword}
          setShowPassword={setShowNewPassword}
          placeholder="Nhập mật khẩu mới"
          isDark={isDark}
        />

        <InputAuthField 
          label="Xác nhận mật khẩu mới" 
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          showPassword={showConfirmPassword}
          setShowPassword={setShowConfirmPassword}
          placeholder="Xác nhận mật khẩu mới"
          isDark={isDark}
        />

        <TouchableOpacity
          onPress={handleSave}
          disabled={submitting}
          className={`w-full mt-2 rounded-xl items-center py-4 ${submitting ? 'bg-primary/70' : 'bg-primary'}`}
        >
          {submitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-base">Cập nhật mật khẩu</Text>
          )}
        </TouchableOpacity>
      </View>
    </AccountLayout>
  );
}
