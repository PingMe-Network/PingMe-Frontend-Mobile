import { View, Text, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { AlbumResponse } from "@/types/music";

interface SearchAlbumItemProps {
    album: AlbumResponse;
    onPress: () => void;
    isDark: boolean;
}

export function SearchAlbumItem({ album, onPress, isDark }: SearchAlbumItemProps) {
    return (
        <TouchableOpacity
            onPress={onPress}
            className="flex-row items-center py-2"
            activeOpacity={0.7}
        >
            <Image
                source={{ uri: album.coverImgUrl }}
                className="w-14 h-14 rounded"
            />
            <View className="flex-1 ml-3">
                <Text
                    className={`text-base font-medium ${isDark ? "text-white" : "text-gray-900"}`}
                    numberOfLines={1}
                >
                    {album.title}
                </Text>
                <Text
                    className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
                    numberOfLines={1}
                >
                    Album
                </Text>
            </View>
            <TouchableOpacity className="p-2">
                <Ionicons
                    name="add-circle-outline"
                    size={24}
                    color={isDark ? "#9CA3AF" : "#6B7280"}
                />
            </TouchableOpacity>
        </TouchableOpacity>
    );
}
