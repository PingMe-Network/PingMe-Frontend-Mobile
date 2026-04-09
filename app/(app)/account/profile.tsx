import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, TextInput, Alert } from "react-native";
import { useAppSelector, useAppDispatch } from "@/features/store";
import { getCurrentUserInfoApi, updateCurrentUserProfileApi } from "@/services/user/currentUserProfileApi";
import { Feather } from "@expo/vector-icons";
import { getErrorMessage } from "@/utils/errorMessageHandler";
import { CurrentUserProfileResponse } from "@/types/auth";
import { getCurrentUserSession } from "@/features/auth/authThunk";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useAvatarUpdate } from "@/hooks/useAvatarUpdate";
import { Image } from "react-native";
import { AccountLayout } from "@/components/ui/AccountLayout";

const InputFieldWrapper = ({ label, required, isDark, children }: any) => (
  <View className="mb-6">
    <Text className={`text-sm font-medium mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
      {label} {required && <Text className="text-red-500">*</Text>}
    </Text>
    {children}
  </View>
);

export default function ProfileScreen() {
  const dispatch = useAppDispatch();
  const { mode } = useAppSelector((state) => state.theme);
  const { userSession: user } = useAppSelector((state) => state.auth);
  const isDark = mode === "dark";

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userInfo, setUserInfo] = useState<CurrentUserProfileResponse | null>(null);

  const [name, setName] = useState(user?.name || "");
  const [gender, setGender] = useState<"MALE" | "FEMALE" | "OTHER">("MALE");
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);
  const [dob, setDob] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [address, setAddress] = useState("");
  const { updatingAvatar, handleUpdateAvatar } = useAvatarUpdate();

  useEffect(() => {
    fetchUserInfo();
  }, []);

  const fetchUserInfo = async () => {
    try {
      const res = await getCurrentUserInfoApi();
      const data = res.data.data;
      setUserInfo(data);
      setName(data.name || user?.name || "");
      if (data.gender) setGender(data.gender);
      setAddress(data.address || "");
      if (data.dob) {
        const d = new Date(data.dob);
        if (!isNaN(d.getTime())) {
          setDob(d);
        }
      }
    } catch (error) {
      Alert.alert("Lỗi tải thông tin", getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDob(selectedDate);
    }
  };

  const formattedDob = dob ? `${dob.getDate().toString().padStart(2, "0")}/${(dob.getMonth() + 1).toString().padStart(2, "0")}/${dob.getFullYear()}` : "";

  const genderLabels = {
    "MALE": "Nam",
    "FEMALE": "Nữ",
    "OTHER": "Khác"
  };

  const handleSave = async () => {
    try {
      if (!name) {
        Alert.alert("Lỗi", "Vui lòng nhập họ và tên");
        return;
      }
      setSubmitting(true);
      
      let finalDob = "";
      if (dob) {
        const year = dob.getFullYear();
        const month = (dob.getMonth() + 1).toString().padStart(2, "0");
        const day = dob.getDate().toString().padStart(2, "0");
        finalDob = `${year}-${month}-${day}`;
      }

      await updateCurrentUserProfileApi({
        name,
        gender,
        address,
        dob: finalDob || undefined,
      });

      await dispatch(getCurrentUserSession());
      Alert.alert("Thành công", "Cập nhật thông tin thành công");
    } catch (error) {
      Alert.alert("Lỗi cập nhật", getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AccountLayout title="Thông tin cá nhân" loading={loading}>
      <View className="items-center mb-10">
        <View className="relative">
          <View className={`w-36 h-36 rounded-full border-4 ${isDark ? "border-white/10" : "border-gray-100"} overflow-hidden bg-gray-200`}>
            <Image
              source={
                userInfo?.avatarUrl || user?.avatarUrl 
                  ? { uri: (userInfo?.avatarUrl || user?.avatarUrl || "").trim() } 
                  : { uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(name || user?.name || "User")}&background=DF40A3&color=fff&size=200` }
              }
              className="w-full h-full"
              resizeMode="cover"
            />
          </View>
          <TouchableOpacity 
            onPress={handleUpdateAvatar}
            disabled={updatingAvatar || submitting}
            className="absolute bottom-0 right-0 bg-primary p-2.5 rounded-full border-4 border-white dark:border-[#1A1A1A] shadow-lg"
          >
            <Feather name="camera" size={16} color="white" />
          </TouchableOpacity>
        </View>
        <Text className={`text-xs mt-3 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
          Chạm vào máy ảnh để thay đổi ảnh
        </Text>
      </View>

      <InputFieldWrapper label="Email" isDark={isDark}>
        <View className={`px-4 py-3.5 border rounded-xl bg-gray-50 dark:bg-white/5 ${isDark ? "border-white/10" : "border-gray-100"}`}>
          <Text className={`text-base ${isDark ? "text-gray-400" : "text-gray-500"}`}>
            {userInfo?.email || user?.email}
          </Text>
        </View>
      </InputFieldWrapper>

      <InputFieldWrapper label="Họ và tên" required isDark={isDark}>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Nhập họ và tên"
          placeholderTextColor={isDark ? "#6b7280" : "#9ca3af"}
          className={`px-4 py-3.5 border rounded-xl text-base ${isDark ? "bg-white/5 border-white/20 text-white" : "bg-white border-gray-200 text-midnight-velvet"}`}
        />
      </InputFieldWrapper>

      <InputFieldWrapper label="Giới tính" required isDark={isDark}>
        <View className="relative z-50">
          <TouchableOpacity
            className={`border rounded-xl p-4 flex-row justify-between items-center ${isDark ? "bg-white/5 border-white/20" : "bg-white border-gray-200"}`}
            onPress={() => setShowGenderDropdown(!showGenderDropdown)}
            activeOpacity={0.7}
          >
            <Text className={`text-base ${isDark ? "text-white" : "text-midnight-velvet"}`}>
              {genderLabels[gender]}
            </Text>
            <Feather name={showGenderDropdown ? "chevron-up" : "chevron-down"} size={20} color={isDark ? "#9ca3af" : "#6b7280"} />
          </TouchableOpacity>

          {showGenderDropdown && (
            <View className={`absolute top-full left-0 right-0 mt-2 border rounded-xl shadow-lg z-50 overflow-hidden ${isDark ? "bg-[#252525] border-white/10" : "bg-white border-gray-100"}`}>
              {(Object.keys(genderLabels) as Array<keyof typeof genderLabels>).map((key) => (
                <TouchableOpacity
                  key={key}
                  className={`p-4 border-b ${isDark ? "border-white/5" : "border-gray-50"} ${gender === key ? (isDark ? "bg-primary/20" : "bg-primary/5") : ""}`}
                  onPress={() => {
                    setGender(key);
                    setShowGenderDropdown(false);
                  }}
                >
                  <Text className={`text-base ${gender === key ? "text-primary font-bold" : (isDark ? "text-gray-300" : "text-gray-700")}`}>
                    {genderLabels[key]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </InputFieldWrapper>

      <InputFieldWrapper label="Ngày sinh" isDark={isDark}>
        <TouchableOpacity
          className={`border rounded-xl p-4 flex-row justify-between items-center ${isDark ? "bg-white/5 border-white/20" : "bg-white border-gray-200"}`}
          onPress={() => setShowDatePicker(true)}
          activeOpacity={0.7}
        >
          <Text className={`text-base ${formattedDob ? (isDark ? "text-white" : "text-midnight-velvet") : (isDark ? "text-gray-500" : "#9ca3af")}`}>
            {formattedDob || "Chọn ngày sinh"}
          </Text>
          <Feather name="calendar" size={20} color={isDark ? "#9ca3af" : "#6b7280"} />
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={dob || new Date()}
            mode="date"
            display="default"
            onChange={handleDateChange}
            maximumDate={new Date()}
          />
        )}
      </InputFieldWrapper>

      <InputFieldWrapper label="Địa chỉ" isDark={isDark}>
        <TextInput
          value={address}
          onChangeText={setAddress}
          placeholder="Nhập địa chỉ của bạn"
          placeholderTextColor={isDark ? "#6b7280" : "#9ca3af"}
          multiline
          numberOfLines={3}
          style={{ textAlignVertical: 'top' }}
          className={`px-4 py-3.5 border rounded-xl text-base h-24 ${isDark ? "bg-white/5 border-white/20 text-white" : "bg-white border-gray-200 text-midnight-velvet"}`}
        />
      </InputFieldWrapper>

      <View className="mt-4">
        <TouchableOpacity
          onPress={handleSave}
          disabled={submitting}
          className={`w-full rounded-xl items-center py-4 ${submitting ? 'bg-primary/70' : 'bg-primary shadow-lg shadow-primary/30'}`}
        >
          <Text className="text-white font-bold text-base">Lưu thay đổi</Text>
        </TouchableOpacity>
      </View>
    </AccountLayout>
  );
}
