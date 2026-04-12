import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useVideoPlayer, VideoView } from "expo-video";
import { X, Video, Hash, Type, UploadCloud } from "lucide-react-native";
import { useAppDispatch } from "@/features/store";
import { createReelThunk } from "@/features/reels/reelsSlice";
import { Colors } from "@/constants/Colors";

interface CreateReelModalProps {
  visible: boolean;
  onClose: () => void;
  isDark: boolean;
}

export const CreateReelModal = ({ visible, onClose, isDark }: CreateReelModalProps) => {
  const dispatch = useAppDispatch();
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [uploading, setUploading] = useState(false);

  // Video player for preview
  const player = useVideoPlayer(videoUri || "", (p) => {
    p.loop = true;
  });

  const pickVideo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      allowsEditing: true,
      videoMaxDuration: 60,
      quality: 1,
    });

    if (!result.canceled) {
      setVideoUri(result.assets[0].uri);
    }
  };

  const handleUpload = async () => {
    if (!videoUri) return Alert.alert("Lỗi", "Vui lòng chọn video trước khi đăng!");
    
    setUploading(true);
    try {
      const formData = new FormData();
      
      // Parse hashtags
      const tags = hashtags
        .split(",")
        .map((t) => t.trim().replace("#", ""))
        .filter((t) => t.length > 0);

      const fileDetails = {
        uri: Platform.OS === "android" ? videoUri : videoUri.replace("file://", ""),
        type: "video/mp4",
        name: `reel_${Date.now()}.mp4`,
      };

      formData.append("videoFile", fileDetails as any);
      formData.append("caption", caption);
      tags.forEach(tag => formData.append("hashtags", tag));

      const result = await dispatch(createReelThunk(formData)).unwrap();
      if (result) {
        Alert.alert("Thành công", "Thước phim của bạn đã được đăng!");
        setVideoUri(null);
        setCaption("");
        setHashtags("");
        onClose();
      }
    } catch (error: any) {
      Alert.alert("Lỗi", error || "Không thể đăng video. Vui lòng thử lại.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View className={`flex-1 ${isDark ? "bg-midnight-velvet" : "bg-white"}`}>
        {/* Header */}
        <View className={`flex-row items-center justify-between px-4 py-4 border-b ${isDark ? "border-white/10" : "border-gray-100"}`}>
          <TouchableOpacity onPress={onClose} disabled={uploading}>
            <X size={28} color={isDark ? "#fff" : "#333"} />
          </TouchableOpacity>
          <Text className={`text-lg font-bold ${isDark ? "text-white" : "text-midnight-velvet"}`}>
            Tạo thước phim mới
          </Text>
          <TouchableOpacity 
            onPress={handleUpload} 
            disabled={uploading || !videoUri}
            className={`${!videoUri || uploading ? "opacity-50" : "opacity-100"}`}
          >
            {uploading ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Text className="text-primary font-bold text-base">Đăng</Text>
            )}
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"} 
          className="flex-1"
        >
          <ScrollView className="flex-1 px-4">
            {/* Video Picker/Preview */}
            <View className="mt-6">
              <TouchableOpacity 
                onPress={pickVideo}
                className={`w-full aspect-[9/12] rounded-2xl overflow-hidden items-center justify-center border-2 border-dashed ${
                  isDark ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-200"
                }`}
              >
                {videoUri ? (
                   <VideoView 
                     player={player} 
                     style={{ width: '100%', height: '100%' }} 
                     contentFit="cover"
                   />
                ) : (
                  <View className="items-center">
                    <View className="bg-primary/20 p-4 rounded-full mb-3">
                      <Video size={32} color={Colors.primary} />
                    </View>
                    <Text className={`font-bold ${isDark ? "text-white" : "text-midnight-velvet"}`}>
                      Chọn video từ thư viện
                    </Text>
                    <Text className="text-gray-500 text-xs mt-1 text-center px-10">
                      Hỗ trợ MP4, tối đa 60 giây để có trải nghiệm tốt nhất.
                    </Text>
                  </View>
                )}
                
                {videoUri && (
                  <View className="absolute top-4 right-4 bg-black/50 px-3 py-1.5 rounded-full flex-row items-center">
                    <UploadCloud size={14} color="#fff" />
                    <Text className="text-white text-[10px] ml-1 font-bold">Thay đổi</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Inputs */}
            <View className="mt-6 gap-6 mb-10">
               <View>
                 <View className="flex-row items-center gap-2 mb-2">
                    <Type size={16} color={Colors.primary} />
                    <Text className={`font-bold text-sm ${isDark ? "text-gray-300" : "text-gray-600"}`}>Mô tả</Text>
                 </View>
                 <TextInput
                   className={`p-4 rounded-xl text-sm ${isDark ? "bg-white/5 text-white" : "bg-gray-50 text-midnight-velvet"}`}
                   placeholder="Bạn đang nghĩ gì về thước phim này?..."
                   placeholderTextColor="#888"
                   multiline
                   numberOfLines={3}
                   value={caption}
                   onChangeText={setCaption}
                   maxLength={1000}
                 />
               </View>

               <View>
                 <View className="flex-row items-center gap-2 mb-2">
                    <Hash size={16} color={Colors.primary} />
                    <Text className={`font-bold text-sm ${isDark ? "text-gray-300" : "text-gray-600"}`}>Hashtags</Text>
                 </View>
                 <TextInput
                   className={`p-4 rounded-xl text-sm ${isDark ? "bg-white/5 text-white" : "bg-gray-50 text-midnight-velvet"}`}
                   placeholder="vd: chill, music, pingme (cách nhau bởi dấu phẩy)"
                   placeholderTextColor="#888"
                   value={hashtags}
                   onChangeText={setHashtags}
                 />
               </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};
