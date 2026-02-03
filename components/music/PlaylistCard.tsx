import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { PlaylistDto } from "@/types/music/playlist";
import { useAppSelector } from "@/features/store";

interface PlaylistCardProps {
    playlist: PlaylistDto;
    onPress?: () => void;
    onMorePress?: () => void;
    variant?: "default" | "compact";
}

export const PlaylistCard = ({
    playlist,
    onPress,
    onMorePress,
    variant = "default",
}: PlaylistCardProps) => {
    const { mode } = useAppSelector((state) => state.theme);
    const isDark = mode === "dark";

    if (variant === "compact") {
        return (
            <TouchableOpacity
                onPress={onPress}
                className={`flex-row items-center p-3 rounded-lg ${isDark ? "bg-gray-800/50" : "bg-gray-100"
                    }`}
                activeOpacity={0.7}
            >
                <View
                    className={`w-12 h-12 rounded-md items-center justify-center ${isDark ? "bg-gray-700" : "bg-gray-200"
                        }`}
                >
                    <Ionicons
                        name="musical-notes"
                        size={24}
                        color={isDark ? "#9ca3af" : "#6b7280"}
                    />
                </View>
                <View className="flex-1 ml-3">
                    <Text
                        className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}
                        numberOfLines={1}
                    >
                        {playlist.name}
                    </Text>
                    <View className="flex-row items-center mt-1">
                        <Ionicons
                            name={playlist.isPublic ? "globe-outline" : "lock-closed-outline"}
                            size={12}
                            color="#9ca3af"
                        />
                        <Text className="text-xs text-gray-400 ml-1">
                            {playlist.isPublic ? "Public" : "Private"}
                        </Text>
                    </View>
                </View>
                {onMorePress && (
                    <TouchableOpacity onPress={onMorePress} className="p-2">
                        <Ionicons name="ellipsis-vertical" size={20} color="#9ca3af" />
                    </TouchableOpacity>
                )}
            </TouchableOpacity>
        );
    }

    return (
        <TouchableOpacity
            onPress={onPress}
            className={`rounded-xl p-4 ${isDark ? "bg-gray-800/80" : "bg-white"
                } shadow-sm`}
            activeOpacity={0.8}
        >
            <View className="flex-row items-start justify-between mb-3">
                <View
                    className={`w-16 h-16 rounded-lg items-center justify-center ${isDark ? "bg-gray-700" : "bg-gray-200"
                        }`}
                >
                    <Ionicons
                        name="musical-notes"
                        size={32}
                        color={isDark ? "#9ca3af" : "#6b7280"}
                    />
                </View>
                {onMorePress && (
                    <TouchableOpacity onPress={onMorePress} className="p-1">
                        <Ionicons name="ellipsis-horizontal" size={24} color="#9ca3af" />
                    </TouchableOpacity>
                )}
            </View>

            <Text
                className={`font-bold text-base mb-1 ${isDark ? "text-white" : "text-gray-900"
                    }`}
                numberOfLines={2}
            >
                {playlist.name}
            </Text>

            <View className="flex-row items-center">
                <Ionicons
                    name={playlist.isPublic ? "globe-outline" : "lock-closed-outline"}
                    size={14}
                    color="#9ca3af"
                />
                <Text className="text-sm text-gray-400 ml-1">
                    {playlist.isPublic ? "Public Playlist" : "Private Playlist"}
                </Text>
            </View>
        </TouchableOpacity>
    );
};
