import { View, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppSelector, useAppDispatch } from "@/features/store";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { searchService } from "@/services/music";
import { SongList, AlbumHeader } from "@/components/music";
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
                        <AlbumHeader
                            isDark={isDark}
                            coverImageUrl={coverImageUrl}
                            albumTitle={album?.title || "Album"}
                            artistName={artistName}
                            songCount={songs.length}
                        />
                    }
                />
            )}
        </SafeAreaView>
    );
}
