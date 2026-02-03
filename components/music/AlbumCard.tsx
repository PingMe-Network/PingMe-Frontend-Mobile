import { View, Text, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { AlbumResponse } from "@/types/music";
import { useAppSelector } from "@/features/store";

interface AlbumCardProps {
    album: AlbumResponse;
    onPress?: () => void;
    variant?: "default" | "compact";
}

export const AlbumCard = ({ album, onPress, variant = "default" }: AlbumCardProps) => {
    const { mode } = useAppSelector((state) => state.theme);
    const isDark = mode === "dark";

    if (variant === "compact") {
        return (
            <TouchableOpacity
                onPress={onPress}
                className="w-32 mr-4"
                activeOpacity={0.7}
            >
                <Image
                    source={{ uri: album.coverImgUrl || "https://via.placeholder.com/128" }}
                    className="w-32 h-32 rounded-lg"
                    resizeMode="cover"
                />
                <Text
                    className={`font-semibold mt-2 ${isDark ? "text-white" : "text-gray-900"}`}
                    numberOfLines={1}
                >
                    {album.title}
                </Text>
                <View className="flex-row items-center mt-1">
                    <Ionicons name="play-circle-outline" size={12} color="#9ca3af" />
                    <Text className="text-xs text-gray-400 ml-1">
                        {album.playCount.toLocaleString()}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    }

    return (
        <TouchableOpacity
            onPress={onPress}
            className={`rounded-xl overflow-hidden ${isDark ? "bg-gray-800/80" : "bg-white"
                } shadow-sm`}
            activeOpacity={0.8}
        >
            <Image
                source={{ uri: album.coverImgUrl || "https://via.placeholder.com/200" }}
                className="w-full h-48"
                resizeMode="cover"
            />
            <View className="p-4">
                <Text
                    className={`font-bold text-base mb-1 ${isDark ? "text-white" : "text-gray-900"
                        }`}
                    numberOfLines={1}
                >
                    {album.title}
                </Text>
                <View className="flex-row items-center">
                    <Ionicons name="play-circle-outline" size={14} color="#9ca3af" />
                    <Text className="text-sm text-gray-400 ml-1">
                        {album.playCount.toLocaleString()} plays
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );
};
