import { Modal, View, Text, TextInput, TouchableOpacity, FlatList, ActivityIndicator, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";
import { useState, useEffect, useMemo } from "react";
import { songApi } from "@/services/music";
import type { SongResponseWithAllAlbum } from "@/types/music";

const ItemSeparator = () => <View className="h-1" />;

type AddSongToPlaylistModalProps = {
    visible: boolean;
    isDark: boolean;
    playlistId: number;
    existingSongIds: number[];
    onClose: () => void;
    onAddSong: (songId: number) => Promise<void>;
};

export function AddSongToPlaylistModal({
    visible,
    isDark,
    playlistId,
    existingSongIds,
    onClose,
    onAddSong,
}: Readonly<AddSongToPlaylistModalProps>) {
    const [searchQuery, setSearchQuery] = useState("");
    const [allSongs, setAllSongs] = useState<SongResponseWithAllAlbum[]>([]);
    const [loading, setLoading] = useState(false);
    const [addingSongId, setAddingSongId] = useState<number | null>(null);

    // Load songs when user searches
    useEffect(() => {
        if (visible) {
            // Clear state when modal opens
            setSearchQuery("");
            setAllSongs([]);
        }
    }, [visible]);

    // Search songs when query changes
    useEffect(() => {
        if (searchQuery.trim()) {
            loadSongs(searchQuery);
        } else {
            setAllSongs([]);
        }
    }, [searchQuery]);

    const loadSongs = async (query: string) => {
        try {
            setLoading(true);
            const response = await songApi.searchSongByTitle(query);
            setAllSongs(response || []);
        } catch {
            // Error loading songs
        } finally {
            setLoading(false);
        }
    };

    // Filter songs based on search query and exclude existing songs
    const filteredSongs = useMemo(() => {
        if (!searchQuery.trim()) {
            return [];
        }

        // Filter out songs that are already in the playlist
        return allSongs.filter((song) => !existingSongIds.includes(song.id));
    }, [allSongs, searchQuery, existingSongIds]);

    const handleAddSong = async (songId: number) => {
        try {
            setAddingSongId(songId);
            await onAddSong(songId);
            // Remove added song from the list
            setAllSongs((prev) => prev.filter((song) => song.id !== songId));
        } catch {
            // Error adding song
        } finally {
            setAddingSongId(null);
        }
    };

    const renderSongItem = ({ item }: { item: SongResponseWithAllAlbum }) => {
        const isAdding = addingSongId === item.id;

        return (
            <TouchableOpacity
                onPress={() => handleAddSong(item.id)}
                disabled={isAdding}
                className={`flex-row items-center px-4 py-3 ${isDark ? "bg-gray-800/50" : "bg-gray-100/50"
                    }`}
            >
                {/* Song Cover */}
                <View className="w-12 h-12 rounded-md overflow-hidden mr-3">
                    {item.coverImageUrl ? (
                        <Image source={{ uri: item.coverImageUrl }} className="w-full h-full" />
                    ) : (
                        <View className={`w-full h-full items-center justify-center ${isDark ? "bg-gray-700" : "bg-gray-300"}`}>
                            <Ionicons name="musical-note" size={20} color={Colors.primary} />
                        </View>
                    )}
                </View>

                {/* Song Info */}
                <View className="flex-1">
                    <Text
                        className={`text-base font-semibold ${isDark ? "text-white" : "text-gray-900"}`}
                        numberOfLines={1}
                    >
                        {item.title}
                    </Text>
                    <Text className="text-sm text-gray-400" numberOfLines={1}>
                        {item.mainArtist?.name || "Unknown Artist"}
                    </Text>
                </View>

                {/* Add Button */}
                {isAdding ? (
                    <ActivityIndicator size="small" color={Colors.primary} />
                ) : (
                    <Ionicons name="add-circle-outline" size={28} color={Colors.primary} />
                )}
            </TouchableOpacity>
        );
    };

    const getEmptyStateMessage = () => {
        if (searchQuery.trim()) {
            return loading ? "Đang tìm kiếm..." : "Không tìm thấy bài hát nào";
        }
        return "Nhập từ khóa để tìm kiếm bài hát";
    };

    return (
        <Modal visible={visible} animationType="slide" transparent={false}>
            <View className={`flex-1 ${isDark ? "bg-gray-900" : "bg-white"}`}>
                {/* Header */}
                <View
                    className={`px-4 py-4 border-b ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
                        }`}
                    style={{ paddingTop: 50 }}
                >
                    <View className="flex-row items-center justify-between mb-4">
                        <Text className={`text-xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                            Thêm bài hát
                        </Text>
                        <TouchableOpacity onPress={onClose} className="p-2 -mr-2">
                            <Ionicons name="close" size={28} color={isDark ? "white" : "black"} />
                        </TouchableOpacity>
                    </View>

                    {/* Search Bar */}
                    <View
                        className={`flex-row items-center px-4 py-2.5 rounded-full ${isDark ? "bg-gray-700" : "bg-gray-100"
                            }`}
                    >
                        <Ionicons name="search" size={20} color="#9ca3af" />
                        <TextInput
                            placeholder="Tìm kiếm bài hát..."
                            placeholderTextColor="#9ca3af"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            className={`flex-1 ml-3 text-base ${isDark ? "text-white" : "text-gray-900"}`}
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery("")}>
                                <Ionicons name="close-circle" size={20} color="#9ca3af" />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* Song List */}
                {loading ? (
                    <View className="flex-1 items-center justify-center">
                        <ActivityIndicator size="large" color={Colors.primary} />
                    </View>
                ) : (
                    <FlatList
                        data={filteredSongs}
                        renderItem={renderSongItem}
                        keyExtractor={(item) => item.id.toString()}
                        contentContainerStyle={{ paddingVertical: 8 }}
                        ItemSeparatorComponent={ItemSeparator}
                        ListEmptyComponent={
                            <View className="px-4 py-12">
                                <Text className="text-gray-400 text-center text-base">
                                    {getEmptyStateMessage()}
                                </Text>
                            </View>
                        }
                    />
                )}
            </View>
        </Modal>
    );
}
