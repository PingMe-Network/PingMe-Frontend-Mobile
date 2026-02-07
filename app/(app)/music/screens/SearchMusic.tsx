import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppSelector, useAppDispatch } from "@/features/store";
import { useTabBarHeight } from "@/hooks/useTabBarHeight";
import { useState, useEffect, useRef, useCallback } from "react";
import { Ionicons } from "@expo/vector-icons";
import { searchService } from "@/services/music";
import type { SongResponseWithAllAlbum, AlbumResponse, ArtistResponse } from "@/types/music";
import { SongOptionsModal, AddToPlaylistModal } from "@/components/music";
import { SearchHeader, SearchSongItem, SearchArtistItem, SearchAlbumItem, GenreCard } from "@/components/music/search";
import { router } from "expo-router";
import { loadAndPlaySong, setQueue, setPlayerMinimized } from "@/features/slices/playerSlice";
import { useSongActions } from "@/hooks/useSongActions";
import { Colors } from "@/constants/Colors";

// Màu sắc cho các genre (giống Spotify)
const GENRE_COLORS = [
    ["#E13300", "#DC148C"],
    ["#777777", "#1E3264"],
    ["#8D67AB", "#BA5D07"],
    ["#056952", "#477D95"],
    ["#DC148C", "#E8115B"],
    ["#1E3264", "#509BF5"],
    ["#BA5D07", "#7D4313"],
    ["#477D95", "#1E3264"],
];

export default function SearchMusicScreen() {
    const { mode } = useAppSelector((state) => state.theme);
    const { allGenres } = useAppSelector((state) => state.music);
    const { currentSong, isPlayerMinimized } = useAppSelector((state) => state.player);
    const dispatch = useAppDispatch();
    const isDark = mode === "dark";
    const tabBarHeight = useTabBarHeight();
    const miniPlayerHeight = currentSong && isPlayerMinimized ? 76 : 0;

    const [searchQuery, setSearchQuery] = useState("");
    const [searching, setSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<{
        songs: SongResponseWithAllAlbum[];
        albums: AlbumResponse[];
        artists: ArtistResponse[];
    }>({ songs: [], albums: [], artists: [] });
    const [hasSearched, setHasSearched] = useState(false);
    const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Pagination state
    const [visibleCounts, setVisibleCounts] = useState({
        songs: 5,
        artists: 5,
        albums: 5,
    });
    const ITEMS_PER_PAGE = 10;

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

    const handleSearch = useCallback(async () => {
        if (!searchQuery.trim()) return;

        setSearching(true);
        setHasSearched(true);
        setVisibleCounts({ songs: 5, artists: 5, albums: 5 });

        try {
            const [songs, albums, artists] = await Promise.all([
                searchService.searchSongs(searchQuery),
                searchService.searchAlbums(searchQuery),
                searchService.searchArtists(searchQuery),
            ]);

            setSearchResults({ songs, albums, artists });
        } catch (error) {
            console.error("Search error:", error);
            setSearchResults({ songs: [], albums: [], artists: [] });
        } finally {
            setSearching(false);
        }
    }, [searchQuery]);

    // Auto search when user types (with debounce)
    useEffect(() => {
        // Clear previous timeout
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        // If search query is empty, reset results
        if (!searchQuery.trim()) {
            setSearchResults({ songs: [], albums: [], artists: [] });
            setHasSearched(false);
            setVisibleCounts({ songs: 5, artists: 5, albums: 5 });
            return;
        }

        // Set new timeout for search
        searchTimeoutRef.current = setTimeout(() => {
            handleSearch();
        }, 500); // Wait 500ms after user stops typing

        // Cleanup
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [searchQuery, handleSearch]);

    const handleGenrePress = (genreId: number, genreName: string) => {
        router.push({
            pathname: "/(app)/music/screens/GenreSongs",
            params: { id: genreId.toString(), name: genreName },
        });
    };

    const handleSongPress = (song: SongResponseWithAllAlbum, index: number) => {
        dispatch(setQueue({ songs: searchResults.songs, startIndex: index }));
        dispatch(loadAndPlaySong(song));
        dispatch(setPlayerMinimized(true));
    };

    const handleAlbumPress = (albumId: number) => {
        router.push({
            pathname: "/(app)/music/screens/AlbumDetail",
            params: { id: albumId.toString() },
        });
    };

    const handleArtistPress = (artistId: number) => {
        router.push({
            pathname: "/(app)/music/screens/ArtistDetail",
            params: { id: artistId.toString() },
        });
    };

    const clearSearch = () => {
        setSearchQuery("");
        setSearchResults({ songs: [], albums: [], artists: [] });
        setHasSearched(false);
        setVisibleCounts({ songs: 5, artists: 5, albums: 5 });
    };

    const loadMoreSongs = () => {
        setVisibleCounts(prev => ({ ...prev, songs: prev.songs + ITEMS_PER_PAGE }));
    };

    const loadMoreArtists = () => {
        setVisibleCounts(prev => ({ ...prev, artists: prev.artists + ITEMS_PER_PAGE }));
    };

    const loadMoreAlbums = () => {
        setVisibleCounts(prev => ({ ...prev, albums: prev.albums + ITEMS_PER_PAGE }));
    };

    const hasResults = searchResults.songs.length > 0 ||
        searchResults.albums.length > 0 ||
        searchResults.artists.length > 0;

    return (
        <SafeAreaView
            className={`flex-1 ${isDark ? "bg-background-dark" : "bg-background-light"}`}
        >
            {/* Header */}
            <SearchHeader
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onClear={clearSearch}
                isDark={isDark}
            />

            <ScrollView
                contentContainerStyle={{ flexGrow: 1, paddingBottom: tabBarHeight + miniPlayerHeight + 20 }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Loading */}
                {searching && (
                    <View className="items-center justify-center py-8">
                        <ActivityIndicator size="large" color={Colors.primary} />
                        <Text className={`mt-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                            Đang tìm kiếm...
                        </Text>
                    </View>
                )}

                {/* Search Results */}
                {!searching && hasSearched && (
                    <>
                        {hasResults ? (
                            <View className="px-4">
                                {/* Songs Section */}
                                {searchResults.songs.length > 0 && (
                                    <View className="mb-6">
                                        <Text className={`text-lg font-bold mb-3 ${isDark ? "text-white" : "text-gray-900"}`}>
                                            Bài hát ({searchResults.songs.length})
                                        </Text>
                                        {searchResults.songs.slice(0, visibleCounts.songs).map((song, index) => (
                                            <SearchSongItem
                                                key={`song-${song.id}`}
                                                song={song}
                                                onPress={() => handleSongPress(song, index)}
                                                onMorePress={() => handleMorePress(song)}
                                                isDark={isDark}
                                            />
                                        ))}
                                        {searchResults.songs.length > visibleCounts.songs && (
                                            <TouchableOpacity
                                                onPress={loadMoreSongs}
                                                className="py-3 items-center"
                                            >
                                                <Text className={`text-base font-semibold ${isDark ? "text-primary" : "text-primary"}`}>
                                                    Xem thêm {Math.min(ITEMS_PER_PAGE, searchResults.songs.length - visibleCounts.songs)} bài hát
                                                </Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                )}

                                {/* Artists Section */}
                                {searchResults.artists.length > 0 && (
                                    <View className="mb-6">
                                        <Text className={`text-lg font-bold mb-3 ${isDark ? "text-white" : "text-gray-900"}`}>
                                            Nghệ sĩ ({searchResults.artists.length})
                                        </Text>
                                        {searchResults.artists.slice(0, visibleCounts.artists).map((artist) => (
                                            <SearchArtistItem
                                                key={`artist-${artist.id}`}
                                                artist={artist}
                                                onPress={() => handleArtistPress(artist.id)}
                                                isDark={isDark}
                                            />
                                        ))}
                                        {searchResults.artists.length > visibleCounts.artists && (
                                            <TouchableOpacity
                                                onPress={loadMoreArtists}
                                                className="py-3 items-center"
                                            >
                                                <Text className={`text-base font-semibold ${isDark ? "text-primary" : "text-primary"}`}>
                                                    Xem thêm {Math.min(ITEMS_PER_PAGE, searchResults.artists.length - visibleCounts.artists)} nghệ sĩ
                                                </Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                )}

                                {/* Albums Section */}
                                {searchResults.albums.length > 0 && (
                                    <View className="mb-6">
                                        <Text className={`text-lg font-bold mb-3 ${isDark ? "text-white" : "text-gray-900"}`}>
                                            Album ({searchResults.albums.length})
                                        </Text>
                                        {searchResults.albums.slice(0, visibleCounts.albums).map((album) => (
                                            <SearchAlbumItem
                                                key={`album-${album.id}`}
                                                album={album}
                                                onPress={() => handleAlbumPress(album.id)}
                                                isDark={isDark}
                                            />
                                        ))}
                                        {searchResults.albums.length > visibleCounts.albums && (
                                            <TouchableOpacity
                                                onPress={loadMoreAlbums}
                                                className="py-3 items-center"
                                            >
                                                <Text className={`text-base font-semibold ${isDark ? "text-primary" : "text-primary"}`}>
                                                    Xem thêm {Math.min(ITEMS_PER_PAGE, searchResults.albums.length - visibleCounts.albums)} album
                                                </Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                )}
                            </View>
                        ) : (
                            <View className="items-center justify-center py-8 px-4">
                                <Ionicons
                                    name="search-outline"
                                    size={64}
                                    color={isDark ? "#4B5563" : "#9CA3AF"}
                                />
                                <Text
                                    className={`text-lg font-semibold mt-4 ${isDark ? "text-white" : "text-gray-900"}`}
                                >
                                    Không tìm thấy kết quả
                                </Text>
                                <Text className={`text-center mt-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                                    Hãy thử với từ khóa khác
                                </Text>
                            </View>
                        )}
                    </>
                )}

                {/* Browse All - Genres Grid */}
                {!hasSearched && (
                    <View className="px-4">
                        <Text
                            className={`text-xl font-bold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}
                        >
                            Duyệt tất cả
                        </Text>

                        <View className="flex-row flex-wrap gap-3">
                            {allGenres.map((genre, index) => {
                                const colorIndex = index % GENRE_COLORS.length;
                                const colors = GENRE_COLORS[colorIndex] as [string, string];

                                return (
                                    <GenreCard
                                        key={genre.id}
                                        genreId={genre.id}
                                        genreName={genre.name}
                                        colors={colors}
                                        onPress={handleGenrePress}
                                    />
                                );
                            })}
                        </View>
                    </View>
                )}
            </ScrollView>

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
