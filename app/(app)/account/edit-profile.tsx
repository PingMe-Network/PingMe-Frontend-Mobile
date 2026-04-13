import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useAppSelector } from "@/features/store";
import { getCurrentUserInfoApi, updateCurrentUserProfileApi } from "@/services/user/currentUserProfileApi";
import { InputField } from "@/components/ui/InputField";
import { Button } from "@/components/ui/Button";

export default function EditProfileScreen() {
  const { mode } = useAppSelector((state) => state.theme);
  const isDark = mode === "dark";

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState<"MALE" | "FEMALE" | "OTHER">("OTHER");
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    getCurrentUserInfoApi().then(res => {
      if (mounted && res.data.data) {
        setName(res.data.data.name || "");
        setAddress(res.data.data.address || "");
        setDob(res.data.data.dob || "");
        setGender(res.data.data.gender || "OTHER");
      }
    }).catch(err => {
      console.log('Error fetching user info', err);
    }).finally(() => {
      if (mounted) setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Lỗi", "Tên không được để trống");
      return;
    }
    setSaving(true);
    try {
      await updateCurrentUserProfileApi({
        name,
        address,
        dob,
        gender
      });
      Alert.alert("Thành công", "Đã cập nhật thông tin thành công!", [
        { text: "OK", onPress: () => router.back() }
      ]);
    } catch (error) {
      console.log("Edit profile error:", error);
      Alert.alert("Thất bại", "Không thể cập nhật thông tin.");
    } finally {
      setSaving(false);
    }
  };

  const bgClass = isDark ? "bg-background-dark" : "bg-background-light";
  const textTitleClass = isDark ? "text-white" : "text-gray-900";
  const iconColor = isDark ? "#FFF" : "#111";

  const genderLabels = {
    MALE: "Nam",
    FEMALE: "Nữ",
    OTHER: "Khác",
  };

  return (
    <SafeAreaView className={`flex-1 ${bgClass}`} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View className="px-4 py-4 flex-row items-center border-b" style={{ borderBottomColor: isDark ? '#363234' : '#f3f4f6' }}>
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <ChevronLeft size={24} color={iconColor} />
        </TouchableOpacity>
        <Text className={`ml-2 text-xl font-bold ${textTitleClass}`}>Chỉnh sửa thông tin</Text>
      </View>

      <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator size="large" color="#DF40A3" className="mt-10" />
        ) : (
          <View>
            <InputField
              label="Họ và tên"
              value={name}
              onChangeText={setName}
              placeholder="Nhập họ và tên của bạn"
            />
            
            {/* Gender Selection */}
            <View className="mb-4 z-50 relative">
              <Text className={`mb-2 font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>Giới tính</Text>
              <View className="flex-row gap-3">
                {(["MALE", "FEMALE", "OTHER"] as const).map((g) => {
                  const isSelected = gender === g;
                  const unselectedClasses = isDark
                    ? "border-gray-800 bg-gray-900"
                    : "border-gray-200 bg-white";
                  const optionContainerClasses = isSelected
                    ? "border-primary bg-primary/10"
                    : unselectedClasses;
                  let optionTextColor = "text-gray-900";

                  if (isSelected) {
                    optionTextColor = "text-primary";
                  } else if (isDark) {
                    optionTextColor = "text-white";
                  }

                  return (
                    <TouchableOpacity
                      key={g}
                      className={`flex-1 p-3 rounded-xl border flex-row justify-center items-center ${optionContainerClasses}`}
                      onPress={() => setGender(g)}
                    >
                      <Text className={`font-medium ${optionTextColor}`}>
                        {genderLabels[g]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <InputField
              label="Ngày sinh"
              value={dob}
              onChangeText={setDob}
              placeholder="YYYY-MM-DD"
            />
            
            <InputField
              label="Địa chỉ"
              value={address}
              onChangeText={setAddress}
              placeholder="Nhập địa chỉ"
            />

            <View className="mt-6 mb-10">
              <Button
                title={saving ? "Đang lưu..." : "Lưu thay đổi"}
                onPress={handleSave}
                disabled={saving}
              />
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
