import { Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppSelector, useAppDispatch } from "@/features/store";
import { useFavorites } from "@/hooks/useFavorites";
import { useShufflePlay } from "@/hooks/useShufflePlay";
import { usePlaylists } from "@/hooks/usePlaylists";
import { SongList, FavoritesHeader, MusicScreenHeader, SongOptionsModal, AddToPlaylistModal, AddSongToPlaylistModal } from "@/components/music";
import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { songApi } from "@/services/music";
import type { SongResponseWithAllAlbum } from "@/types/music";
import { loadAndPlaySong, setQueue, setPlayerMinimized } from "@/features/slices/playerSlice";
import { router } from "expo-router";
import { useAlert } from "@/components/ui/AlertProvider";


const fetchFavoriteSongs = async (favorites: { songId: number }[]) => {
    if (favorites.length === 0) return [];

    const songs: SongResponseWithAllAlbum[] = [];
    for (const fav of favorites) {
        const song = await songApi.getSongById(fav.songId);
        songs.push(song as SongResponseWithAllAlbum);
    }

    return songs;
};

export default function FavoritesScreen() {
    const { mode } = useAppSelector((state) => state.theme);
    const dispatch = useAppDispatch();
    const isDark = mode === "dark";
    const { favorites, toggle: toggleFavorite } = useFavorites();
    const { playlists, addSong } = usePlaylists();
    const { shuffleAndPlay } = useShufflePlay();
    const { showAlert } = useAlert();
    const [favoriteSongs, setFavoriteSongs] = useState<SongResponseWithAllAlbum[]>([]);
    const [loadingSongs, setLoadingSongs] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [showOptionsModal, setShowOptionsModal] = useState(false);
    const [showAddToPlaylistModal, setShowAddToPlaylistModal] = useState(false);
    const [showAddSongModal, setShowAddSongModal] = useState(false);
    const [selectedSong, setSelectedSong] = useState<SongResponseWithAllAlbum | null>(null);
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

            const songs = await fetchFavoriteSongs(favorites);
            setFavoriteSongs(songs);
        } catch {
            showAlert({
                type: "error",
                title: "Lỗi",
                message: "Không thể tải bài hát yêu thích",
            });
            setFavoriteSongs([]);
        } finally {
            setLoadingSongs(false);
        }
    }, [favorites, showAlert]);

    useEffect(() => {
        loadFavoriteSongs();
    }, [favorites, loadFavoriteSongs]);

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

    const handleRemoveFavorite = async () => {
        if (!selectedSong) return;
        try {
            await toggleFavorite(selectedSong.id);
            showAlert({
                type: "success",
                title: "Thành công",
                message: `Đã xóa "${selectedSong.title}" khỏi yêu thích`,
            });
        } catch {
            showAlert({
                type: "error",
                title: "Lỗi",
                message: "Không thể xóa khỏi yêu thích",
            });
        }
    };

    const handleGoToAlbum = () => {
        if (!selectedSong?.albums?.[0]?.id) return;
        router.push(`/(app)/music/screens/AlbumDetail?id=${selectedSong.albums[0].id}`);
    };

    const handleGoToArtist = () => {
        if (!selectedSong?.mainArtist?.id) return;
        router.push(`/(app)/music/screens/ArtistDetail?id=${selectedSong.mainArtist.id}`);
    };

    const handleAddSongToFavorites = async (songId: number) => {
        try {
            await toggleFavorite(songId);
            showAlert({
                type: "success",
                title: "Thành công",
                message: "Đã thêm bài hát vào yêu thích",
            });
        } catch {
            showAlert({
                type: "error",
                title: "Lỗi",
                message: "Không thể thêm bài hát vào yêu thích",
            });
        }
    };

    const existingFavoriteSongIds = useMemo(() => {
        return favoriteSongs.map(song => song.id);
    }, [favoriteSongs]);



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
                onShufflePlay={() => shuffleAndPlay(filteredSongs)}
                onPlayAll={handlePlayAll}
                onAddPress={() => setShowAddSongModal(true)}
            />

            <SongList
                songs={filteredSongs}
                loading={loadingSongs}
                variant="list"
                emptyMessage={
                    searchQuery ? "Không tìm thấy bài hát" : "Chưa có bài hát yêu thích"
                }
                onSongPress={handleSongPress}
                onMorePress={handleMorePress}
                onScroll={handleScroll}
                scrollEventThrottle={16}
            />

            {/* Song Options Modal */}
            <SongOptionsModal
                visible={showOptionsModal}
                isDark={isDark}
                song={selectedSong}
                onClose={() => setShowOptionsModal(false)}
                options={[
                    {
                        id: "share",
                        label: "Chia sẻ",
                        icon: "share-outline",
                        action: handleShare,
                    },
                    {
                        id: "add-to-playlist",
                        label: "Thêm vào playlist",
                        icon: "add-circle-outline",
                        action: handleAddToPlaylist,
                    },
                    {
                        id: "remove-favorite",
                        label: "Xóa khỏi yêu thích",
                        icon: "heart-dislike-outline",
                        action: () => void handleRemoveFavorite(),
                    },
                    {
                        id: "go-to-album",
                        label: "Chuyển đến album",
                        icon: "disc-outline",
                        action: () => void handleGoToAlbum(),
                    },
                    {
                        id: "go-to-artist",
                        label: "Chuyển đến nghệ sĩ",
                        icon: "person-outline",
                        action: () => void handleGoToArtist(),
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

            {/* Add Song to Favorites Modal */}
            <AddSongToPlaylistModal
                visible={showAddSongModal}
                isDark={isDark}
                playlistId={0}
                existingSongIds={existingFavoriteSongIds}
                onClose={() => setShowAddSongModal(false)}
                onAddSong={handleAddSongToFavorites}
            />
        </SafeAreaView>
    );
}