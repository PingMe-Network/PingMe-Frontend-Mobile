import { View, Text, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { SongResponseWithAllAlbum } from "@/types/music";

interface SearchSongItemProps {
    song: SongResponseWithAllAlbum;
    onPress: () => void;
    onMorePress: () => void;
    isDark: boolean;
}

export function SearchSongItem({ song, onPress, onMorePress, isDark }: SearchSongItemProps) {
    return (
        <TouchableOpacity
            onPress={onPress}
            className="flex-row items-center py-2"
            activeOpacity={0.7}
        >
            <Image
                source={{ uri: song.coverImageUrl }}
                className="w-14 h-14 rounded"
            />
            <View className="flex-1 ml-3">
                <Text
                    className={`text-base font-medium ${isDark ? "text-white" : "text-gray-900"}`}
                    numberOfLines={1}
                >
                    {song.title}
                </Text>
                <Text
                    className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
                    numberOfLines={1}
                >
                    Bài hát • {song.mainArtist?.name}
                </Text>
            </View>
            <TouchableOpacity
                onPress={onMorePress}
                className="p-2"
            >
                <Ionicons
                    name="ellipsis-vertical"
                    size={20}
                    color={isDark ? "#9CA3AF" : "#6B7280"}
                />
            </TouchableOpacity>
        </TouchableOpacity>
    );
}
