import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState, useCallback } from "react";
import { View, Text, TouchableOpacity, Platform, ActivityIndicator, RefreshControl } from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SongList, useSongModals } from "@/components/music";
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
    const isDark = mode === "dark";
    const { shuffleAndPlay } = useShufflePlay();
    const { handleMorePress, modalsJSX } = useSongModals({ isDark });

    const [songs, setSongs] = useState<SongResponseWithAllAlbum[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchRanking = useCallback(async () => {
        try {
            let data: (TopSongPlayCounter | SongResponseWithAllAlbum)[] = [];
            if (type === "today") {
                data = await songApi.getTopSongsToday(30);
            } else if (type === "week") {
                data = await songApi.getTopSongsThisWeek(30);
            } else if (type === "month") {
                data = await songApi.getTopSongsThisMonth(30);
            }

            // 1. Immediate Display: Show what we have
            const initialSongs = data.map(normalizeTopSong);
            setSongs(initialSongs);
            setLoading(false); // UNBLOCK UI IMMEDIATELY

            // 2. Background Hydration: Fetch full details
            const fullyHydratedSongs = await hydrateSongs(data);
            setSongs(fullyHydratedSongs);

        } catch (error) {
            console.error("Failed to fetch ranking details:", error);
            setLoading(false);
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

    // Use first song's image as header background if available
    const headerImage = songs.length > 0
        ? songs[0].coverImageUrl
        : "https://via.placeholder.com/400";

    const HeaderComponent = () => (
        <View className="relative h-80 w-full overflow-hidden mb-4">
            <Image
                source={{ uri: headerImage }}
                className="absolute w-full h-full"
                style={{ width: '100%', height: '100%', position: 'absolute' }}
                contentFit="cover"
                blurRadius={Platform.OS === 'ios' ? 10 : 3}
            />
            {/* Overlay for better readability */}
            <View className="absolute w-full h-full bg-black/30" />
            <LinearGradient
                colors={['transparent', isDark ? '#000000' : '#ffffff']}
                className="absolute w-full h-full"
            />

            <View
                style={{ paddingTop: insets.top + 10 }}
                className="px-4 h-full flex justify-between pb-6"
            >
                <TouchableOpacity onPress={handleBack} className="w-10 h-10 items-center justify-center rounded-full bg-black/20">
                    <Ionicons name="chevron-back" size={24} color="white" />
                </TouchableOpacity>

                <View>
                    <Text className="text-white text-3xl font-bold mb-2 shadow-sm">
                        {title || "Bảng Xếp Hạng"}
                    </Text>
                    <View className="flex-row items-center mb-4">
                        <Text className="text-gray-300 text-sm mr-2">Cập nhật {currentDate}</Text>
                        <Ionicons name="chevron-down" size={14} color="#d1d5db" />
                    </View>

                    <View className="flex-row items-center justify-between">
                        <View className="flex-row gap-4">
                            <TouchableOpacity className="items-center justify-center">
                                <Ionicons name="arrow-redo-outline" size={24} color="white" />
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => shuffleAndPlay(songs)}
                                className="overflow-hidden rounded-full"
                            >
                                <LinearGradient
                                    colors={['#ec4899', '#a855f7']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    className="px-6 py-2 flex-row items-center"
                                >
                                    <Ionicons name="shuffle" size={16} color="white" style={{ marginRight: 4 }} />
                                    <Text className="font-bold text-white">Ngẫu nhiên</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            onPress={handlePlayAll}
                            className="w-12 h-12 rounded-full overflow-hidden"
                        >
                            <LinearGradient
                                colors={['#ec4899', '#a855f7']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                className="w-full h-full items-center justify-center"
                            >
                                <Ionicons name="play" size={24} color="white" style={{ marginLeft: 2 }} />
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            <View className="px-4 flex-row items-center justify-between mt-2">
                <Text className={`text-base font-medium ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                    {songs.length} bài
                </Text>
                <View className="flex-row gap-4">
                    <TouchableOpacity>
                        <Ionicons name="download-outline" size={22} color={isDark ? "#9ca3af" : "#4b5563"} />
                    </TouchableOpacity>
                    <TouchableOpacity>
                        <Ionicons name="add-circle-outline" size={22} color={isDark ? "#9ca3af" : "#4b5563"} />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
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
