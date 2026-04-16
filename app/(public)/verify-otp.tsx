import { useState, useEffect } from "react";
import {
  Text,
  View,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Image,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "@/components/ui/Button";
import { InputField } from "@/components/ui/InputField";
import { verifyOtpApi } from "@/services/auth/authOtpApi";
import { getErrorMessage } from "@/utils/errorMessageHandler";

export default function VerifyOtpScreen() {
  const params = useLocalSearchParams();
  const email = params.email as string;
  const type = (params.type as string) || "ACCOUNT_ACTIVATION";

  const [otp, setOtp] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!email) {
      router.replace("/(public)/login" as never);
    }
  }, [email]);

  const handleVerify = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!otp || otp.length < 6) {
      setErrorMessage("Vui lòng nhập đủ 6 số OTP");
      return;
    }

    setIsLoading(true);

    try {
      const response = await verifyOtpApi({
        otp,
        mailRecipient: email,
        authOtpType: type as any,
      });

      const resData = response.data;

      if (resData.errorCode === 200 && resData.data.isValid === true) {
        setSuccessMessage("Xác thực tài khoản thành công!");
        
        // Wait a bit to show success message then navigate
        setTimeout(() => {
          router.replace("/(public)/login" as never);
        }, 1500);
      } else {
        setErrorMessage("Mã OTP không hợp lệ hoặc đã hết hạn.");
      }
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Xác thực thất bại. Vui lòng thử lại."));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-background-light relative overflow-hidden"
    >
      {/* Background Decorators */}
      <View className="absolute -top-10 -right-10 w-64 h-64 bg-primary/10 rounded-full" />
      <View className="absolute top-40 -left-20 w-48 h-48 bg-secondary/10 rounded-full" />
      
      <View className="flex-1 justify-center px-6">
        {/* Back Button */}
        <TouchableOpacity 
          className="absolute top-16 left-6 w-10 h-10 bg-white shadow-sm rounded-full items-center justify-center z-20"
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={20} color="#1F2937" />
        </TouchableOpacity>

        {/* Header */}
        <View className="items-center mb-8 z-10">
          <View className="w-16 h-16 bg-purple-100 rounded-full items-center justify-center mb-4">
            <Ionicons name="shield-checkmark" size={32} color="#9333ea" />
          </View>
          <Text className="text-2xl font-black text-gray-900 tracking-tight">Xác thực tài khoản</Text>
          <Text className="text-gray-500 mt-2 font-medium text-center">
            Mã xác thực đã được gửi đến email {"\n"}
            <Text className="font-bold text-gray-800">{email}</Text>
          </Text>
        </View>

        {/* Messages */}
        {errorMessage && (
          <View className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <Text className="text-red-600 text-center">{errorMessage}</Text>
          </View>
        )}
        
        {successMessage && (
          <View className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
            <Text className="text-green-600 text-center">{successMessage}</Text>
          </View>
        )}

        {/* Input OTP */}
        <InputField
          label="Mã OTP"
          placeholder="Nhập 6 số OTP"
          value={otp}
          onChangeText={(text) => setOtp(text.replace(/[^0-9]/g, ""))}
          keyboardType="numeric"
          maxLength={6}
          className="text-center font-bold tracking-widest text-lg"
        />

        {/* Verify Button */}
        <View className="mt-4">
          <Button
            title="Xác thực ngay"
            onPress={handleVerify}
            isLoading={isLoading}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
