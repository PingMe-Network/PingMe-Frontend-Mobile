import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import type {
    AlbumResponse,
    ArtistResponse,
    SongResponseWithAllAlbum,
} from "@/types/music";
import type { PlaylistDto } from "@/types/music/playlist";
import { SongCard, AlbumCard, ArtistCard, PlaylistCard, RankingCard } from "@/components/music";
import { useRanking } from "@/hooks/useRanking";
import { useAppDispatch } from "@/features/store";
import { loadAndPlaySong, setQueue } from "@/features/slices/playerSlice";
import { normalizeTopSong } from "@/utils/musicNormalization";
import type { TopSongPlayCounter } from "@/types/music";

export type HomeMusicFilter = "all" | "playlist" | "favorite";

interface HomeMusicProps {
    isDark: boolean;
    activeFilter: HomeMusicFilter;
    topSongs: SongResponseWithAllAlbum[];
    favoriteSongs: SongResponseWithAllAlbum[];
    userPlaylists: PlaylistDto[];
    playlistsLoading: boolean;
    popularAlbums: AlbumResponse[];
    popularArtists: ArtistResponse[];
    onSongPress: (song: SongResponseWithAllAlbum, index: number) => void;
}

export function HomeMusic({
    isDark,
    activeFilter,
    topSongs,
    favoriteSongs,
    userPlaylists,
    playlistsLoading,
    popularAlbums,
    popularArtists,
    onSongPress,
}: Readonly<HomeMusicProps>) {
    const router = useRouter();
    const dispatch = useAppDispatch();

    const handleRankingSongPress = (item: TopSongPlayCounter | SongResponseWithAllAlbum, list: (TopSongPlayCounter | SongResponseWithAllAlbum)[]) => {
        const normalizedSong = normalizeTopSong(item);
        const normalizedList = list.map(normalizeTopSong);
        const index = normalizedList.findIndex(s => s.id === normalizedSong.id);

        dispatch(setQueue({ songs: normalizedList, startIndex: index >= 0 ? index : 0 }));
        dispatch(loadAndPlaySong(normalizedSong));
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

    const handleViewAllFavorites = () => {
        router.push("/(app)/music/screens/Favorites");
    };

    const handleViewAllPlaylists = () => {
        router.push("/(app)/music/screens/Playlists");
    };

    const { topSongToday, topSongWeekly, topSongMonthly } = useRanking();

    const handleRankingPress = (type: "today" | "week" | "month", title: string) => {
        router.push({
            pathname: "/(app)/music/screens/RankingDetail" as any,
            params: { type, title },
        });
    };

    return (
        <>
            {(activeFilter === "all" || activeFilter === "favorite") && (
                <View className="mt-4">
                    <View className="flex-row items-center justify-between px-4 mb-3">
                        <Text
                            className={`text-xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}
                        >
                            {activeFilter === "favorite" ? "Yêu thích" : "Top Songs"}
                        </Text>
                        <TouchableOpacity onPress={activeFilter === "favorite" ? handleViewAllFavorites : undefined}>
                            <Text className="text-primary font-semibold">See All</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View className="flex-row px-4 gap-4">
                            {(activeFilter === "favorite" ? favoriteSongs : topSongs)
                                .slice(0, 5)
                                .map((song, index) => (
                                    <View key={song.id} style={{ width: 180 }}>
                                        <SongCard
                                            song={song}
                                            onPress={() => onSongPress(song, index)}
                                            variant="default"
                                        />
                                    </View>
                                ))}
                        </View>
                    </ScrollView>
                </View>
            )}

            {/* Ranking Section */}
            {activeFilter === "all" && (
                <View className="mt-6">
                    <View className="flex-row items-center justify-between px-4 mb-3">
                        <Text
                            className={`text-xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}
                        >
                            Bảng Xếp Hạng
                        </Text>
                    </View>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: 16, paddingRight: 16 }}>
                        <RankingCard
                            title="BXH Hôm Nay"
                            data={topSongToday}
                            onPress={() => handleRankingPress("today", "BXH Hôm Nay")}
                            onPlayPress={() => { }}
                            onSongPress={(item) => handleRankingSongPress(item, topSongToday)}
                        />
                        <RankingCard
                            title="BXH Tuần Này"
                            data={topSongWeekly}
                            onPress={() => handleRankingPress("week", "BXH Tuần Này")}
                            onPlayPress={() => { }}
                            onSongPress={(item) => handleRankingSongPress(item, topSongWeekly)}
                        />
                        <RankingCard
                            title="BXH Tháng Này"
                            data={topSongMonthly}
                            onPress={() => handleRankingPress("month", "BXH Tháng Này")}
                            onPlayPress={() => { }}
                            onSongPress={(item) => handleRankingSongPress(item, topSongMonthly)}
                        />
                    </ScrollView>
                </View>
            )}

            {activeFilter === "playlist" && (
                <View className="mt-4">
                    <View className="flex-row items-center justify-between px-4 mb-3">
                        <Text
                            className={`text-xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}
                        >
                            Playlist của bạn
                        </Text>
                        <TouchableOpacity onPress={handleViewAllPlaylists}>
                            <Text className="text-primary font-semibold">See All</Text>
                        </TouchableOpacity>
                    </View>

                    {userPlaylists.length === 0 && !playlistsLoading ? (
                        <View className="px-4 py-6">
                            <Text className={isDark ? "text-gray-300" : "text-gray-500"}>
                                Chưa có playlist nào.
                            </Text>
                        </View>
                    ) : (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <View className="flex-row px-4 gap-4">
                                {userPlaylists.slice(0, 6).map((playlist) => (
                                    <View key={playlist.id} style={{ width: 180 }}>
                                        <PlaylistCard playlist={playlist} />
                                    </View>
                                ))}
                            </View>
                        </ScrollView>
                    )}
                </View>
            )}

            {activeFilter === "all" && popularAlbums.length > 0 && (
                <View className="mt-6">
                    <View className="flex-row items-center justify-between px-4 mb-3">
                        <Text
                            className={`text-xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}
                        >
                            Popular Albums
                        </Text>
                        <TouchableOpacity>
                            <Text className="text-primary font-semibold">See All</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View className="flex-row px-4 gap-4">
                            {popularAlbums.slice(0, 5).map((album) => (
                                <View key={album.id} style={{ width: 160 }}>
                                    <AlbumCard
                                        album={album}
                                        variant="compact"
                                        onPress={() => handleAlbumPress(album.id)}
                                    />
                                </View>
                            ))}
                        </View>
                    </ScrollView>
                </View>
            )}

            {activeFilter === "all" && popularArtists.length > 0 && (
                <View className="mt-6">
                    <View className="flex-row items-center justify-between px-4 mb-3">
                        <Text
                            className={`text-xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}
                        >
                            Popular Artists
                        </Text>
                        <TouchableOpacity>
                            <Text className="text-primary font-semibold">See All</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View className="flex-row px-4 gap-4">
                            {popularArtists.slice(0, 5).map((artist) => (
                                <View key={artist.id} style={{ width: 140 }}>
                                    <ArtistCard
                                        artist={artist}
                                        variant="compact"
                                        onPress={() => handleArtistPress(artist.id)}
                                    />
                                </View>
                            ))}
                        </View>
                    </ScrollView>
                </View>
            )}
        </>
    );
}

export default HomeMusic;
