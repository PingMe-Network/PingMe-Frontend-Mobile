import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, Stack } from "expo-router";
import { useAppSelector, useAppDispatch } from "@/features/store";
import { getCurrentUserInfoApi, updateCurrentUserProfileApi } from "@/services/user/currentUserProfileApi";
import { Feather } from "@expo/vector-icons";
import { getErrorMessage } from "@/utils/errorMessageHandler";
import { CurrentUserProfileResponse } from "@/types/auth";
import { getCurrentUserSession } from "@/features/auth/authThunk";
import { Colors } from "@/constants/Colors";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useAvatarUpdate } from "@/hooks/useAvatarUpdate";
import { Image } from "react-native";

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

      // Update session store so Avatar/Name updates globally
      await dispatch(getCurrentUserSession());

      Alert.alert("Thành công", "Cập nhật thông tin cá nhân thành công", [
        { text: "OK", onPress: () => router.back() }
      ]);
    } catch (error) {
      Alert.alert("Lỗi", getErrorMessage(error, "Cập nhật thất bại"));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className={`flex-1 justify-center items-center ${isDark ? "bg-background-dark" : "bg-background-light"}`}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

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
            Thông tin cá nhân
          </Text>
        </View>

        <ScrollView 
          className="flex-1 px-5" 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 24, paddingBottom: 100 }}
        >
          <View className="flex-row items-center mb-1">
            <View className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${isDark ? 'bg-primary/20' : 'bg-primary/10'}`}>
              <Feather name="user" size={16} color={Colors.primary} />
            </View>
            <Text className={`text-xl font-bold ${isDark ? "text-white" : "text-midnight-velvet"}`}>Thông tin cá nhân</Text>
          </View>
          <Text className={`text-sm mb-6 ${isDark ? "text-gray-400" : "text-gray-500"}`}>Cập nhật thông tin cá nhân của bạn</Text>

          <View className={`${isDark ? "bg-white/5" : "bg-white"} p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5`}>
            
            {/* Avatar Section */}
            <View className="items-center mb-8">
              <View className="relative">
                <View className="w-28 h-28 rounded-full overflow-hidden border-2 border-primary/20 bg-gray-100 dark:bg-white/5">
                  <Image
                    source={
                      userInfo?.avatarUrl || user?.avatarUrl 
                        ? { uri: (userInfo?.avatarUrl || user?.avatarUrl || "").trim() } 
                        : { uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(name || user?.name || "User")}&background=DF40A3&color=fff&size=200` }
                    }
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                  {updatingAvatar && (
                    <View className="absolute inset-0 bg-black/30 items-center justify-center">
                      <ActivityIndicator size="small" color="white" />
                    </View>
                  )}
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
              <View className={`px-4 py-3.5 rounded-xl border ${isDark ? "bg-white/5 border-white/5" : "bg-gray-50 border-gray-200"}`}>
                <Text className={`${isDark ? "text-gray-400" : "text-gray-500"}`}>{userInfo?.email || user?.email}</Text>
              </View>
            </InputFieldWrapper>

            <InputFieldWrapper label="Họ và tên" required isDark={isDark}>
              <View className={`flex-row items-center px-4 py-1 border rounded-xl ${isDark ? "border-white/20" : "border-gray-200"}`}>
                <Feather name="user" size={18} color={isDark ? "#9ca3af" : "#6b7280"} />
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Nhập họ và tên"
                  placeholderTextColor={isDark ? "#6b7280" : "#9ca3af"}
                  className={`flex-1 py-3 px-3 text-base ${isDark ? "text-white" : "text-midnight-velvet"}`}
                />
              </View>
            </InputFieldWrapper>

            <View className="flex-row space-x-4 z-10">
              <View className="flex-1 pr-2 relative">
                <InputFieldWrapper label="Giới tính" required isDark={isDark}>
                  <TouchableOpacity 
                    className={`flex-row justify-between items-center px-4 border rounded-xl h-[48px] ${isDark ? "border-white/20" : "border-gray-200"}`}
                    onPress={() => setShowGenderDropdown(!showGenderDropdown)}
                    activeOpacity={0.8}
                  >
                    <Text className={`text-base ${isDark ? "text-white" : "text-midnight-velvet"}`}>
                      {genderLabels[gender]}
                    </Text>
                    <Feather name={showGenderDropdown ? "chevron-up" : "chevron-down"} size={18} color={isDark ? "#9ca3af" : "#6b7280"} />
                  </TouchableOpacity>

                  {/* Dropdown Options */}
                  {showGenderDropdown && (
                    <View className={`absolute top-[75px] left-0 right-0 rounded-xl border shadow-lg z-50 overflow-hidden ${isDark ? "bg-[#252525] border-white/10 shadow-black/50" : "bg-white border-gray-100 shadow-gray-200"}`}>
                      {(["MALE", "FEMALE", "OTHER"] as const).map((opt) => (
                        <TouchableOpacity
                          key={opt}
                          className={`flex-row justify-between items-center px-4 py-3 border-b ${isDark ? "border-white/5" : "border-gray-50"} ${gender === opt ? (isDark ? 'bg-primary/20' : 'bg-primary/10') : ''}`}
                          onPress={() => { setGender(opt); setShowGenderDropdown(false); }}
                        >
                          <Text className={`text-base font-medium ${gender === opt ? 'text-primary' : (isDark ? "text-gray-300" : "text-gray-700")}`}>
                            {genderLabels[opt]}
                          </Text>
                          {gender === opt && <Feather name="check" size={16} color={Colors.primary} />}
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </InputFieldWrapper>
              </View>
              <View className="flex-1 pl-2 z-[-1]">
                <InputFieldWrapper label="Ngày sinh" isDark={isDark}>
                  <TouchableOpacity 
                    className={`flex-row items-center px-4 border rounded-xl h-[48px] ${isDark ? "border-white/20" : "border-gray-200"}`}
                    onPress={() => setShowDatePicker(true)}
                    activeOpacity={0.7}
                  >
                    <Feather name="calendar" size={18} color={isDark ? "#9ca3af" : "#6b7280"} />
                    <Text className={`flex-1 px-3 text-base ${formattedDob ? (isDark ? "text-white" : "text-midnight-velvet") : (isDark ? "text-[#6b7280]" : "text-[#9ca3af]")}`}>
                      {formattedDob || "DD/MM/YYYY"}
                    </Text>
                  </TouchableOpacity>
                </InputFieldWrapper>
              </View>
            </View>

            <InputFieldWrapper label="Địa chỉ" isDark={isDark}>
              <View className={`flex-row items-center px-4 py-1 border rounded-xl ${isDark ? "border-white/20" : "border-gray-200"}`}>
                <Feather name="map-pin" size={18} color={isDark ? "#9ca3af" : "#6b7280"} />
                <TextInput
                  value={address}
                  onChangeText={setAddress}
                  placeholder="Nhập địa chỉ"
                  placeholderTextColor={isDark ? "#6b7280" : "#9ca3af"}
                  className={`flex-1 py-3 px-3 text-base ${isDark ? "text-white" : "text-midnight-velvet"}`}
                />
              </View>
            </InputFieldWrapper>

            <TouchableOpacity
              onPress={handleSave}
              disabled={submitting}
              className={`w-full mt-4 rounded-xl items-center py-4 ${submitting ? 'bg-primary/70' : 'bg-primary'}`}
            >
              {submitting ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold text-base">Lưu thay đổi</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {showDatePicker && (
        <DateTimePicker
          value={dob || new Date()}
          mode="date"
          display="default"
          onChange={handleDateChange}
          maximumDate={new Date()}
        />
      )}
    </SafeAreaView>
  );
}
