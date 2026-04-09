import React, { useState } from "react";
import { View, Text, TouchableOpacity, TextInput, Image } from "react-native";
import { useAppSelector } from "@/features/store";
import { Feather } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useAvatarUpdate } from "@/hooks/useAvatarUpdate";
import { useProfileData } from "@/hooks/useProfileData";
import { AccountLayout } from "@/components/ui/AccountLayout";

const InputFieldWrapper = ({ label, required, isDark, children }: any) => (
  <View className="mb-6">
    <Text className={`text-sm font-medium mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
      {label} {required && <Text className="text-red-500">*</Text>}
    </Text>
    {children}
  </View>
);

// --- Sub-components ---

const AvatarSection = ({ avatarSource, avatarBorderColor, onUpdate, updating, submitting }: any) => (
  <View className="items-center mb-10">
    <View className="relative">
      <View className={`w-36 h-36 rounded-full border-4 ${avatarBorderColor} overflow-hidden bg-gray-200`}>
        <Image source={avatarSource} className="w-full h-full" resizeMode="cover" />
      </View>
      <TouchableOpacity 
        onPress={onUpdate}
        disabled={updating || submitting}
        className="absolute bottom-0 right-0 bg-primary p-2.5 rounded-full border-4 border-white dark:border-[#1A1A1A] shadow-lg"
      >
        <Feather name="camera" size={16} color="white" />
      </TouchableOpacity>
    </View>
  </View>
);

const GenderSelector = ({ gender, setGender, isOpen, setIsOpen, labels, isDark, styles }: any) => (
  <InputFieldWrapper label="Giới tính" required isDark={isDark}>
    <View className="relative z-50">
      <TouchableOpacity
        className={`border rounded-xl p-4 flex-row justify-between items-center ${styles.selectBgClass}`}
        onPress={() => setIsOpen(!isOpen)}
        activeOpacity={0.7}
      >
        <Text className={`text-base ${styles.selectTextColor}`}>{labels[gender]}</Text>
        <Feather name={isOpen ? "chevron-up" : "chevron-down"} size={20} color={styles.iconColor} />
      </TouchableOpacity>
      {isOpen && (
        <View className={`absolute top-full left-0 right-0 mt-2 border rounded-xl shadow-lg z-50 overflow-hidden ${styles.dropdownBgClass}`}>
          {Object.entries(labels).map(([key, label]: any) => {
            const isSelected = gender === key;
            
            // Extract nested logic into clear variables
            const selectedBg = isDark ? "bg-primary/20" : "bg-primary/5";
            const unselectedTextColor = isDark ? "text-gray-300" : "text-gray-700";
            
            const itemBg = isSelected ? selectedBg : "";
            const itemTextColor = isSelected ? "text-primary font-bold" : unselectedTextColor;

            return (
              <TouchableOpacity
                key={key}
                className={`p-4 border-b ${styles.itemBorderColor} ${itemBg}`}
                onPress={() => { setGender(key); setIsOpen(false); }}
              >
                <Text className={`text-base ${itemTextColor}`}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  </InputFieldWrapper>
);

export default function ProfileScreen() {
  const { mode } = useAppSelector((state) => state.theme);
  const isDark = mode === "dark";
  const { 
    loading, submitting, userInfo, name, setName, 
    gender, setGender, dob, setDob, address, setAddress, 
    handleSave, user 
  } = useProfileData();
  
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const { updatingAvatar, handleUpdateAvatar } = useAvatarUpdate();

  const formattedDob = dob ? `${dob.getDate().toString().padStart(2, "0")}/${(dob.getMonth() + 1).toString().padStart(2, "0")}/${dob.getFullYear()}` : "";
  const genderLabels = { "MALE": "Nam", "FEMALE": "Nữ", "OTHER": "Khác" };

  const ui = {
    avatarBorderColor: isDark ? "border-white/10" : "border-gray-100",
    subTextColor: isDark ? "text-gray-400" : "text-gray-500",
    inputBgClass: isDark ? "bg-white/5 border-white/20 text-white" : "bg-white border-gray-200 text-midnight-velvet",
    labelColor: isDark ? "text-gray-400" : "text-gray-500",
    placeholderColor: isDark ? "#6b7280" : "#9ca3af",
    selectBgClass: isDark ? "bg-white/5 border-white/20" : "bg-white border-gray-200",
    selectTextColor: isDark ? "text-white" : "text-midnight-velvet",
    iconColor: isDark ? "#9ca3af" : "#6b7280",
    dropdownBgClass: isDark ? "bg-[#252525] border-white/10" : "bg-white border-gray-100",
    itemBorderColor: isDark ? "border-white/5" : "border-gray-50",
    saveBtnClass: submitting ? 'bg-primary/70' : 'bg-primary shadow-lg shadow-primary/30',
  };

  const displayAvatarUrl = (userInfo?.avatarUrl || user?.avatarUrl || "").trim();
  const defaultAvatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name || user?.name || "User")}&background=DF40A3&color=fff&size=200`;
  const avatarSource = displayAvatarUrl ? { uri: displayAvatarUrl } : { uri: defaultAvatarUrl };

  return (
    <AccountLayout title="Thông tin cá nhân" loading={loading}>
      <AvatarSection 
        avatarSource={avatarSource} 
        avatarBorderColor={ui.avatarBorderColor} 
        onUpdate={handleUpdateAvatar} 
        updating={updatingAvatar} 
        submitting={submitting} 
      />
      <View className="items-center -mt-6 mb-8">
        <Text className={`text-xs ${ui.subTextColor}`}>Chạm vào máy ảnh để thay đổi ảnh</Text>
      </View>

      <InputFieldWrapper label="Email" isDark={isDark}>
        <View className={`px-4 py-3.5 border rounded-xl bg-gray-50 dark:bg-white/5 ${ui.avatarBorderColor}`}>
          <Text className={`text-base ${ui.labelColor}`}>{userInfo?.email || user?.email}</Text>
        </View>
      </InputFieldWrapper>

      <InputFieldWrapper label="Họ và tên" required isDark={isDark}>
        <TextInput
          value={name} onChangeText={setName}
          placeholder="Nhập họ và tên" placeholderTextColor={ui.placeholderColor}
          className={`px-4 py-3.5 border rounded-xl text-base ${ui.inputBgClass}`}
        />
      </InputFieldWrapper>

      <GenderSelector 
        gender={gender} setGender={setGender} 
        isOpen={showGenderDropdown} setIsOpen={setShowGenderDropdown} 
        labels={genderLabels} isDark={isDark} styles={ui} 
      />

      <InputFieldWrapper label="Ngày sinh" isDark={isDark}>
        <TouchableOpacity
          className={`border rounded-xl p-4 flex-row justify-between items-center ${ui.selectBgClass}`}
          onPress={() => setShowDatePicker(true)}
          activeOpacity={0.7}
        >
          <Text className={`text-base ${formattedDob ? ui.selectTextColor : ui.labelColor}`}>{formattedDob || "Chọn ngày sinh"}</Text>
          <Feather name="calendar" size={20} color={ui.iconColor} />
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker value={dob || new Date()} mode="date" display="default" onChange={(e, d) => { setShowDatePicker(false); if(d) setDob(d); }} maximumDate={new Date()} />
        )}
      </InputFieldWrapper>

      <InputFieldWrapper label="Địa chỉ" isDark={isDark}>
        <TextInput
          value={address} onChangeText={setAddress}
          placeholder="Nhập địa chỉ của bạn" placeholderTextColor={ui.placeholderColor}
          multiline numberOfLines={3} style={{ textAlignVertical: 'top' }}
          className={`px-4 py-3.5 border rounded-xl text-base h-24 ${ui.inputBgClass}`}
        />
      </InputFieldWrapper>

      <View className="mt-4">
        <TouchableOpacity onPress={handleSave} disabled={submitting} className={`w-full rounded-xl items-center py-4 ${ui.saveBtnClass}`}>
          <Text className="text-white font-bold text-base">Lưu thay đổi</Text>
        </TouchableOpacity>
      </View>
    </AccountLayout>
  );
}
