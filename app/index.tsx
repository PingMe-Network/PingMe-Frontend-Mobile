import { useState } from "react";
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useAppDispatch, useAppSelector } from "@/features/store";
import { loginThunk } from "@/features/slices/authThunk";

export default function Index() {
  const dispatch = useAppDispatch();

  // State form
  const [email, setEmail] = useState("admin@gmail.com"); // Điền sẵn cho nhanh test
  const [password, setPassword] = useState("123456"); // Điền sẵn cho nhanh test

  // State để hiển thị log kết quả ra màn hình
  const [logResult, setLogResult] = useState<string>("Chưa có dữ liệu...");

  // Lấy loading từ Redux
  const { isLoading } = useAppSelector((state) => state.auth);

  const handleLogin = async () => {
    setLogResult("Đang gọi API...");

    try {
      // Gọi Thunk và dùng .unwrap() để lấy kết quả raw hoặc lỗi ngay lập tức
      const result = await dispatch(loginThunk({ email, password })).unwrap();

      // Nếu thành công
      setLogResult("✅ SUCCESS:\n" + JSON.stringify(result, null, 2));
    } catch (error) {
      // Nếu thất bại
      setLogResult("❌ ERROR:\n" + JSON.stringify(error, null, 2));
    }
  };

  return (
    <View className="flex-1 bg-white p-5 justify-center">
      <Text className="text-2xl font-bold mb-6 text-center text-blue-600">
        Test Login Mobile
      </Text>

      {/* Input Email */}
      <Text className="mb-1 font-semibold text-gray-700">Email</Text>
      <TextInput
        className="border border-gray-300 rounded-lg p-3 mb-4 bg-gray-50"
        placeholder="Nhập email..."
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />

      {/* Input Password */}
      <Text className="mb-1 font-semibold text-gray-700">Password</Text>
      <TextInput
        className="border border-gray-300 rounded-lg p-3 mb-6 bg-gray-50"
        placeholder="Nhập password..."
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {/* Nút Login */}
      <TouchableOpacity
        className={`p-4 rounded-lg flex-row justify-center items-center ${
          isLoading ? "bg-gray-400" : "bg-blue-600"
        }`}
        onPress={handleLogin}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-white font-bold text-lg">Đăng Nhập</Text>
        )}
      </TouchableOpacity>

      {/* Khu vực hiển thị Response */}
      <View className="mt-8 flex-1">
        <Text className="font-bold mb-2 text-gray-800">API Response:</Text>
        <View className="bg-gray-900 p-3 rounded-md flex-1">
          <ScrollView nestedScrollEnabled>
            <Text className="text-green-400 font-mono text-xs">
              {logResult}
            </Text>
          </ScrollView>
        </View>
      </View>
    </View>
  );
}
