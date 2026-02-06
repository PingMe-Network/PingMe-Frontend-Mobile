import { Modal, View, Text, TouchableOpacity, ScrollView, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { SongResponseWithAllAlbum } from "@/types/music";

type SongOption = {
    id: string;
    label: string;
    icon: string;
    action: () => void;
};

type SongOptionsModalProps = {
    visible: boolean;
    isDark: boolean;
    song: SongResponseWithAllAlbum | null;
    options: SongOption[];
    onClose: () => void;
};

export function SongOptionsModal({
    visible,
    isDark,
    song,
    options,
    onClose,
}: Readonly<SongOptionsModalProps>) {
    if (!song) return null;

    return (
        <Modal visible={visible} animationType="slide" transparent={true}>
            <TouchableOpacity
                className="flex-1 justify-end bg-black/50"
                activeOpacity={1}
                onPress={onClose}
            >
                <TouchableOpacity
                    activeOpacity={1}
                    className={`rounded-t-3xl ${isDark ? "bg-gray-800" : "bg-white"}`}
                >
                    {/* Song Info Header */}
                    <View className={`px-4 pt-4 pb-3 border-b ${isDark ? "border-gray-700" : "border-gray-200"}`}>
                        <View className="flex-row items-center">
                            {/* Song Cover */}
                            <View className="w-12 h-12 rounded-md overflow-hidden mr-3">
                                {song.coverImageUrl ? (
                                    <Image
                                        source={{ uri: song.coverImageUrl }}
                                        className="w-full h-full"
                                    />
                                ) : (
                                    <View className={`w-full h-full items-center justify-center ${isDark ? "bg-gray-700" : "bg-gray-300"}`}>
                                        <Ionicons name="musical-note" size={24} color={isDark ? "#9ca3af" : "#6b7280"} />
                                    </View>
                                )}
                            </View>

                            <View className="flex-1">
                                <Text
                                    className={`text-base font-semibold ${isDark ? "text-white" : "text-gray-900"}`}
                                    numberOfLines={1}
                                >
                                    {song.title}
                                </Text>
                                <Text className={`text-sm mt-0.5 ${isDark ? "text-gray-400" : "text-gray-600"}`} numberOfLines={1}>
                                    {song.mainArtist?.name || "Unknown Artist"}
                                </Text>
                            </View>
                            <TouchableOpacity onPress={onClose} className="p-2">
                                <Ionicons name="close" size={24} color={isDark ? "white" : "#1f2937"} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Options List */}
                    <ScrollView className="max-h-96">
                        {options.map((option) => (
                            <TouchableOpacity
                                key={option.id}
                                onPress={() => {
                                    onClose();
                                    // Small delay to ensure modal closes before action
                                    setTimeout(() => {
                                        option.action();
                                    }, 100);
                                }}
                                className={`flex-row items-center px-4 py-4 ${isDark ? "active:bg-gray-700" : "active:bg-gray-100"}`}
                            >
                                <View
                                    className={`w-10 h-10 rounded-full items-center justify-center ${isDark ? "bg-gray-700" : "bg-gray-200"}`}
                                >
                                    <Ionicons
                                        name={option.icon as any}
                                        size={20}
                                        color={isDark ? "#9ca3af" : "#6b7280"}
                                    />
                                </View>
                                <Text
                                    className={`ml-4 text-base ${isDark ? "text-white" : "text-gray-900"}`}
                                >
                                    {option.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* Bottom Safe Area */}
                    <View className="h-8" />
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    );
}
