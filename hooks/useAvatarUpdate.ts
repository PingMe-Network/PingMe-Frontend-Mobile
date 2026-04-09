import { useState } from "react";
import { Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useAppDispatch } from "@/features/store";
import { getCurrentUserSession } from "@/features/auth/authThunk";
import { updateCurrentUserAvatarApi } from "@/services/user/currentUserProfileApi";
import { getErrorMessage } from "@/utils/errorMessageHandler";

export const useAvatarUpdate = () => {
  const dispatch = useAppDispatch();
  const [updatingAvatar, setUpdatingAvatar] = useState(false);

  const handleUpdateAvatar = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Lỗi", "Bạn cần cấp quyền truy cập thư viện ảnh để thay đổi ảnh đại diện");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setUpdatingAvatar(true);
        const selectedImage = result.assets[0];
        
        const formData = new FormData();
        formData.append('avatar', {
          uri: selectedImage.uri,
          name: 'avatar.jpg',
          type: 'image/jpeg',
        } as any);

        await updateCurrentUserAvatarApi(formData);
        await dispatch(getCurrentUserSession());
        Alert.alert("Thành công", "Cập nhật ảnh đại diện thành công");
      }
    } catch (error) {
      console.error("Update avatar error:", error);
      Alert.alert("Lỗi", getErrorMessage(error, "Không thể cập nhật ảnh đại diện"));
    } finally {
      setUpdatingAvatar(false);
    }
  };

  return {
    updatingAvatar,
    handleUpdateAvatar,
  };
};
