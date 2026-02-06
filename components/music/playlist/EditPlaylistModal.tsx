import { Modal, View, Text, TextInput, TouchableOpacity, Switch } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";
import { useState, useEffect } from "react";
import { useAlert } from "@/components/ui/AlertProvider";

type EditPlaylistModalProps = {
    visible: boolean;
    isDark: boolean;
    playlistId: number;
    currentName: string;
    currentIsPublic: boolean;
    onClose: () => void;
    onSave: (name: string, isPublic: boolean) => Promise<void>;
};

export function EditPlaylistModal({
    visible,
    isDark,
    playlistId,
    currentName,
    currentIsPublic,
    onClose,
    onSave,
}: EditPlaylistModalProps) {
    const { showAlert } = useAlert();
    const [name, setName] = useState(currentName);
    const [isPublic, setIsPublic] = useState(currentIsPublic);
    const [saving, setSaving] = useState(false);

    // Update local state when props change
    useEffect(() => {
        if (visible) {
            setName(currentName);
            setIsPublic(currentIsPublic);
        }
    }, [visible, currentName, currentIsPublic]);

    const handleSave = async () => {
        const trimmedName = name.trim();

        if (!trimmedName) {
            showAlert({
                type: "error",
                title: "Lỗi",
                message: "Tên playlist không được để trống",
            });
            return;
        }

        if (trimmedName === currentName && isPublic === currentIsPublic) {
            showAlert({
                type: "info",
                title: "Thông báo",
                message: "Không có thay đổi nào",
            });
            return;
        }

        try {
            setSaving(true);
            await onSave(trimmedName, isPublic);
            onClose();
        } catch {
            // Error updating playlist
            showAlert({
                type: "error",
                title: "Lỗi",
                message: "Không thể cập nhật playlist",
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal visible={visible} animationType="fade" transparent={true}>
            <View className="flex-1 justify-center items-center bg-black/50">
                <View
                    className={`w-11/12 max-w-md rounded-2xl p-6 ${isDark ? "bg-gray-800" : "bg-white"
                        }`}
                >
                    {/* Header */}
                    <View className="flex-row items-center justify-between mb-6">
                        <Text className={`text-xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                            Chỉnh sửa playlist
                        </Text>
                        <TouchableOpacity onPress={onClose} disabled={saving}>
                            <Ionicons name="close" size={24} color={isDark ? "white" : "black"} />
                        </TouchableOpacity>
                    </View>

                    {/* Playlist Name Input */}
                    <View className="mb-6">
                        <Text className={`text-sm font-medium mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                            Tên playlist
                        </Text>
                        <TextInput
                            value={name}
                            onChangeText={setName}
                            placeholder="Nhập tên playlist"
                            placeholderTextColor="#9ca3af"
                            className={`px-4 py-3 rounded-lg text-base ${isDark
                                ? "bg-gray-700 text-white border-gray-600"
                                : "bg-gray-100 text-gray-900 border-gray-300"
                                } border`}
                            maxLength={100}
                            editable={!saving}
                        />
                        <Text className="text-xs text-gray-400 mt-1">
                            {name.length}/100 ký tự
                        </Text>
                    </View>

                    {/* Privacy Toggle */}
                    <View className="mb-6">
                        <View className="flex-row items-center justify-between">
                            <View className="flex-1">
                                <Text className={`text-base font-medium ${isDark ? "text-white" : "text-gray-900"}`}>
                                    {isPublic ? "Công khai" : "Riêng tư"}
                                </Text>
                                <Text className="text-sm text-gray-400 mt-1">
                                    {isPublic
                                        ? "Mọi người có thể xem playlist này"
                                        : "Chỉ bạn mới có thể xem"}
                                </Text>
                            </View>
                            <Switch
                                value={isPublic}
                                onValueChange={setIsPublic}
                                trackColor={{ false: "#6b7280", true: Colors.primary + "80" }}
                                thumbColor={isPublic ? Colors.primary : "#f3f4f6"}
                                disabled={saving}
                            />
                        </View>
                    </View>

                    {/* Action Buttons */}
                    <View className="flex-row gap-3">
                        <TouchableOpacity
                            onPress={onClose}
                            disabled={saving}
                            className={`flex-1 py-3 rounded-full ${isDark ? "bg-gray-700" : "bg-gray-200"
                                }`}
                            activeOpacity={0.7}
                        >
                            <Text
                                className={`text-center font-semibold ${isDark ? "text-white" : "text-gray-900"
                                    }`}
                            >
                                Hủy
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={handleSave}
                            disabled={saving || !name.trim()}
                            className="flex-1 py-3 rounded-full"
                            style={{ backgroundColor: Colors.primary }}
                            activeOpacity={0.8}
                        >
                            <Text className="text-white text-center font-semibold">
                                {saving ? "Đang lưu..." : "Lưu"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}
