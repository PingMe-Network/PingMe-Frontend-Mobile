import { View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppSelector, useAppDispatch } from "@/features/store";
import { useTabBarHeight } from "@/hooks/useTabBarHeight";
import { useState, useEffect, useRef, useCallback } from "react";
import { searchService } from "@/services/music";
import type { SongResponseWithAllAlbum, AlbumResponse, ArtistResponse } from "@/types/music";
import { useSongModals } from "@/components/music";
import {
    SearchHeader,
    GenreCard,
    SearchResultsSection,
    SearchEmptyState,
    SearchLoading
} from "@/components/music/search";
import { router } from "expo-router";
import { loadAndPlaySong, setQueue, setPlayerMinimized } from "@/features/slices/playerSlice";

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
    const { handleMorePress, modalsJSX } = useSongModals({ isDark });

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
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        if (!searchQuery.trim()) {
            setSearchResults({ songs: [], albums: [], artists: [] });
            setHasSearched(false);
            setVisibleCounts({ songs: 5, artists: 5, albums: 5 });
            return;
        }

        searchTimeoutRef.current = setTimeout(() => {
            handleSearch();
        }, 500);

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
                {searching && <SearchLoading isDark={isDark} />}

                {!searching && hasSearched && (
                    hasResults ? (
                        <SearchResultsSection
                            songs={searchResults.songs}
                            artists={searchResults.artists}
                            albums={searchResults.albums}
                            visibleCounts={visibleCounts}
                            itemsPerPage={ITEMS_PER_PAGE}
                            isDark={isDark}
                            onSongPress={handleSongPress}
                            onMorePress={handleMorePress}
                            onArtistPress={handleArtistPress}
                            onAlbumPress={handleAlbumPress}
                            onLoadMoreSongs={loadMoreSongs}
                            onLoadMoreArtists={loadMoreArtists}
                            onLoadMoreAlbums={loadMoreAlbums}
                        />
                    ) : (
                        <SearchEmptyState isDark={isDark} />
                    )
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

            {modalsJSX}
        </SafeAreaView>
    );
}
