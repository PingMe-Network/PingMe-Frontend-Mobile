import { useState } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { Link, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAppDispatch, useAppSelector } from "@/features/store";
import { registerThunk } from "@/features/slices/authThunk";
import { InputField } from "@/components/ui/InputField";
import { Button } from "@/components/ui/Button";
import { Colors } from "@/constants/Colors";

export default function RegisterScreen() {
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector((state) => state.auth);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);
  const [gender, setGender] = useState<"MALE" | "FEMALE" | "OTHER">("MALE");

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

    try {
      await dispatch(
        registerThunk({
          email,
          name: fullName,
          password,
          gender, // Gửi gender lên API
        })
      ).unwrap();

      // Xử lý thông báo thành công đa nền tảng
      if (Platform.OS === "web") {
        (globalThis as any).alert("Đăng ký thành công! Vui lòng đăng nhập.");
        router.replace("/(public)/login" as never);
      } else {
        Alert.alert(
          "Đăng ký thành công",
          "Tài khoản của bạn đã được tạo. Vui lòng đăng nhập.",
          [
            {
              text: "OK",
              onPress: () => router.replace("/(public)/login" as never),
            },
          ]
        );
      }
    } catch (error) {
      setErrorMessage(
        typeof error === "string" ? error : "Đăng ký thất bại. Vui lòng thử lại."
      );
    }
  };

  const genderLabels = {
    OTHER: "Khác",
    MALE: "Nam",
    FEMALE: "Nữ",
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-background-dark"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="px-6 py-10 w-full max-w-lg mx-auto">
          {/* Header */}
          <View className="items-center mb-8">
            <Text className="text-3xl font-bold text-primary">PingMe</Text>
            <Text className="text-gray-400 mt-2">Tạo tài khoản mới</Text>
          </View>

          {/* Error Message */}
          {errorMessage && (
            <View className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <Text className="text-red-600 text-center">{errorMessage}</Text>
            </View>
          )}

          {/* Input Full Name */}
          <InputField
            label="Họ và tên"
            placeholder="Nhập họ và tên"
            value={fullName}
            onChangeText={setFullName}
          />

          {/* Input Email */}
          <InputField
            label="Email"
            placeholder="Nhập email của bạn"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          {/* Gender Selection */}
          <Text className="mb-2 font-medium text-gray-300">Giới tính</Text>
          <View className="mb-4 relative z-50">
            <TouchableOpacity
              className="border border-gray-700 rounded-custom p-4 bg-gray-900 flex-row justify-between items-center"
              onPress={() => setShowGenderDropdown(!showGenderDropdown)}
              activeOpacity={0.7}
            >
              <Text className="text-base text-white">
                {genderLabels[gender]}
              </Text>
              <Ionicons
                name={showGenderDropdown ? "chevron-up" : "chevron-down"}
                size={20}
                color={Colors.text.gray}
              />
            </TouchableOpacity>

            {showGenderDropdown && (
              <View className="absolute top-full left-0 right-0 mt-2 bg-gray-900 border border-gray-800 rounded-custom shadow-lg z-50 overflow-hidden">
                {[
                  { label: "Khác", value: "OTHER" },
                  { label: "Nam", value: "MALE" },
                  { label: "Nữ", value: "FEMALE" },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.value}
                    className={`p-4 border-b border-gray-800 last:border-0 ${gender === item.value ? "bg-primary/20" : ""
                      }`}
                    onPress={() => {
                      setGender(item.value as any);
                      setShowGenderDropdown(false);
                    }}
                  >
                    <Text
                      className={`${gender === item.value
                        ? "text-primary font-semibold"
                        : "text-gray-300"
                        }`}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Input Password */}
          <InputField
            label="Mật khẩu"
            placeholder="Nhập mật khẩu"
            value={password}
            onChangeText={setPassword}
            isPassword
          />

          {/* Input Confirm Password */}
          <InputField
            label="Xác nhận mật khẩu"
            placeholder="Nhập lại mật khẩu"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            isPassword
            className="mb-6"
          />

          {/* Register Button */}
          <Button
            title="Đăng ký"
            onPress={handleRegister}
            isLoading={isLoading}
          />

          {/* Login Link */}
          <View className="flex-row justify-center mt-6">
            <Text className="text-gray-400">Đa co tai khoan? </Text>
            <Link href={"/(public)/login" as never} asChild>
              <TouchableOpacity>
                <Text className="text-primary font-semibold">Dang nhap</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
