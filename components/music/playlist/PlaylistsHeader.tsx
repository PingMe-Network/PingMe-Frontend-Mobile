import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";

export type PlaylistsHeaderProps = {
    isDark: boolean;
    playlistCount: number;
    onCreatePress: () => void;
    onBackPress?: () => void;
};

export function PlaylistsHeader({
    isDark,
    playlistCount,
    onCreatePress,
    onBackPress,
}: Readonly<PlaylistsHeaderProps>) {
    return (
        <View className="px-4 pt-2 pb-3">
            {/* Title Row */}
            <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center gap-2">
                    {onBackPress && (
                        <TouchableOpacity
                            onPress={onBackPress}
                            activeOpacity={0.7}
                            className="p-2 -ml-2"
                        >
                            <Ionicons
                                name="chevron-back"
                                size={24}
                                color={isDark ? "white" : "#1f2937"}
                            />
                        </TouchableOpacity>
                    )}
                    <Text
                        className={`text-lg font-bold ${isDark ? "text-white" : "text-gray-900"
                            }`}
                    >
                        Playlists
                    </Text>
                </View>

                <TouchableOpacity
                    onPress={onCreatePress}
                    activeOpacity={0.7}
                    className="p-1"
                >
                    <Ionicons
                        name="add-circle"
                        size={32}
                        color={Colors.primary}
                    />
                </TouchableOpacity>
            </View>

            {/* Playlist Count */}
            <Text className="text-sm text-gray-400">
                {playlistCount === 0
                    ? "Chưa có playlist nào"
                    : `${playlistCount} playlist${playlistCount > 1 ? "s" : ""}`}
            </Text>
        </View>
    );
}
