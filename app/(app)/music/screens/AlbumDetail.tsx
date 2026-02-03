import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppSelector, useAppDispatch } from "@/features/store";
import { useLocalSearchParams, router } from "expo-router";
import { useEffect, useState } from "react";
import { searchService } from "@/services/music";
import { SongList } from "@/components/music";
import { Ionicons } from "@expo/vector-icons";
import type { SongResponseWithAllAlbum } from "@/types/music";
import { loadAndPlaySong, setQueue } from "@/features/slices/playerSlice";

export default function AlbumDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const dispatch = useAppDispatch();
    const { mode } = useAppSelector((state) => state.theme);
    const isDark = mode === "dark";

    const [songs, setSongs] = useState<SongResponseWithAllAlbum[]>([]);
    const [loading, setLoading] = useState(true);
    const [album, setAlbum] = useState<any>(null);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const loadAlbumData = async () => {
        try {
            setLoading(true);
            const albumSongs = await searchService.getSongsByAlbum(Number(id));
            setSongs(albumSongs);

            // Get album info from first song
            if (albumSongs.length > 0 && albumSongs[0].albums?.[0]) {
                setAlbum(albumSongs[0].albums[0]);
            }
        } catch (error) {
            console.error("Failed to load album:", error);
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        if (id) {
            loadAlbumData();
        }
    }, [id, loadAlbumData]);

    const handleSongPress = (song: SongResponseWithAllAlbum, index: number) => {
        dispatch(setQueue({ songs, startIndex: index }));
        dispatch(loadAndPlaySong(song));
    };

    return (
        <SafeAreaView
            className={`flex-1 ${isDark ? "bg-background-dark" : "bg-background-light"}`}
        >
            {/* Header */}
            <View className="flex-row items-center px-4 py-2">
                <TouchableOpacity onPress={() => router.back()} className="p-2">
                    <Ionicons
                        name="chevron-back"
                        size={24}
                        color={isDark ? "white" : "#1f2937"}
                    />
                </TouchableOpacity>
                <Text
                    className={`flex-1 text-lg font-bold ml-2 ${isDark ? "text-white" : "text-gray-900"
                        }`}
                    numberOfLines={1}
                >
                    {album?.title || "Album"}
                </Text>
            </View>

            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#3b82f6" />
                </View>
            ) : (
                <SongList
                    songs={songs}
                    onSongPress={handleSongPress}
                    variant="list"
                    showAlbum={false}
                />
            )}
        </SafeAreaView>
    );
}
