import { View, Text, FlatList, ActivityIndicator } from "react-native";
import { SongCard } from "./SongCard";
import type { SongResponseWithAllAlbum } from "@/types/music";
import { useAppSelector } from "@/features/store";

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
}: SongListProps) => {
    const { mode } = useAppSelector((state) => state.theme);
    const isDark = mode === "dark";

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

    return (
        <FlatList
            data={songs}
            keyExtractor={(item) => item.id.toString()}
            horizontal={horizontal}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
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
            contentContainerStyle={
                horizontal
                    ? { paddingHorizontal: 16 }
                    : { paddingBottom: 100 }
            }
        />
    );
};
