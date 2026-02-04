import { View, Text, TouchableOpacity, ActivityIndicator, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppSelector, useAppDispatch } from "@/features/store";
import { useLocalSearchParams, router } from "expo-router";
import { useEffect, useState } from "react";
import { searchService } from "@/services/music";
import type { ArtistResponse, SongResponseWithAllAlbum } from "@/types/music";
import { loadAndPlaySong, setQueue } from "@/features/slices/playerSlice";
import { Colors } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { SongList } from "@/components/music";
import { useShufflePlay } from "@/hooks/useShufflePlay";

export default function ArtistDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const dispatch = useAppDispatch();
    const { mode } = useAppSelector((state) => state.theme);
    const isDark = mode === "dark";
    const { shuffleAndPlay } = useShufflePlay();

    const [artist, setArtist] = useState<ArtistResponse | null>(null);
    const [songs, setSongs] = useState<SongResponseWithAllAlbum[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Load artist data
    useEffect(() => {
        if (!id) return;

        const loadArtistData = async () => {
            try {
                setLoading(true);
                setError(null);
                const artistId = Number(id);
                // Load artist songs from searchService
                const artistSongs = await searchService.getSongsByArtist(artistId);

                if (!artistSongs || artistSongs.length === 0) {
                    setError("Nghệ sĩ chưa có bài hát nào");
                    setSongs([]);
                    setLoading(false);
                    return;
                }
                setSongs(artistSongs);

                // Extract artist info from first song
                const firstSong = artistSongs[0];
                if (firstSong.mainArtist?.id === artistId) {
                    setArtist({
                        id: firstSong.mainArtist.id,
                        name: firstSong.mainArtist.name,
                        bio: "",
                        imgUrl: firstSong.mainArtist.imgUrl || "",
                    });
                } else {
                    setError("Không tìm thấy thông tin nghệ sĩ");
                }
            } catch (error) {
                console.error("Failed to load artist data:", error);
                setError("Có lỗi khi tải dữ liệu");
                setArtist(null);
                setSongs([]);
            } finally {
                setLoading(false);
            }
        };

        loadArtistData();
    }, [id]);

    const handleSongPress = (song: SongResponseWithAllAlbum, index: number) => {
        dispatch(setQueue({ songs, startIndex: index }));
        dispatch(loadAndPlaySong(song));
    };

    const handlePlayAll = () => {
        if (songs.length === 0) return;
        dispatch(setQueue({ songs, startIndex: 0 }));
        dispatch(loadAndPlaySong(songs[0]));
    };

    if (loading) {
        return (
            <SafeAreaView className={`flex-1 ${isDark ? "bg-background-dark" : "bg-background-light"}`}>
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color={Colors.primary} />
                </View>
            </SafeAreaView>
        );
    }

    if (error || !artist) {
        return (
            <SafeAreaView className={`flex-1 ${isDark ? "bg-background-dark" : "bg-background-light"}`}>
                <TouchableOpacity onPress={() => router.back()} className="p-4">
                    <Ionicons name="chevron-back" size={24} color={isDark ? "white" : "black"} />
                </TouchableOpacity>
                <View className="flex-1 items-center justify-center px-6">
                    <Text className={`text-lg font-bold text-center ${isDark ? "text-white" : "text-gray-900"}`}>
                        {error || "Không tìm thấy nghệ sĩ"}
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className={`flex-1 ${isDark ? "bg-background-dark" : "bg-background-light"}`}>
            <SongList
                songs={songs}
                onSongPress={handleSongPress}
                variant="list"
                showAlbum={false}
                emptyMessage="Chưa có bài hát"
                listHeaderComponent={
                    <View>
                        {/* Artist Hero Section */}
                        <View className="w-full">
                            <View className="relative w-full h-80">
                                <Image
                                    source={{ uri: artist.imgUrl || "https://via.placeholder.com/600" }}
                                    className="w-full h-full"
                                    resizeMode="cover"
                                />
                                <LinearGradient
                                    colors={["rgba(0,0,0,0.0)", "rgba(0,0,0,0.65)"]}
                                    className="absolute bottom-0 left-0 right-0 h-24"
                                />
                                <View className="absolute bottom-3 left-4 right-4">
                                    <Text className="text-4xl font-bold text-white" numberOfLines={1}>
                                        {artist.name}
                                    </Text>
                                </View>
                                {/* Back Button */}
                                <View className="absolute top-12 left-4">
                                    <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
                                        <Ionicons name="chevron-back" size={26} color="white" />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Action Buttons */}
                            <View className="px-4 mt-6 mb-4 flex-row items-center gap-6">
                                <TouchableOpacity className="items-center">
                                    <Ionicons name="heart-outline" size={24} color={Colors.primary} />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    className="items-center"
                                    onPress={() => shuffleAndPlay(songs)}
                                >
                                    <Ionicons name="shuffle" size={24} color={Colors.primary} />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    className="w-16 h-16 rounded-full items-center justify-center"
                                    style={{ backgroundColor: Colors.primary }}
                                    onPress={handlePlayAll}
                                >
                                    <Ionicons name="play" size={28} color="white" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Phổ biến title */}
                        <View className="px-4 py-4">
                            <Text className="text-xl font-bold text-white">Phổ biến</Text>
                        </View>
                    </View>
                }
            />
        </SafeAreaView>
    );
}
