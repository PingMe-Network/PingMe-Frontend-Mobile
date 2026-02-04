import { View, Text, TouchableOpacity, ActivityIndicator, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppSelector, useAppDispatch } from "@/features/store";
import { useLocalSearchParams, router } from "expo-router";
import { useEffect, useState } from "react";
import { searchService } from "@/services/music";
import { SongList } from "@/components/music";
import { Ionicons } from "@expo/vector-icons";
import type { SongResponseWithAllAlbum } from "@/types/music";
import { loadAndPlaySong, setQueue } from "@/features/slices/playerSlice";
import { Colors } from "@/constants/Colors";

export default function AlbumDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const dispatch = useAppDispatch();
    const { mode } = useAppSelector((state) => state.theme);
    const isDark = mode === "dark";

    const [songs, setSongs] = useState<SongResponseWithAllAlbum[]>([]);
    const [loading, setLoading] = useState(true);
    const [album, setAlbum] = useState<any>(null);

    useEffect(() => {
        if (!id) return;

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

        loadAlbumData();
    }, [id]);

    const handleSongPress = (song: SongResponseWithAllAlbum, index: number) => {
        dispatch(setQueue({ songs, startIndex: index }));
        dispatch(loadAndPlaySong(song));
    };

    const coverImageUrl = songs[0]?.coverImageUrl;
    const artistName = songs[0]?.mainArtist?.name;

    return (
        <SafeAreaView
            className={`flex-1 ${isDark ? "bg-background-dark" : "bg-background-light"}`}
        >
            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color={Colors.primary} />
                </View>
            ) : (
                <SongList
                    songs={songs}
                    onSongPress={handleSongPress}
                    variant="list"
                    showAlbum={false}
                    listHeaderComponent={
                        <View className="px-4 pt-2 pb-4">
                            {/* Header */}
                            <View className="flex-row items-center">
                                <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
                                    <Ionicons
                                        name="chevron-back"
                                        size={24}
                                        color={isDark ? Colors.text.dark : Colors.text.light}
                                    />
                                </TouchableOpacity>
                            </View>

                            {/* Album Art */}
                            <View className="items-center mt-2">
                                <Image
                                    source={{
                                        uri: coverImageUrl || "https://via.placeholder.com/300",
                                    }}
                                    className="w-80 h-80 rounded-2xl"
                                    resizeMode="cover"
                                />
                            </View>

                            {/* Album Info */}
                            <View className="mt-6">
                                <Text
                                    className="text-3xl font-bold"
                                    style={{ color: isDark ? Colors.text.dark : Colors.text.light }}
                                    numberOfLines={1}
                                >
                                    {album?.title || "Album"}
                                </Text>
                                {artistName && (
                                    <View className="flex-row items-center mt-2">
                                        <View
                                            className="h-9 w-9 rounded-full items-center justify-center border"
                                            style={{
                                                backgroundColor: isDark
                                                    ? Colors.background.dark
                                                    : Colors.background.light,
                                                borderColor: Colors.text.gray,
                                            }}
                                        >
                                            <Ionicons name="person" size={18} color={Colors.text.gray} />
                                        </View>
                                        <Text
                                            className="ml-3 font-semibold"
                                            style={{ color: isDark ? Colors.text.dark : Colors.text.light }}
                                        >
                                            {artistName}
                                        </Text>
                                    </View>
                                )}
                                <Text className="mt-2" style={{ color: Colors.text.gray }}>
                                    {songs.length} bài hát
                                </Text>
                            </View>

                            {/* Actions */}
                            <View className="mt-6 flex-row items-center justify-between">
                                <View className="flex-row items-center gap-4">
                                    <TouchableOpacity
                                        className="h-11 w-11 items-center justify-center rounded-full border"
                                        style={{
                                            backgroundColor: isDark
                                                ? Colors.background.dark
                                                : Colors.background.light,
                                            borderColor: Colors.text.gray,
                                        }}
                                    >
                                        <Ionicons name="add" size={22} color={Colors.text.gray} />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        className="h-11 w-11 items-center justify-center rounded-full border"
                                        style={{
                                            backgroundColor: isDark
                                                ? Colors.background.dark
                                                : Colors.background.light,
                                            borderColor: Colors.text.gray,
                                        }}
                                    >
                                        <Ionicons name="arrow-down" size={22} color={Colors.text.gray} />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        className="h-11 w-11 items-center justify-center rounded-full border"
                                        style={{
                                            backgroundColor: isDark
                                                ? Colors.background.dark
                                                : Colors.background.light,
                                            borderColor: Colors.text.gray,
                                        }}
                                    >
                                        <Ionicons name="ellipsis-horizontal" size={20} color={Colors.text.gray} />
                                    </TouchableOpacity>
                                </View>

                                <View className="flex-row items-center gap-4">
                                    <TouchableOpacity className="h-12 w-12 items-center justify-center rounded-full">
                                        <Ionicons name="shuffle" size={22} color={Colors.primary} />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        className="h-14 w-14 items-center justify-center rounded-full"
                                        style={{ backgroundColor: Colors.primary }}
                                    >
                                        <Ionicons name="play" size={22} color="white" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}
