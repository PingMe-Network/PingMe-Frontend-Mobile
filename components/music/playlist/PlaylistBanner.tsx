import { View, Text, TouchableOpacity, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";
import { PlaylistCover } from "./PlaylistCover";

export type PlaylistBannerProps = {
    isDark: boolean;
    playlistName: string;
    isPublic: boolean;
    songCount: number;
    coverImages?: (string | null | undefined)[];
    searchQuery?: string;
    onSearchChange?: (text: string) => void;
    onClearSearch?: () => void;
    onShufflePlay: () => void;
    onPlayAll: () => void;
    onAddSong?: () => void;
    onSort?: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
    onShare?: () => void;
    onDownload?: () => void;
};

export function PlaylistBanner({
    isDark,
    playlistName,
    isPublic,
    songCount,
    coverImages = [],
    searchQuery,
    onSearchChange,
    onClearSearch,
    onShufflePlay,
    onPlayAll,
    onAddSong,
    onSort,
    onEdit,
    onDelete,
    onShare,
    onDownload,
}: Readonly<PlaylistBannerProps>) {
    return (
        <View className="px-4 pt-3 pb-6" style={{ minHeight: 100 }}>
            {/* Search Bar */}
            {onSearchChange && (
                <View className="mb-4">
                    <View
                        className={`flex-row items-center px-4 py-2.5 rounded-full ${isDark ? "bg-gray-800/80" : "bg-gray-900/70"
                            }`}
                    >
                        <Ionicons name="search" size={20} color="#d1d5db" />
                        <TextInput
                            placeholder="Tìm trên trang này"
                            placeholderTextColor="#9ca3af"
                            value={searchQuery}
                            onChangeText={onSearchChange}
                            className="flex-1 ml-3 text-base text-white"
                        />
                        {searchQuery && searchQuery.length > 0 && onClearSearch && (
                            <TouchableOpacity onPress={onClearSearch}>
                                <Ionicons name="close-circle" size={20} color="#9ca3af" />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            )}

            {/* Show playlist info only when not searching */}
            {!searchQuery && (
                <>
                    {/* Playlist Cover */}
                    <View className="items-center mb-4">
                        <PlaylistCover coverImages={coverImages} size={192} isDark={isDark} />
                    </View>

                    {/* Playlist Name */}
                    <Text
                        className={`text-2xl font-bold mb-3 ${isDark ? "text-white" : "text-gray-900"
                            }`}
                    >
                        {playlistName}
                    </Text>

                    {/* Privacy Badge & Song Count */}
                    <View className="flex-row items-center gap-2 mb-4">
                        <Ionicons
                            name={isPublic ? "globe-outline" : "lock-closed-outline"}
                            size={14}
                            color="#9ca3af"
                        />
                        <Text className="text-sm text-gray-400">
                            {isPublic ? "Public" : "Private"} • {songCount} Phút
                        </Text>
                    </View>

                    {/* Primary Action Icons */}
                    <View className="flex-row items-center justify-between mb-4">
                        <View className="flex-row gap-4">
                            {onDownload && (
                                <TouchableOpacity onPress={onDownload} className="p-2">
                                    <Ionicons name="download-outline" size={28} color="white" />
                                </TouchableOpacity>
                            )}
                            {onShare && (
                                <TouchableOpacity onPress={onShare} className="p-2">
                                    <Ionicons name="share-outline" size={28} color="white" />
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity className="p-2">
                                <Ionicons name="ellipsis-horizontal" size={28} color="white" />
                            </TouchableOpacity>
                        </View>

                        <View className="flex-row gap-4 items-center">
                            {/* Shuffle Button */}
                            <TouchableOpacity
                                onPress={onShufflePlay}
                                activeOpacity={0.7}
                                disabled={songCount === 0}
                                className="p-2"
                            >
                                <Ionicons name="shuffle" size={32} color="white" />
                            </TouchableOpacity>

                            {/* Play Button */}
                            <TouchableOpacity
                                onPress={onPlayAll}
                                activeOpacity={0.8}
                                disabled={songCount === 0}
                                className="w-14 h-14 rounded-full items-center justify-center"
                                style={{ backgroundColor: Colors.primary }}
                            >
                                <Ionicons name="play" size={28} color="white" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Secondary Action Buttons */}
                    <View className="flex-row gap-2 flex-wrap">
                        {onAddSong && (
                            <TouchableOpacity
                                onPress={onAddSong}
                                className={`flex-row items-center px-4 py-2 rounded-full ${isDark ? "bg-gray-800/70" : "bg-gray-700/70"
                                    }`}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="add" size={18} color="white" />
                                <Text className="text-white font-medium ml-1">Thêm</Text>
                            </TouchableOpacity>
                        )}

                        {onEdit && (
                            <TouchableOpacity
                                onPress={onEdit}
                                className={`flex-row items-center px-4 py-2 rounded-full ${isDark ? "bg-gray-800/70" : "bg-gray-700/70"
                                    }`}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="create-outline" size={18} color="white" />
                                <Text className="text-white font-medium ml-1">Chỉnh sửa</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </>
            )}
        </View>
    )
}