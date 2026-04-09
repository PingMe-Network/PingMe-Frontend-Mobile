import { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, Stack } from "expo-router";
import { useAppSelector } from "@/features/store";
import { updateCurrentUserPasswordApi } from "@/services/user/currentUserProfileApi";
import { Feather, Ionicons } from "@expo/vector-icons";
import { getErrorMessage } from "@/utils/errorMessageHandler";
import { Colors } from "@/constants/Colors";

const InputAuthField = ({ label, value, onChangeText, secureTextEntry, showPassword, setShowPassword, placeholder, isDark }: any) => (
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
    <SafeAreaView className={`flex-1 ${isDark ? "bg-background-dark" : "bg-background-light"}`} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className={`flex-row items-center px-4 py-3 ${isDark ? "bg-white/5 border-b border-white/10" : "bg-white border-b border-gray-100"}`}>
          <TouchableOpacity onPress={() => router.back()} className="p-2 mr-2">
            <Feather name="arrow-left" size={24} color={isDark ? "white" : "black"} />
          </TouchableOpacity>
          <Text className={`text-lg font-bold flex-1 ${isDark ? "text-white" : "text-midnight-velvet"}`}>
            Thay đổi mật khẩu
          </Text>
        </View>

        <ScrollView 
          className="flex-1 px-5" 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 24, paddingBottom: 100 }}
        >
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
            />

            <InputAuthField 
              label="Mật khẩu mới" 
              value={newPassword}
              onChangeText={setNewPassword}
              showPassword={showNewPassword}
              setShowPassword={setShowNewPassword}
              placeholder="Nhập mật khẩu mới"
            />

            <InputAuthField 
              label="Xác nhận mật khẩu mới" 
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              showPassword={showConfirmPassword}
              setShowPassword={setShowConfirmPassword}
              placeholder="Xác nhận mật khẩu mới"
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
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
