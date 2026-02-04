import { View, Text, TouchableOpacity, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppSelector, useAppDispatch } from "@/features/store";
import { useFavorites } from "@/hooks/useFavorites";
import { SongList, FavoritesHeader, MusicScreenHeader } from "@/components/music";
import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { songApi } from "@/services/music";
import type { SongResponseWithAllAlbum } from "@/types/music";
import { loadAndPlaySong, setQueue, setPlayerMinimized } from "@/features/slices/playerSlice";
import { getRandomInt } from "@/utils/random";


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
            <MusicScreenHeader
                title="Yêu thích"
                isDark={isDark}
                rightIconName="refresh"
                onRightPress={refetch}
            />

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