import type React from "react";
import { View, Text, FlatList, ActivityIndicator, Image, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SongCard } from "./SongCard";
import type { SongResponseWithAllAlbum } from "@/types/music";
import { useAppSelector } from "@/features/store";
import { useTabBarHeight } from "@/hooks/useTabBarHeight";

interface SongListProps {
    songs: SongResponseWithAllAlbum[];
    onSongPress?: (song: SongResponseWithAllAlbum, index: number) => void;
    onMorePress?: (song: SongResponseWithAllAlbum) => void;
    variant?: "default" | "compact" | "list";
    loading?: boolean;
    emptyMessage?: string;
    horizontal?: boolean;
    showAlbum?: boolean;
    showArtist?: boolean;
    onScroll?: (event: any) => void;
    scrollEventThrottle?: number;
    listHeaderComponent?: React.ReactElement | null;
    contentContainerStyle?: any;
}

export const SongList = ({
    songs,
    onSongPress,
    onMorePress,
    variant = "list",
    loading = false,
    emptyMessage = "No songs found",
    horizontal = false,
    showAlbum = true,
    showArtist = true,
    onScroll,
    scrollEventThrottle,
    listHeaderComponent,
    contentContainerStyle,
}: SongListProps) => {
    const { mode } = useAppSelector((state) => state.theme);
    const isDark = mode === "dark";
    const { currentSong, isPlayerMinimized } = useAppSelector((state) => state.player);
    const tabBarHeight = useTabBarHeight();
    const miniPlayerHeight = currentSong && isPlayerMinimized ? 76 : 0;
    const listBottomPadding = tabBarHeight + miniPlayerHeight + 16;

    const getSubtitle = (song: SongResponseWithAllAlbum) => {
        if (showArtist && song.mainArtist) return song.mainArtist.name;
        if (showAlbum && song.albums?.[0]) return song.albums[0].title;
        return "";
    };

    if (loading) {
        return (
            <View className="flex-1 items-center justify-center p-8">
                <ActivityIndicator size="large" color="#3b82f6" />
                <Text className="text-gray-400 mt-4">Loading songs...</Text>
            </View>
        );
    }

    if (!songs || songs.length === 0) {
        return (
            <View className="flex-1 items-center justify-center p-8">
                <Text className={`text-center ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                    {emptyMessage}
                </Text>
            </View>
        );
    }

    // Use compact layout for vertical list variant
    if (variant === "list" && !horizontal) {
        return (
            <FlatList
                data={songs}
                keyExtractor={(item) => item.id.toString()}
                showsVerticalScrollIndicator={false}
                onScroll={onScroll}
                scrollEventThrottle={scrollEventThrottle}
                renderItem={({ item, index }) => (
                    <TouchableOpacity
                        onPress={() => onSongPress?.(item, index)}
                        className="flex-row items-center px-4 py-3"
                        activeOpacity={0.7}
                    >
                        <Image
                            source={{
                                uri: item.coverImageUrl || "https://via.placeholder.com/50",
                            }}
                            className="w-12 h-12 rounded"
                        />
                        <View className="flex-1 ml-3">
                            <Text
                                className={`font-semibold ${isDark ? "text-white" : "text-gray-900"
                                    }`}
                                numberOfLines={1}
                            >
                                {item.title}
                            </Text>
                            <Text className="text-sm text-gray-400" numberOfLines={1}>
                                {getSubtitle(item)}
                            </Text>
                        </View>
                        <TouchableOpacity
                            onPress={() => onMorePress?.(item)}
                            className="p-2"
                        >
                            <Ionicons
                                name="ellipsis-vertical"
                                size={18}
                                color={isDark ? "#9ca3af" : "#6b7280"}
                            />
                        </TouchableOpacity>
                    </TouchableOpacity>
                )}
                ListHeaderComponent={listHeaderComponent}
                contentContainerStyle={[
                    { paddingBottom: listBottomPadding },
                    contentContainerStyle,
                ]}
            />
        );
    }

    return (
        <FlatList
            data={songs}
            keyExtractor={(item) => item.id.toString()}
            horizontal={horizontal}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            onScroll={onScroll}
            scrollEventThrottle={scrollEventThrottle}
            renderItem={({ item, index }) => (
                <View className={horizontal ? "" : "mb-2"}>
                    <SongCard
                        song={item}
                        onPress={() => onSongPress?.(item, index)}
                        onMorePress={() => onMorePress?.(item)}
                        variant={variant}
                        showAlbum={showAlbum}
                        showArtist={showArtist}
                    />
                </View>
            )}
            ListHeaderComponent={listHeaderComponent}
            contentContainerStyle={
                horizontal
                    ? [{ paddingHorizontal: 16 }, contentContainerStyle]
                    : [{ paddingBottom: listBottomPadding }, contentContainerStyle]
            }
        />
    );
};
