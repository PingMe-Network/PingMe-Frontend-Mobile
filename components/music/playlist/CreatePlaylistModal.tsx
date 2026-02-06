import { useState, useEffect } from "react";
import {
    View,
    Text,
    Modal,
    TextInput,
    TouchableOpacity,
    Pressable,
} from "react-native";
import { Colors } from "@/constants/Colors";

interface CreatePlaylistModalProps {
    visible: boolean;
    onClose: () => void;
    onCreate: (name: string) => void;
    isDark?: boolean;
    existingPlaylistCount?: number;
}

export default function CreatePlaylistModal({
    visible,
    onClose,
    onCreate,
    isDark = false,
    existingPlaylistCount = 0,
}: Readonly<CreatePlaylistModalProps>) {
    const [playlistName, setPlaylistName] = useState("");

    // Generate default playlist name based on count
    useEffect(() => {
        if (visible) {
            const defaultName = `My playlist #${existingPlaylistCount + 1}`;
            setPlaylistName(defaultName);
        }
    }, [visible, existingPlaylistCount]);

    const handleCreate = () => {
        if (playlistName.trim()) {
            onCreate(playlistName.trim());
            setPlaylistName("");
            onClose();
        }
    };

    const handleCancel = () => {
        setPlaylistName("");
        onClose();
    };

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            {/* Backdrop */}
            <Pressable
                className="flex-1 bg-black/80 justify-center items-center px-5"
                onPress={handleCancel}
            >
                {/* Modal Content */}
                <Pressable
                    className={`w-full max-w-sm rounded-xl p-6 ${isDark ? "bg-gray-800" : "bg-gray-700"
                        }`}
                    onPress={(e) => e.stopPropagation()}
                >
                    {/* Title */}
                    <Text className="text-white text-xl font-bold text-center mb-8">
                        Tên playlist của bạn
                    </Text>

                    {/* Input Field */}
                    <View className="w-full mb-8">
                        <TextInput
                            className={`w-full rounded-lg px-4 py-3.5 text-lg font-semibold text-white text-center ${isDark ? "bg-gray-700" : "bg-gray-600"
                                }`}
                            value={playlistName}
                            onChangeText={setPlaylistName}
                            placeholder="My playlist #1"
                            placeholderTextColor="#9ca3af"
                            autoFocus
                            selectTextOnFocus
                            maxLength={50}
                        />
                    </View>

                    {/* Buttons */}
                    <View className="flex-row gap-4 w-full">
                        <TouchableOpacity
                            className="flex-1 py-3.5 px-6 rounded-full border border-gray-500 items-center justify-center"
                            onPress={handleCancel}
                            activeOpacity={0.7}
                        >
                            <Text className="text-white text-base font-semibold">
                                Hủy
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            className="flex-1 py-3.5 px-6 rounded-full items-center justify-center"
                            style={{ backgroundColor: Colors.primary }}
                            onPress={handleCreate}
                            activeOpacity={0.8}
                        >
                            <Text className="text-white text-base font-bold">
                                Tạo
                            </Text>
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Pressable>
        </Modal>
    );
}
