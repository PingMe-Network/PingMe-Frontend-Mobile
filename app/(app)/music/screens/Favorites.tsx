import { View, Text, TouchableOpacity, Animated, TextInput, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppSelector, useAppDispatch } from "@/features/store";
import { router } from "expo-router";
import { useFavorites } from "@/hooks/useFavorites";
import { SongList } from "@/components/music";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { songApi } from "@/services/music";
import type { SongResponseWithAllAlbum } from "@/types/music";
import { loadAndPlaySong, setQueue, setPlayerMinimized } from "@/features/slices/playerSlice";
import { getRandomInt } from "@/utils/random";

type HeaderProps = {
    isDark: boolean;
    headerHeight: any;
    searchOpacity: any;
    titleOpacity: any;
    searchQuery: string;
    onSearchChange: (value: string) => void;
    onClearSearch: () => void;
    headerCover?: string;
    songCount: number;
    onShufflePlay: () => void;
    onPlayAll: () => void;
};

const FavoritesHeader = ({
    isDark,
    headerHeight,
    searchOpacity,
    titleOpacity,
    searchQuery,
    onSearchChange,
    onClearSearch,
    headerCover,
    songCount,
    onShufflePlay,
    onPlayAll,
}: HeaderProps) => (
    <Animated.View
        style={{ height: headerHeight }}
        className={isDark ? "bg-background-dark" : "bg-background-light"}
    >
        <Animated.View style={{ opacity: searchOpacity }} className="px-4 pt-2">
            <View className="flex-row items-center">
                <View
                    className={`flex-1 flex-row items-center px-4 py-2 ${isDark ? "bg-gray-800/80" : "bg-gray-200"
                        }`}
                >
                    <Ionicons
                        name="search"
                        size={18}
                        color={isDark ? "#9ca3af" : "#6b7280"}
                    />
                    <TextInput
                        placeholder="Tìm trong mục Bài hát đã thích"
                        placeholderTextColor={isDark ? "#6b7280" : "#9ca3af"}
                        value={searchQuery}
                        onChangeText={onSearchChange}
                        className={`flex-1 ml-2 ${isDark ? "text-white" : "text-gray-900"
                            }`}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={onClearSearch}>
                            <Ionicons
                                name="close"
                                size={18}
                                color={isDark ? "#9ca3af" : "#6b7280"}
                            />
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </Animated.View>

        <Animated.View style={{ opacity: titleOpacity }} className="px-4 pt-6">
            <Text
                className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"
                    }`}
            >
                Bài hát đã thích
            </Text>
            <Text className={isDark ? "text-gray-300" : "text-gray-500"}>
                {songCount} bài hát
            </Text>

            <View className="mt-4 flex-row items-center justify-between">
                <View className="flex-row items-center gap-4">
                    <View
                        className={`h-12 w-12 rounded-lg ${isDark ? "bg-gray-700" : "bg-gray-200"
                            } overflow-hidden items-center justify-center`}
                    >
                        {headerCover ? (
                            <Image
                                source={{ uri: headerCover }}
                                className="h-12 w-12"
                                resizeMode="cover"
                            />
                        ) : (
                            <Ionicons
                                name="musical-notes"
                                size={20}
                                color={isDark ? "#e5e7eb" : "#374151"}
                            />
                        )}
                    </View>
                    <TouchableOpacity className="h-12 w-12 items-center justify-center rounded-full border border-gray-500/40">
                        <Ionicons
                            name="arrow-down"
                            size={20}
                            color={isDark ? "#e5e7eb" : "#374151"}
                        />
                    </TouchableOpacity>
                </View>

                <View className="flex-row items-center gap-4">
                    <TouchableOpacity
                        className="h-12 w-12 items-center justify-center rounded-full"
                        onPress={onShufflePlay}
                    >
                        <Ionicons
                            name="shuffle"
                            size={22}
                            color={isDark ? "#e5e7eb" : "#374151"}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity
                        className="h-14 w-14 items-center justify-center rounded-full bg-primary"
                        onPress={onPlayAll}
                    >
                        <Ionicons name="play" size={22} color="white" />
                    </TouchableOpacity>
                </View>
            </View>
        </Animated.View>
    </Animated.View>
);

const ErrorBanner = ({
    message,
    onRetry,
    isDark,
}: {
    message: string | null;
    onRetry: () => void;
    isDark: boolean;
}) => {
    if (!message) return null;

    return (
        <View className={`px-4 py-2 ${isDark ? "bg-red-900" : "bg-red-100"}`}>
            <View className="flex-row items-center justify-between">
                <Text className={isDark ? "text-red-200" : "text-red-800"}>
                    {message}
                </Text>
                <TouchableOpacity onPress={onRetry}>
                    <Text className="text-primary font-semibold">Thử lại</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const fetchFavoriteSongs = async (favorites: { songId: number }[]) => {
    if (favorites.length === 0) return [];

    const songs: SongResponseWithAllAlbum[] = [];
    for (const fav of favorites) {
        try {
            const song = await songApi.getSongById(fav.songId);
            songs.push(song as SongResponseWithAllAlbum);
        } catch (err) {
            console.warn(`Failed to load song ${fav.songId}:`, err);
        }
    }

    return songs;
};

export default function FavoritesScreen() {
    const { mode } = useAppSelector((state) => state.theme);
    const dispatch = useAppDispatch();
    const isDark = mode === "dark";
    const { favorites, refetch } = useFavorites();

    const [favoriteSongs, setFavoriteSongs] = useState<SongResponseWithAllAlbum[]>([]);
    const [loadingSongs, setLoadingSongs] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [error, setError] = useState<string | null>(null);
    const scrollY = useRef(new Animated.Value(0)).current;

    const headerHeight = scrollY.interpolate({
        inputRange: [0, 140],
        outputRange: [220, 90],
        extrapolate: "clamp",
    });
    const searchOpacity = scrollY.interpolate({
        inputRange: [0, 60],
        outputRange: [1, 0],
        extrapolate: "clamp",
    });
    const titleOpacity = scrollY.interpolate({
        inputRange: [0, 120],
        outputRange: [1, 0],
        extrapolate: "clamp",
    });

    const loadFavoriteSongs = useCallback(async () => {
        try {
            setLoadingSongs(true);
            setError(null);

            const songs = await fetchFavoriteSongs(favorites);
            setFavoriteSongs(songs);
        } catch (error) {
            console.error("Failed to load favorite songs:", error);
            setError("Không thể tải bài hát yêu thích");
            setFavoriteSongs([]);
        } finally {
            setLoadingSongs(false);
        }
    }, [favorites]);

    useEffect(() => {
        loadFavoriteSongs();
    }, [favorites.length, loadFavoriteSongs]);

    const filteredSongs = useMemo(() => {
        if (!searchQuery.trim()) return favoriteSongs;
        const query = searchQuery.toLowerCase();
        return favoriteSongs.filter(
            (song) =>
                song.title.toLowerCase().includes(query) ||
                song.mainArtist?.name.toLowerCase().includes(query),
        );
    }, [favoriteSongs, searchQuery]);

    const headerCover = favoriteSongs[0]?.coverImageUrl;

    const handleSongPress = (song: SongResponseWithAllAlbum, index: number) => {
        dispatch(setQueue({ songs: filteredSongs, startIndex: index }));
        dispatch(loadAndPlaySong(song));
        dispatch(setPlayerMinimized(true));
    };

    const handlePlayAll = () => {
        if (filteredSongs.length === 0) return;
        dispatch(setQueue({ songs: filteredSongs, startIndex: 0 }));
        dispatch(loadAndPlaySong(filteredSongs[0]));
        dispatch(setPlayerMinimized(true));
    };


    const handleShufflePlay = () => {
        if (filteredSongs.length === 0) return;
        const shuffled = [...filteredSongs];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = getRandomInt(i + 1);
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }

        dispatch(setQueue({ songs: shuffled, startIndex: 0 }));
        dispatch(loadAndPlaySong(shuffled[0]));
        dispatch(setPlayerMinimized(true));
    };

    const handleScroll = (event: any) => {
        const currentScrollY = event.nativeEvent.contentOffset.y;
        scrollY.setValue(currentScrollY);
    };

    return (
        <SafeAreaView
            className={`flex-1 ${isDark ? "bg-background-dark" : "bg-background-light"}`}
        >
            {/* Sticky Header */}
            <View className="flex-row items-center justify-between px-4 py-2">
                <View className="flex-row items-center gap-2">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="p-2 -ml-2"
                    >
                        <Ionicons
                            name="chevron-back"
                            size={24}
                            color={isDark ? "white" : "#1f2937"}
                        />
                    </TouchableOpacity>
                    <Text
                        className={`text-lg font-bold ${isDark ? "text-white" : "text-gray-900"
                            }`}
                    >
                        Yêu thích
                    </Text>
                </View>
                <TouchableOpacity
                    onPress={refetch}
                    className="p-2 -mr-2"
                >
                    <Ionicons
                        name="refresh"
                        size={24}
                        color={isDark ? "white" : "#1f2937"}
                    />
                </TouchableOpacity>
            </View>

            <FavoritesHeader
                isDark={isDark}
                headerHeight={headerHeight}
                searchOpacity={searchOpacity}
                titleOpacity={titleOpacity}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onClearSearch={() => setSearchQuery("")}
                headerCover={headerCover}
                songCount={favoriteSongs.length}
                onShufflePlay={handleShufflePlay}
                onPlayAll={handlePlayAll}
            />

            <ErrorBanner message={error} onRetry={refetch} isDark={isDark} />

            <SongList
                songs={filteredSongs}
                loading={loadingSongs}
                variant="list"
                emptyMessage={
                    searchQuery ? "Không tìm thấy bài hát" : "Chưa có bài hát yêu thích"
                }
                onSongPress={handleSongPress}
                onScroll={handleScroll}
                scrollEventThrottle={16}
            />
        </SafeAreaView>
    );
}