import { View, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppSelector, useAppDispatch } from "@/features/store";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { searchService } from "@/services/music";
import { SongList, AlbumHeader, SongOptionsModal, AddToPlaylistModal, CreatePlaylistModal } from "@/components/music";
import type { SongResponseWithAllAlbum } from "@/types/music";
import { loadAndPlaySong, setQueue } from "@/features/slices/playerSlice";
import { Colors } from "@/constants/Colors";
import { useShufflePlay } from "@/hooks/useShufflePlay";
import { useSongActions } from "@/hooks/useSongActions";
import { usePlaylists } from "@/hooks/usePlaylists";

export default function AlbumDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const dispatch = useAppDispatch();
    const { mode } = useAppSelector((state) => state.theme);
    const isDark = mode === "dark";
    const { shuffleAndPlay } = useShufflePlay();
    const { create } = usePlaylists();

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
    const [album, setAlbum] = useState<any>(null);
    const [showCreatePlaylistModal, setShowCreatePlaylistModal] = useState(false);

    useEffect(() => {
        if (!id) return;

        const loadAlbumData = async () => {
            try {
                setLoading(true);
                const albumSongs = await searchService.getSongsByAlbum(Number(id));
                setSongs(albumSongs);

                // Get album info from first song - support both 'albums' and 'album'
                if (albumSongs.length > 0) {
                    const firstSong = albumSongs[0] as any;
                    const albumData = firstSong.albums || firstSong.album;

                    // Handle both array and single object
                    if (Array.isArray(albumData) && albumData.length > 0) {
                        setAlbum(albumData[0]);
                    } else if (albumData && typeof albumData === 'object') {
                        setAlbum(albumData);
                    }
                }
            } catch {
                // Error loading album
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

    const handlePlayAll = () => {
        if (songs.length === 0) return;
        dispatch(setQueue({ songs, startIndex: 0 }));
        dispatch(loadAndPlaySong(songs[0]));
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
                    onMorePress={handleMorePress}
                    variant="list"
                    showAlbum={false}
                    listHeaderComponent={
                        <AlbumHeader
                            isDark={isDark}
                            coverImageUrl={coverImageUrl}
                            albumTitle={album?.title || "Album"}
                            artistName={artistName}
                            songCount={songs.length}
                            onShufflePlay={() => shuffleAndPlay(songs)}
                            onPlayAll={handlePlayAll}
                        />
                    }
                />
            )}

            {/* Song Options Modal */}
            <SongOptionsModal
                visible={showOptionsModal}
                isDark={isDark}
                song={selectedSong}
                onClose={() => setShowOptionsModal(false)}
                options={getSongOptions().filter(option => option.id !== "go-to-album")}
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
                    onCreatePlaylist={() => {
                        setShowAddToPlaylistModal(false);
                        setShowCreatePlaylistModal(true);
                    }}
                />
            )}

            {/* Create Playlist Modal */}
            <CreatePlaylistModal
                visible={showCreatePlaylistModal}
                onClose={() => setShowCreatePlaylistModal(false)}
                onCreate={async (name) => {
                    if (!selectedSong) return;

                    try {
                        // Tạo playlist mới và lấy playlist vừa tạo
                        const newPlaylist = await create(name, false);

                        if (newPlaylist) {
                            // Thêm bài hát vào playlist mới
                            await handleAddSongToPlaylist(newPlaylist.id);
                        }

                        setShowCreatePlaylistModal(false);
                    } catch (error) {
                        // Error handled by handleAddSongToPlaylist
                    }
                }}
            />
        </SafeAreaView>
    );
}
