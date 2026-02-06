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

const PlaylistIcon = ({ size, isDark }: { size: number; isDark: boolean }) => {
    const borderRadius = size === 12 ? 'md' : 'lg';
    const backgroundColor = isDark ? "bg-gray-700" : "bg-gray-200";

    return (
        <View
            className={`rounded-${borderRadius} items-center justify-center ${backgroundColor}`}
            style={{ width: size * 4, height: size * 4 }}
        >
            <Ionicons
                name="musical-notes"
                size={size * 2}
                color={isDark ? "#9ca3af" : "#6b7280"}
            />
        </View>
    );
};

const PlaylistPrivacyBadge = ({ isPublic, size = "sm" }: { isPublic: boolean; size?: "sm" | "xs" }) => {
    const iconSize = size === "sm" ? 14 : 12;
    const isSmall = size === "sm";
    let label = "";
    if (isPublic) {
        label = isSmall ? "Public Playlist" : "Public";
    } else {
        label = isSmall ? "Private Playlist" : "Private";
    }

    return (
        <View className="flex-row items-center">
            <Ionicons
                name={isPublic ? "globe-outline" : "lock-closed-outline"}
                size={iconSize}
                color="#9ca3af"
            />
            <Text className={`text-${size} text-gray-400 ml-1`}>
                {label}
            </Text>
        </View>
    );
};

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
                <PlaylistIcon size={12} isDark={isDark} />
                <View className="flex-1 ml-3">
                    <Text
                        className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}
                        numberOfLines={1}
                    >
                        {playlist.name}
                    </Text>
                    <PlaylistPrivacyBadge isPublic={playlist.isPublic} size="xs" />
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
                <PlaylistIcon size={16} isDark={isDark} />
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

            <PlaylistPrivacyBadge isPublic={playlist.isPublic} size="sm" />
        </TouchableOpacity>
    );
};
