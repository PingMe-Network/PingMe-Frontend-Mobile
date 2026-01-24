import { useState } from "react";
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Link, router } from "expo-router";

export default function RegisterScreen() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRegister = async () => {
    setErrorMessage(null);

    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setErrorMessage("Vui lòng điền đầy đủ thông tin");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Mật khẩu xác nhận không khớp");
      return;
    }

    setIsLoading(true);

    // TODO: Implement register API call
    setTimeout(() => {
      setIsLoading(false);
      router.replace("/(public)/login" as never);
    }, 1500);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-white"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 justify-center px-6 py-10">
          {/* Header */}
          <View className="items-center mb-8">
            <Text className="text-3xl font-bold text-blue-600">PingMe</Text>
            <Text className="text-gray-500 mt-2">Tạo tài khoản mới</Text>
          </View>

          {/* Error Message */}
          {errorMessage && (
            <View className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <Text className="text-red-600 text-center">{errorMessage}</Text>
            </View>
          )}

          {/* Input Full Name */}
          <Text className="mb-2 font-medium text-gray-700">Họ và tên</Text>
          <TextInput
            className="border border-gray-300 rounded-xl p-4 mb-4 bg-gray-50 text-base"
            placeholder="Nhập họ và tên"
            placeholderTextColor="#9CA3AF"
            value={fullName}
            onChangeText={setFullName}
          />

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
            className="border border-gray-300 rounded-xl p-4 mb-4 bg-gray-50 text-base"
            placeholder="Nhập mật khẩu"
            placeholderTextColor="#9CA3AF"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {/* Input Confirm Password */}
          <Text className="mb-2 font-medium text-gray-700">
            Xác nhận mật khẩu
          </Text>
          <TextInput
            className="border border-gray-300 rounded-xl p-4 mb-6 bg-gray-50 text-base"
            placeholder="Nhập lại mật khẩu"
            placeholderTextColor="#9CA3AF"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          {/* Register Button */}
          <TouchableOpacity
            className={`p-4 rounded-xl flex-row justify-center items-center ${
              isLoading ? "bg-blue-400" : "bg-blue-600"
            }`}
            onPress={handleRegister}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-semibold text-lg">Đăng ký</Text>
            )}
          </TouchableOpacity>

          {/* Login Link */}
          <View className="flex-row justify-center mt-6">
            <Text className="text-gray-600">Đa co tai khoan? </Text>
            <Link href={"/(public)/login" as never} asChild>
              <TouchableOpacity>
                <Text className="text-blue-600 font-semibold">Dang nhap</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
