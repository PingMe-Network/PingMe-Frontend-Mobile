import { View, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppSelector, useAppDispatch } from "@/features/store";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { searchService } from "@/services/music";
import { SongList, MusicScreenHeader, SongOptionsModal, AddToPlaylistModal } from "@/components/music";
import type { SongResponseWithAllAlbum } from "@/types/music";
import { loadAndPlaySong, setQueue, setPlayerMinimized } from "@/features/slices/playerSlice";
import { Colors } from "@/constants/Colors";
import { useSongActions } from "@/hooks/useSongActions";

export default function GenreSongsScreen() {
    const { id, name } = useLocalSearchParams<{ id: string; name: string }>();
    const dispatch = useAppDispatch();
    const { mode } = useAppSelector((state) => state.theme);
    const isDark = mode === "dark";

    const {
        selectedSong,
        showOptionsModal,
        showAddToPlaylistModal,
        setShowOptionsModal,
        setShowAddToPlaylistModal,
        handleMorePress,
        handleAddSongToPlaylist,
        playlists,
        getSongOptions,
    } = useSongActions();

    const [songs, setSongs] = useState<SongResponseWithAllAlbum[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;

        const loadGenreSongs = async () => {
            try {
                setLoading(true);
                const genreSongs = await searchService.getSongsByGenre(Number(id));
                setSongs(genreSongs);
            } catch (error) {
                console.error("Error loading genre songs:", error);
            } finally {
                setLoading(false);
            }
        };

        loadGenreSongs();
    }, [id]);

    const handleSongPress = (song: SongResponseWithAllAlbum, index: number) => {
        dispatch(setQueue({ songs, startIndex: index }));
        dispatch(loadAndPlaySong(song));
        dispatch(setPlayerMinimized(true));
    };

    return (
        <SafeAreaView
            className={`flex-1 ${isDark ? "bg-background-dark" : "bg-background-light"}`}
        >
            <MusicScreenHeader
                title={name || "Thể loại"}
                isDark={isDark}
            />

            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color={Colors.primary} />
                </View>
            ) : (
                <SongList
                    songs={songs}
                    loading={false}
                    variant="list"
                    emptyMessage="Không có bài hát nào trong thể loại này"
                    onSongPress={handleSongPress}
                    onMorePress={handleMorePress}
                />
            )}

            {/* Song Options Modal */}
            <SongOptionsModal
                visible={showOptionsModal}
                isDark={isDark}
                song={selectedSong}
                onClose={() => setShowOptionsModal(false)}
                options={getSongOptions()}
            />

            {/* Add to Playlist Modal */}
            {selectedSong && (
                <AddToPlaylistModal
                    visible={showAddToPlaylistModal}
                    isDark={isDark}
                    songId={selectedSong.id}
                    songTitle={selectedSong.title}
                    playlists={playlists}
                    onClose={() => setShowAddToPlaylistModal(false)}
                    onAddToPlaylist={handleAddSongToPlaylist}
                />
            )}
        </SafeAreaView>
    );
}
