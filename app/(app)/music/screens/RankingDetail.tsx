import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState, useCallback } from "react";
import { View, Text, TouchableOpacity, Platform, ActivityIndicator, RefreshControl } from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SongList, useSongModals, RankingHeader } from "@/components/music";
import { useAppSelector, useAppDispatch } from "@/features/store";
import { songApi } from "@/services/music/songApi";
import type { SongResponseWithAllAlbum, TopSongPlayCounter } from "@/types/music";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { loadAndPlaySong, setQueue } from "@/features/slices/playerSlice";
import { Colors } from "@/constants/Colors";
import { useShufflePlay } from "@/hooks/useShufflePlay";
import { normalizeTopSong } from "@/utils/musicNormalization";
import { hydrateSongs } from "@/utils/musicHydration";

type RankingType = "today" | "week" | "month";

export default function RankingDetail() {
    const { type, title } = useLocalSearchParams<{ type: RankingType; title: string }>();
    const router = useRouter();
    const dispatch = useAppDispatch();
    const insets = useSafeAreaInsets();
    const { mode } = useAppSelector((state) => state.theme);
    const { hasCountedPlay } = useAppSelector((state) => state.player);
    const isDark = mode === "dark";
    const { shuffleAndPlay } = useShufflePlay();
    const { handleMorePress, modalsJSX } = useSongModals({ isDark });

    const [songs, setSongs] = useState<SongResponseWithAllAlbum[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchRanking = useCallback(async (isSilentUpdate = false) => {
        if (!isSilentUpdate) {
            setLoading(true);
        }
        try {
            let data: (TopSongPlayCounter | SongResponseWithAllAlbum)[] = [];
            if (type === "today") {
                data = await songApi.getTopSongsToday(30);
            } else if (type === "week") {
                data = await songApi.getTopSongsThisWeek(30);
            } else if (type === "month") {
                data = await songApi.getTopSongsThisMonth(30);
            }

            // If it's the first load, show immediate data to be snappy
            if (!isSilentUpdate) {
                const initialSongs = data.map(normalizeTopSong);
                setSongs(initialSongs);
                setLoading(false);
            }

            // Hydrate in background
            const fullyHydratedSongs = await hydrateSongs(data);

            // Update with full details
            setSongs(fullyHydratedSongs);

        } catch (error) {
            console.error("Failed to fetch ranking details:", error);
            if (!isSilentUpdate) setLoading(false);
        } finally {
            setRefreshing(false);
        }
    }, [type]);

    useEffect(() => {
        if (type) {
            setLoading(true);
            fetchRanking();
        }
    }, [fetchRanking, type]);

    useEffect(() => {
        if (hasCountedPlay) {
            const timer = setTimeout(() => {
                fetchRanking(true);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [hasCountedPlay, fetchRanking]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchRanking();
    }, [fetchRanking]);

    const handleBack = () => router.back();

    const handleSongPress = (song: SongResponseWithAllAlbum, index: number) => {
        dispatch(setQueue({ songs, startIndex: index }));
        dispatch(loadAndPlaySong(song));
    };

    const handlePlayAll = () => {
        if (songs.length === 0) return;
        dispatch(setQueue({ songs, startIndex: 0 }));
        dispatch(loadAndPlaySong(songs[0]));
    };

    const currentDate = format(new Date(), "dd/MM/yyyy", { locale: vi });

    const headerImage = songs.length > 0
        ? songs[0].coverImageUrl
        : "https://via.placeholder.com/400";

    const HeaderComponent = () => (
        <RankingHeader
            headerImage={headerImage}
            title={title || "Bảng Xếp Hạng"}
            currentDate={currentDate}
            songCount={songs.length}
            isDark={isDark}
            topInset={insets.top}
            onBack={handleBack}
            onPlayAll={handlePlayAll}
            onShufflePlay={() => shuffleAndPlay(songs)}
        />
    );

    return (
        <View className={`flex-1 ${isDark ? "bg-black" : "bg-white"}`}>
            {loading && songs.length === 0 ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color={Colors.primary} />
                </View>
            ) : (
                <SongList
                    songs={songs}
                    onSongPress={handleSongPress}
                    onMorePress={handleMorePress}
                    variant="list"
                    showRank={true}
                    listHeaderComponent={<HeaderComponent />}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
                    }
                />
            )}
            {modalsJSX}
        </View>
    );
}
