import { View, ActivityIndicator, Animated, Text, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppSelector, useAppDispatch } from "@/features/store";
import { useLocalSearchParams, router } from "expo-router";
import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { SongList, PlaylistBanner, AddSongToPlaylistModal, EditPlaylistModal, SongOptionsModal, AddToPlaylistModal } from "@/components/music";
import type { SongResponseWithAllAlbum } from "@/types/music";
import { loadAndPlaySong, setQueue } from "@/features/slices/playerSlice";
import { Colors } from "@/constants/Colors";
import { useShufflePlay } from "@/hooks/useShufflePlay";
import { usePlaylists } from "@/hooks/usePlaylists";
import { songApi } from "@/services/music";
import { deletePlaylist } from "@/features/slices/playlistSlice";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAlert } from "@/components/ui/AlertProvider";

export default function PlaylistDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const dispatch = useAppDispatch();
    const { mode } = useAppSelector((state) => state.theme);
    const isDark = mode === "dark";
    const { shuffleAndPlay } = useShufflePlay();
    const { getPlaylistDetail, playlistDetails, removeSong, addSong, update, playlists } = usePlaylists();
    const { showAlert } = useAlert();

    const [songs, setSongs] = useState<SongResponseWithAllAlbum[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [showAddSongModal, setShowAddSongModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showOptionsModal, setShowOptionsModal] = useState(false);
    const [showAddToPlaylistModal, setShowAddToPlaylistModal] = useState(false);
    const [selectedSong, setSelectedSong] = useState<SongResponseWithAllAlbum | null>(null);

    const scrollY = useRef(new Animated.Value(0)).current;

    // Animate header title visibility when scrolling
    const headerTitleOpacity = scrollY.interpolate({
        inputRange: [0, 200, 250],
        outputRange: [0, 0, 1],
        extrapolate: "clamp",
    });

    // Animate header background opacity
    const headerBackgroundOpacity = scrollY.interpolate({
        inputRange: [0, 150, 200],
        outputRange: [0, 0.5, 1],
        extrapolate: "clamp",
    });

    const playlistId = Number(id);
    const playlistDetail = playlistDetails[playlistId];

    // Load playlist detail
    useEffect(() => {
        if (!id) return;

        const loadPlaylistData = async () => {
            try {
                setLoading(true);
                await getPlaylistDetail(playlistId);
            } catch {
                // Error loading playlist
            } finally {
                setLoading(false);
            }
        };

        loadPlaylistData();
    }, [id, playlistId, getPlaylistDetail]);

    // Load songs when playlist detail is available
    const loadSongs = useCallback(async () => {
        if (!playlistDetail?.items) return;

        try {
            const songIds = playlistDetail.items.map((item) => item.songId);

            if (songIds.length === 0) {
                setSongs([]);
                return;
            }

            const songPromises = songIds.map((songId) =>
                songApi.getSongById(songId).catch(() => null)
            );

            const fetchedSongs = await Promise.all(songPromises);
            const validSongs = fetchedSongs.filter(
                (song: any): song is SongResponseWithAllAlbum => song !== null
            );

            setSongs(validSongs);
        } catch (error) {
            console.error("Failed to load songs:", error);
        }
    }, [playlistDetail]);

    useEffect(() => {
        loadSongs();
    }, [loadSongs]);

    // Filter songs with useMemo for better performance
    const filteredSongs = useMemo(() => {
        if (!searchQuery.trim()) return songs;

        const query = searchQuery.toLowerCase();
        return songs.filter(
            (song) =>
                song.title.toLowerCase().includes(query) ||
                song.mainArtist?.name.toLowerCase().includes(query)
        );
    }, [songs, searchQuery]);

    // Clear search handler
    const handleClearSearch = useCallback(() => {
        setSearchQuery("");
    }, []);

    const handleSongPress = useCallback(
        (song: SongResponseWithAllAlbum, index: number) => {
            dispatch(setQueue({ songs: filteredSongs, startIndex: index }));
            dispatch(loadAndPlaySong(song));
        },
        [dispatch, filteredSongs]
    );

    const handlePlayAll = useCallback(() => {
        if (filteredSongs.length === 0) return;
        dispatch(setQueue({ songs: filteredSongs, startIndex: 0 }));
        dispatch(loadAndPlaySong(filteredSongs[0]));
    }, [dispatch, filteredSongs]);

    const handleMorePress = (song: SongResponseWithAllAlbum) => {
        setSelectedSong(song);
        setShowOptionsModal(true);
    };

    const handleRemoveSong = async () => {
        if (!selectedSong) return;

        showAlert({
            type: "warning",
            title: "Xóa bài hát",
            message: `Xóa "${selectedSong.title}" khỏi playlist này?`,
            confirmText: "Xóa",
            cancelText: "Hủy",
            onConfirm: async () => {
                try {
                    await removeSong(playlistId, selectedSong.id);
                    await getPlaylistDetail(playlistId);
                    await loadSongs();
                } catch {
                    showAlert({
                        type: "error",
                        title: "Lỗi",
                        message: "Không thể xóa bài hát",
                    });
                }
            },
        });
    };

    const handleAddToOtherPlaylist = () => {
        setShowAddToPlaylistModal(true);
    };

    const handleAddSongToOtherPlaylist = async (targetPlaylistId: number) => {
        if (!selectedSong) return;

        try {
            await addSong(targetPlaylistId, selectedSong.id);
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

    const handleShare = () => {
        if (!selectedSong) return;
        showAlert({
            type: "info",
            title: "Chia sẻ",
            message: `Chia sẻ "${selectedSong.title}" đang phát triển!`,
        });
    };

    const handleGoToArtist = () => {
        if (!selectedSong?.mainArtist?.id) return;
        router.push(`/(app)/music/screens/ArtistDetail?id=${selectedSong.mainArtist.id}`);
    };

    const handleEdit = () => {
        setShowEditModal(true);
    };

    const handleSavePlaylistEdit = async (name: string, isPublic: boolean) => {
        try {
            await update(playlistId, { name, isPublic });
            await getPlaylistDetail(playlistId);
        } catch {
            throw new Error("Failed to update playlist");
        }
    };

    const handleDelete = () => {
        showAlert({
            type: "warning",
            title: "Xóa playlist",
            message: `Bạn có chắc muốn xóa "${playlistDetail?.name}"?`,
            confirmText: "Xóa",
            cancelText: "Hủy",
            onConfirm: async () => {
                try {
                    await dispatch(deletePlaylist(playlistId));
                    router.back();
                } catch {
                    showAlert({
                        type: "error",
                        title: "Lỗi",
                        message: "Không thể xóa playlist",
                    });
                }
            },
        });
    };

    const handleAddSong = () => {
        setShowAddSongModal(true);
    };

    const handleAddSongToPlaylist = async (songId: number) => {
        try {
            await addSong(playlistId, songId);
            await getPlaylistDetail(playlistId);
            await loadSongs();
        } catch {
            showAlert({
                type: "error",
                title: "Lỗi",
                message: "Không thể thêm bài hát vào playlist",
            });
        }
    };

    const handleSort = () => {
        showAlert({
            type: "info",
            title: "Sắp xếp",
            message: "Tính năng sắp xếp đang phát triển!",
        });
    };

    const handleDownload = () => {
        showAlert({
            type: "info",
            title: "Tải xuống",
            message: "Tính năng tải xuống đang phát triển!",
        });
    };

    const handleScroll = (event: any) => {
        const currentScrollY = event.nativeEvent.contentOffset.y;
        scrollY.setValue(currentScrollY);
    };

    return (
        <LinearGradient
            colors={
                isDark
                    ? [Colors.primary + "50", Colors.primary + "30", Colors.background.dark]
                    : [Colors.primary + "30", Colors.primary + "15", Colors.background.light]
            }
            className="flex-1"
        >
            <SafeAreaView className="flex-1">
                {/* Sticky Header Bar */}
                <Animated.View
                    className="flex-row items-center px-4 py-3"
                    style={[
                        {
                            backgroundColor: headerBackgroundOpacity.interpolate({
                                inputRange: [0, 1],
                                outputRange: isDark
                                    ? ['rgba(10, 10, 10, 0)', 'rgba(10, 10, 10, 1)']
                                    : ['rgba(30, 30, 30, 0)', 'rgba(30, 30, 30, 1)'],
                            }),
                            borderBottomWidth: 0,
                        },
                    ]}
                >
                    <View className="flex-row items-center flex-1">
                        {/* Back Button */}
                        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
                            <Ionicons name="arrow-back" size={28} color="white" />
                        </TouchableOpacity>

                        {/* Playlist Name - Shows when scrolled */}
                        <Animated.View
                            style={{ opacity: headerTitleOpacity }}
                            className="flex-1 items-center"
                        >
                            <Text
                                className="text-lg font-bold text-white"
                                numberOfLines={1}
                            >
                                {playlistDetail?.name || ""}
                            </Text>
                        </Animated.View>

                        {/* Spacer for symmetry */}
                        <View className="w-12" />
                    </View>
                </Animated.View>

                {loading || !playlistDetail ? (
                    <View className="flex-1 items-center justify-center">
                        <ActivityIndicator size="large" color={Colors.primary} />
                    </View>
                ) : (
                    <View className="flex-1" style={{ backgroundColor: 'transparent' }}>
                        {/* Show PlaylistBanner in ScrollView when: searching with no results OR playlist is empty */}
                        {(searchQuery && filteredSongs.length === 0) || (!searchQuery && filteredSongs.length === 0) ? (
                            <ScrollView style={{ flex: 1 }}>
                                <PlaylistBanner
                                    isDark={isDark}
                                    playlistName={playlistDetail.name}
                                    isPublic={playlistDetail.isPublic}
                                    songCount={playlistDetail.items?.length || 0}
                                    searchQuery={searchQuery}
                                    onSearchChange={setSearchQuery}
                                    onClearSearch={handleClearSearch}
                                    onShufflePlay={() => shuffleAndPlay(filteredSongs)}
                                    onPlayAll={handlePlayAll}
                                    onAddSong={handleAddSong}
                                    onSort={handleSort}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                    onShare={handleShare}
                                    onDownload={handleDownload}
                                />
                                <View className="px-4 py-8">
                                    <Text className="text-gray-400 text-center">
                                        {searchQuery ? "Không tìm thấy bài hát nào" : "This playlist is empty"}
                                    </Text>
                                </View>
                            </ScrollView>
                        ) : (
                            <SongList
                                songs={filteredSongs}
                                onSongPress={handleSongPress}
                                onMorePress={handleMorePress}
                                variant="list"
                                showAlbum={true}
                                onScroll={handleScroll}
                                scrollEventThrottle={16}
                                emptyMessage={searchQuery ? "" : "This playlist is empty"}
                                listHeaderComponent={
                                    <PlaylistBanner
                                        isDark={isDark}
                                        playlistName={playlistDetail.name}
                                        isPublic={playlistDetail.isPublic}
                                        songCount={filteredSongs.length}
                                        searchQuery={searchQuery}
                                        onSearchChange={setSearchQuery}
                                        onClearSearch={handleClearSearch}
                                        onShufflePlay={() => shuffleAndPlay(filteredSongs)}
                                        onPlayAll={handlePlayAll}
                                        onAddSong={handleAddSong}
                                        onSort={handleSort}
                                        onEdit={handleEdit}
                                        onDelete={handleDelete}
                                        onShare={handleShare}
                                        onDownload={handleDownload}
                                    />
                                }
                            />
                        )}
                    </View>
                )}

                {/* Add Song Modal */}
                <AddSongToPlaylistModal
                    visible={showAddSongModal}
                    isDark={isDark}
                    playlistId={playlistId}
                    existingSongIds={songs.map((song) => song.id)}
                    onClose={() => setShowAddSongModal(false)}
                    onAddSong={handleAddSongToPlaylist}
                />

                {/* Edit Playlist Modal */}
                {playlistDetail && (
                    <EditPlaylistModal
                        visible={showEditModal}
                        isDark={isDark}
                        playlistId={playlistId}
                        currentName={playlistDetail.name}
                        currentIsPublic={playlistDetail.isPublic}
                        onClose={() => setShowEditModal(false)}
                        onSave={handleSavePlaylistEdit}
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
                            id: "share",
                            label: "Chia sẻ",
                            icon: "share-outline",
                            action: handleShare,
                        },
                        {
                            id: "add-to-playlist",
                            label: "Thêm vào danh sách phát khác",
                            icon: "add-circle-outline",
                            action: handleAddToOtherPlaylist,
                        },
                        {
                            id: "remove",
                            label: "Xóa khỏi danh sách phát này",
                            icon: "trash-outline",
                            action: handleRemoveSong,
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
                        playlists={playlists.filter(p => p.id !== playlistId)}
                        onClose={() => setShowAddToPlaylistModal(false)}
                        onAddToPlaylist={handleAddSongToOtherPlaylist}
                    />
                )}
            </SafeAreaView>
        </LinearGradient>
    );
}