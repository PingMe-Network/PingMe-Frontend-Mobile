import { Modal, View, Text, TouchableOpacity, FlatList, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import type { PlaylistDto } from "@/types/music/playlist";

type AddToPlaylistModalProps = {
    visible: boolean;
    isDark: boolean;
    songId: number;
    songTitle: string;
    playlists: PlaylistDto[];
    onClose: () => void;
    onAddToPlaylist: (playlistId: number) => Promise<void>;
};

export function AddToPlaylistModal({
    visible,
    isDark,
    songId,
    songTitle,
    playlists,
    onClose,
    onAddToPlaylist,
}: Readonly<AddToPlaylistModalProps>) {
    const [addingToPlaylistId, setAddingToPlaylistId] = useState<number | null>(null);

    const handleSelectPlaylist = async (playlistId: number) => {
        try {
            setAddingToPlaylistId(playlistId);
            await onAddToPlaylist(playlistId);
            onClose();
        } catch {
            // Error adding to playlist
        } finally {
            setAddingToPlaylistId(null);
        }
    };

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
                    style={{ maxHeight: '80%' }}
                >
                    {/* Header */}
                    <View className={`px-4 pt-4 pb-3 border-b ${isDark ? "border-gray-700" : "border-gray-200"}`}>
                        <View className="flex-row items-center justify-between">
                            <View className="flex-1">
                                <Text className={`text-lg font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                                    Thêm vào playlist
                                </Text>
                                <Text className={`text-sm mt-0.5 ${isDark ? "text-gray-400" : "text-gray-600"}`} numberOfLines={1}>
                                    {songTitle}
                                </Text>
                            </View>
                            <TouchableOpacity onPress={onClose} className="p-2">
                                <Ionicons name="close" size={24} color={isDark ? "white" : "#1f2937"} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Playlists List */}
                    <FlatList
                        data={playlists}
                        keyExtractor={(item) => item.id.toString()}
                        contentContainerStyle={{ paddingVertical: 8 }}
                        renderItem={({ item }) => {
                            const isAdding = addingToPlaylistId === item.id;

                            return (
                                <TouchableOpacity
                                    onPress={() => handleSelectPlaylist(item.id)}
                                    disabled={isAdding}
                                    className={`flex-row items-center px-4 py-3 ${isDark ? "active:bg-gray-700" : "active:bg-gray-100"
                                        }`}
                                >
                                    {/* Playlist Icon */}
                                    <View className={`w-12 h-12 rounded-md items-center justify-center mr-3 ${isDark ? "bg-gray-700" : "bg-gray-200"
                                        }`}>
                                        <Ionicons
                                            name="musical-notes"
                                            size={24}
                                            color={isDark ? "#9ca3af" : "#6b7280"}
                                        />
                                    </View>

                                    {/* Playlist Info */}
                                    <View className="flex-1">
                                        <Text
                                            className={`text-base font-medium ${isDark ? "text-white" : "text-gray-900"}`}
                                            numberOfLines={1}
                                        >
                                            {item.name}
                                        </Text>
                                        <View className="flex-row items-center mt-0.5">
                                            <Ionicons
                                                name={item.isPublic ? "globe-outline" : "lock-closed-outline"}
                                                size={12}
                                                color="#9ca3af"
                                            />
                                            <Text className="text-xs text-gray-400 ml-1">
                                                {item.isPublic ? "Public" : "Private"}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Loading or Add Icon */}
                                    {isAdding ? (
                                        <ActivityIndicator size="small" color={isDark ? "#9ca3af" : "#6b7280"} />
                                    ) : (
                                        <Ionicons
                                            name="chevron-forward"
                                            size={20}
                                            color={isDark ? "#6b7280" : "#9ca3af"}
                                        />
                                    )}
                                </TouchableOpacity>
                            );
                        }}
                        ListEmptyComponent={
                            <View className="py-12 px-4">
                                <Text className={`text-center ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                                    Bạn chưa có playlist nào
                                </Text>
                            </View>
                        }
                    />

                    {/* Bottom Safe Area */}
                    <View className="h-8" />
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    );
}
