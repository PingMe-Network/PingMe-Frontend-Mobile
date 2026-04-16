import { useState } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from "react-native";
import { Link, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAppDispatch, useAppSelector } from "@/features/store";
import { registerThunk } from "@/features/auth/authThunk";
import { checkEmailExistsApi, registerLocalApi } from "@/services/auth";
import { InputField } from "@/components/ui/InputField";
import { Button } from "@/components/ui/Button";
import { TurnstileWidget } from "@/components/ui/TurnstileWidget";

export default function RegisterScreen() {
  const dispatch = useAppDispatch();
  const [isRegistering, setIsRegistering] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);
  const [gender, setGender] = useState<"MALE" | "FEMALE" | "OTHER">("MALE");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const turnstileSiteKey = process.env.VITE_TURNSTILE_SITE_KEY || "0x4AAAAAAClpT4qYqe0yvp2q";

  const handleEmailBlur = async () => {
    if (!email.trim()) return;
    try {
      const res = await checkEmailExistsApi(email.trim());
      if (res.data.data.exists) {
        setEmailError("Email này đã được sử dụng");
      } else {
        setEmailError(null);
      }
    } catch (error) {
      console.log("Check email error", error);
    }
  };

  const handleRegister = async () => {
    setErrorMessage(null);

    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setErrorMessage("Vui lòng điền đầy đủ thông tin");
      return;
    }

    if (emailError) {
      setErrorMessage("Vui lòng sử dụng email hợp lệ");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Mật khẩu xác nhận không khớp");
      return;
    }

    if (!turnstileToken) {
      setErrorMessage("Vui lòng xác thực CAPTCHA");
      return;
    }

    try {
      setIsRegistering(true);
      await registerLocalApi({
        email: email.trim(),
        name: fullName,
        password,
        gender,
        turnstileToken: turnstileToken!,
      });
      router.push({
        pathname: "/(public)/verify-otp",
        params: { email: email.trim(), type: "ACCOUNT_ACTIVATION" },
      });
    } catch (error: any) {
      setErrorMessage(
        error?.response?.data?.errorMessage || "Đăng ký thất bại. Vui lòng thử lại."
      );
    } finally {
      setIsRegistering(false);
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
      className="flex-1 bg-background-light relative overflow-hidden"
    >
      {/* Background Decorators (Bubbles) */}
      <View className="absolute top-20 -left-10 w-48 h-48 bg-primary/10 rounded-full" />
      <View className="absolute top-[40%] -right-16 w-64 h-64 bg-secondary/10 rounded-full" />
      <View className="absolute -bottom-10 left-[10%] w-56 h-56 bg-purple-500/10 rounded-full" />
      
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="px-6 py-10 w-full max-w-lg mx-auto">
          {/* Header */}
          <View className="items-center mb-8 z-10">
            <Image
              source={require("../../assets/app/icon.png")}
              className="w-24 h-24 mb-4 rounded-2xl"
            />
            <Text className="text-3xl font-black text-gray-900 tracking-tight">PingMe</Text>
            <Text className="text-gray-500 mt-2 font-medium">Tạo tài khoản mới</Text>
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
            onChangeText={(text) => {
              setEmail(text);
              if (emailError) setEmailError(null);
            }}
            onBlur={handleEmailBlur}
            error={emailError}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          {/* Gender Selection */}
          <View className="mb-4 z-50 relative">
            <Text className="mb-2 font-medium text-gray-700">Giới tính</Text>
            <TouchableOpacity
              className="border border-gray-200 rounded-custom p-4 bg-white flex-row justify-between items-center"
              onPress={() => setShowGenderDropdown(!showGenderDropdown)}
              activeOpacity={0.7}
            >
              <Text className="text-base text-gray-900">
                {genderLabels[gender]}
              </Text>
              <Ionicons
                name={showGenderDropdown ? "chevron-up" : "chevron-down"}
                size={20}
                color="#9CA3AF"
              />
            </TouchableOpacity>

            {showGenderDropdown && (
              <View className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-custom shadow-sm z-50 overflow-hidden">
                {[
                  { label: "Khác", value: "OTHER" },
                  { label: "Nam", value: "MALE" },
                  { label: "Nữ", value: "FEMALE" },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.value}
                    className={`p-4 border-b border-gray-100 last:border-0 ${gender === item.value ? "bg-primary/5" : ""
                      }`}
                    onPress={() => {
                      setGender(item.value as any);
                      setShowGenderDropdown(false);
                    }}
                  >
                    <Text
                      className={`${gender === item.value
                        ? "text-primary font-semibold"
                        : "text-gray-700"
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

          {/* Turnstile Widget */}
          <View style={{ height: 100, marginBottom: 10 }}>
            <TurnstileWidget
              siteKey={turnstileSiteKey}
              onVerify={(token) => {
                setTurnstileToken(token);
                setErrorMessage(null);
              }}
              onExpire={() => setTurnstileToken(null)}
              onError={() => {
                setErrorMessage("Lỗi tải CAPTCHA. Vui lòng thử lại.");
                setTurnstileToken(null);
              }}
            />
          </View>

          {/* Register Button */}
          <Button
            title="Đăng ký"
            onPress={handleRegister}
            isLoading={isRegistering}
          />

          {/* Login Link */}
          <View className="flex-row justify-center mt-6 z-10">
            <Text className="text-gray-500 text-sm">Đã có tài khoản? </Text>
            <Link href={"/(public)/login" as never} asChild>
              <TouchableOpacity>
                <Text className="text-primary font-semibold">Đăng nhập</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
