import { useState } from "react";
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Link, router } from "expo-router";
import { useAppDispatch, useAppSelector } from "@/features/store";
import { loginThunk } from "@/features/slices/authThunk";

export default function LoginScreen() {
  const dispatch = useAppDispatch();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { isLoading } = useAppSelector((state) => state.auth);

  const handleLogin = async () => {
    setErrorMessage(null);

    if (!email.trim() || !password.trim()) {
      setErrorMessage("Vui lòng nhập email và mật khẩu");
      return;
    }

    try {
      await dispatch(loginThunk({ email, password })).unwrap();
      router.replace("/(app)/messages" as never);
    } catch (error) {
      setErrorMessage(
        typeof error === "string"
          ? error
          : "Đăng nhập thất bại. Vui lòng thử lại.",
      );
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-white"
    >
      <View className="flex-1 justify-center px-6">
        {/* Header */}
        <View className="items-center mb-10">
          <Text className="text-3xl font-bold text-blue-600">PingMe</Text>
          <Text className="text-gray-500 mt-2">Chào mừng trở lại</Text>
        </View>

        {/* Error Message */}
        {errorMessage && (
          <View className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <Text className="text-red-600 text-center">{errorMessage}</Text>
          </View>
        )}

        {/* Input Email */}
        <Text className="mb-2 font-medium text-gray-700">Email</Text>
        <TextInput
          className="border border-gray-300 rounded-xl p-4 mb-4 bg-gray-50 text-base"
          placeholder="Nhập email của bạn"
          placeholderTextColor="#9CA3AF"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        {/* Input Password */}
        <Text className="mb-2 font-medium text-gray-700">Mật khẩu</Text>
        <TextInput
          className="border border-gray-300 rounded-xl p-4 mb-6 bg-gray-50 text-base"
          placeholder="Nhập mật khẩu"
          placeholderTextColor="#9CA3AF"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {/* Login Button */}
        <TouchableOpacity
          className={`p-4 rounded-xl flex-row justify-center items-center ${
            isLoading ? "bg-blue-400" : "bg-blue-600"
          }`}
          onPress={handleLogin}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-semibold text-lg">Đăng nhập</Text>
          )}
        </TouchableOpacity>

        {/* Register Link */}
        <View className="flex-row justify-center mt-6">
          <Text className="text-gray-600">Chua co tai khoan? </Text>
          <Link href={"/(public)/register" as never} asChild>
            <TouchableOpacity>
              <Text className="text-blue-600 font-semibold">Dang ky ngay</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
