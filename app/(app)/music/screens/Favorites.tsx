import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppSelector } from "@/features/store";
import { router } from "expo-router";
import { useFavorites } from "@/hooks/useFavorites";
import { SongList } from "@/components/music";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { songApi } from "@/services/music";
import type { SongResponseWithAllAlbum } from "@/types/music";

export default function FavoritesScreen() {
    const { mode } = useAppSelector((state) => state.theme);
    const isDark = mode === "dark";
    const { favorites, refetch } = useFavorites();

    const [favoriteSongs, setFavoriteSongs] = useState<SongResponseWithAllAlbum[]>([]);
    const [loadingSongs, setLoadingSongs] = useState(true);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const loadFavoriteSongs = async () => {
        try {
            setLoadingSongs(true);
            const songPromises = favorites.map((fav) => songApi.getSongById(fav.songId));
            const songs = await Promise.all(songPromises);
            setFavoriteSongs(songs as any);
        } catch (error) {
            console.error("Failed to load favorite songs:", error);
        } finally {
            setLoadingSongs(false);
        }
    };
    useEffect(() => {
        loadFavoriteSongs();
    }, [favorites, loadFavoriteSongs]);

    return (
        <SafeAreaView
            className={`flex-1 ${isDark ? "bg-background-dark" : "bg-background-light"}`}
        >
            {/* Header */}
            <View className="flex-row items-center justify-between px-4 py-2">
                <View className="flex-row items-center">
                    <TouchableOpacity onPress={() => router.back()} className="p-2">
                        <Ionicons
                            name="chevron-back"
                            size={24}
                            color={isDark ? "white" : "#1f2937"}
                        />
                    </TouchableOpacity>
                    <Text
                        className={`text-lg font-bold ml-2 ${isDark ? "text-white" : "text-gray-900"
                            }`}
                    >
                        Favorites
                    </Text>
                </View>
                <TouchableOpacity onPress={refetch} className="p-2">
                    <Ionicons
                        name="refresh"
                        size={24}
                        color={isDark ? "white" : "#1f2937"}
                    />
                </TouchableOpacity>
            </View>

            <SongList
                songs={favoriteSongs}
                loading={loadingSongs}
                variant="list"
                emptyMessage="No favorite songs yet"
            />
        </SafeAreaView>
    );
}
