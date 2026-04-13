import { useState } from "react";
import {
  Text,
  View,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Image,
} from "react-native";
import { Link, router } from "expo-router";
import { useAppDispatch, useAppSelector } from "@/features/store";
import { loginThunk } from "@/features/auth/authThunk";
import { InputField } from "@/components/ui/InputField";
import { Button } from "@/components/ui/Button";

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
      className="flex-1 bg-background-light relative overflow-hidden"
    >
      {/* Background Decorators (Bubbles matching Web UI vibe) */}
      <View className="absolute -top-10 -right-10 w-64 h-64 bg-primary/10 rounded-full" />
      <View className="absolute top-40 -left-20 w-48 h-48 bg-secondary/10 rounded-full" />
      <View className="absolute -bottom-10 right-10 w-56 h-56 bg-purple-500/10 rounded-full" />
      <View className="flex-1 justify-center px-6">
        {/* Header */}
        <View className="items-center mb-10 z-10">
          <Image
            source={require("../../assets/app/icon.png")}
            className="w-24 h-24 mb-4 rounded-2xl"
          />
          <Text className="text-3xl font-black text-gray-900 tracking-tight">PingMe</Text>
          <Text className="text-gray-500 mt-2 font-medium">Chào mừng trở lại</Text>
        </View>

        {/* Error Message */}
        {errorMessage && (
          <View className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <Text className="text-red-600 text-center">{errorMessage}</Text>
          </View>
        )}

        {/* Input Text Color needs adjustment inside Component or passed via props, but for now we rely on InputField default or update it globally. 
           Let's proactively update InputField component first to handle dark mode if needed, or pass className. 
           Actually, let's update InputField to support dark mode styles since this is a global change. 
           For now, let's pass text-white to Inputs if possible, or just accept light inputs on dark bg. 
           Designing "Dark Mode" inputs usually means dark bg for input too.
           Let's assume we will update InputField component to look good on dark.
        */}
        <InputField
          label="Email"
          placeholder="Nhập email của bạn"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        {/* Input Password */}
        <InputField
          label="Mật khẩu"
          placeholder="Nhập mật khẩu"
          value={password}
          onChangeText={setPassword}
          isPassword
          className="mb-6"
        />

        {/* Login Button */}
        <Button
          title="Đăng nhập"
          onPress={handleLogin}
          isLoading={isLoading}
        />

        {/* Register Link */}
        <View className="flex-row justify-center mt-6 z-10">
          <Text className="text-gray-500 text-sm">Chưa có tài khoản? </Text>
          <Link href={"/(public)/register" as never} asChild>
            <TouchableOpacity>
              <Text className="text-primary font-semibold">Đăng ký ngay</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
