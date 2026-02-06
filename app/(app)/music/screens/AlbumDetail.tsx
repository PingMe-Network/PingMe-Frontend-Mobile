import { View, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppSelector, useAppDispatch } from "@/features/store";
import { useLocalSearchParams, router } from "expo-router";
import { useEffect, useState } from "react";
import { searchService } from "@/services/music";
import { SongList, AlbumHeader, SongOptionsModal, AddToPlaylistModal } from "@/components/music";
import type { SongResponseWithAllAlbum } from "@/types/music";
import { loadAndPlaySong, setQueue } from "@/features/slices/playerSlice";
import { Colors } from "@/constants/Colors";
import { useShufflePlay } from "@/hooks/useShufflePlay";
import { useFavorites } from "@/hooks/useFavorites";
import { usePlaylists } from "@/hooks/usePlaylists";
import { useAlert } from "@/components/ui/AlertProvider";

export default function AlbumDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const dispatch = useAppDispatch();
    const { mode } = useAppSelector((state) => state.theme);
    const isDark = mode === "dark";
    const { shuffleAndPlay } = useShufflePlay();
    const { isFavorite, toggle: toggleFavorite } = useFavorites();
    const { playlists, addSong } = usePlaylists();
    const { showAlert } = useAlert();

    const [songs, setSongs] = useState<SongResponseWithAllAlbum[]>([]);
    const [showOptionsModal, setShowOptionsModal] = useState(false);
    const [showAddToPlaylistModal, setShowAddToPlaylistModal] = useState(false);
    const [selectedSong, setSelectedSong] = useState<SongResponseWithAllAlbum | null>(null);
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

    const handleMorePress = (song: SongResponseWithAllAlbum) => {
        setSelectedSong(song);
        setShowOptionsModal(true);
    };

    const handleShare = () => {
        if (!selectedSong) return;
        showAlert({
            type: "info",
            title: "Chia sẻ",
            message: `Chia sẻ "${selectedSong.title}" đang phát triển!`,
        });
    };

    const handleAddToPlaylist = () => {
        setShowAddToPlaylistModal(true);
    };

    const handleAddSongToPlaylist = async (playlistId: number) => {
        if (!selectedSong) return;
        try {
            await addSong(playlistId, selectedSong.id);
            showAlert({
                type: "success",
                title: "Thành công",
                message: `Đã thêm "${selectedSong.title}" vào playlist`,
            });
        } catch {
            showAlert({
                type: "error",
                title: "Lỗi",
                message: "Không thể thêm bài hát vào playlist",
            });
        }
    };

    const handleToggleFavorite = async () => {
        if (!selectedSong) return;
        try {
            await toggleFavorite(selectedSong.id);
            const action = isFavorite(selectedSong.id) ? "Đã xóa khỏi" : "Đã thêm vào";
            showAlert({
                type: "success",
                title: "Thành công",
                message: `${action} yêu thích "${selectedSong.title}"`,
            });
        } catch {
            showAlert({
                type: "error",
                title: "Lỗi",
                message: "Không thể cập nhật yêu thích",
            });
        }
    };

    const handleGoToArtist = () => {
        if (!selectedSong?.mainArtist?.id) return;
        router.push(`/(app)/music/screens/ArtistDetail?id=${selectedSong.mainArtist.id}`);
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
                options={[
                    {
                        id: "favorite",
                        label: selectedSong && isFavorite(selectedSong.id) ? "Xóa khỏi yêu thích" : "Thêm vào yêu thích",
                        icon: selectedSong && isFavorite(selectedSong.id) ? "heart-dislike-outline" : "heart-outline",
                        action: handleToggleFavorite,
                    },
                    {
                        id: "add-to-playlist",
                        label: "Thêm vào playlist",
                        icon: "add-circle-outline",
                        action: handleAddToPlaylist,
                    },
                    {
                        id: "share",
                        label: "Chia sẻ",
                        icon: "share-outline",
                        action: handleShare,
                    },
                    {
                        id: "go-to-artist",
                        label: "Chuyển đến nghệ sĩ",
                        icon: "person-outline",
                        action: handleGoToArtist,
                    },
                ]}
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
