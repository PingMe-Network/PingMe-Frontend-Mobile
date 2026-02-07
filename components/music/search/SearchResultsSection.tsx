import { View, Text } from "react-native";
import { SearchSongItem } from "./SearchSongItem";
import { SearchArtistItem } from "./SearchArtistItem";
import { SearchAlbumItem } from "./SearchAlbumItem";
import { LoadMoreButton } from "./LoadMoreButton";
import type { SongResponseWithAllAlbum, AlbumResponse, ArtistResponse } from "@/types/music";

interface SearchResultsSectionProps {
    songs: SongResponseWithAllAlbum[];
    artists: ArtistResponse[];
    albums: AlbumResponse[];
    visibleCounts: {
        songs: number;
        artists: number;
        albums: number;
    };
    itemsPerPage: number;
    isDark: boolean;
    onSongPress: (song: SongResponseWithAllAlbum, index: number) => void;
    onMorePress: (song: SongResponseWithAllAlbum) => void;
    onArtistPress: (artistId: number) => void;
    onAlbumPress: (albumId: number) => void;
    onLoadMoreSongs: () => void;
    onLoadMoreArtists: () => void;
    onLoadMoreAlbums: () => void;
}

export function SearchResultsSection({
    songs,
    artists,
    albums,
    visibleCounts,
    itemsPerPage,
    isDark,
    onSongPress,
    onMorePress,
    onArtistPress,
    onAlbumPress,
    onLoadMoreSongs,
    onLoadMoreArtists,
    onLoadMoreAlbums,
}: Readonly<SearchResultsSectionProps>) {
    return (
        <View className="px-4">
            {/* Songs Section */}
            {songs.length > 0 && (
                <View className="mb-6">
                    <Text className={`text-lg font-bold mb-3 ${isDark ? "text-white" : "text-gray-900"}`}>
                        Bài hát ({songs.length})
                    </Text>
                    {songs.slice(0, visibleCounts.songs).map((song, index) => (
                        <SearchSongItem
                            key={`song-${song.id}`}
                            song={song}
                            onPress={() => onSongPress(song, index)}
                            onMorePress={() => onMorePress(song)}
                            isDark={isDark}
                        />
                    ))}
                    {songs.length > visibleCounts.songs && (
                        <LoadMoreButton
                            onPress={onLoadMoreSongs}
                            remainingCount={songs.length - visibleCounts.songs}
                            itemsPerPage={itemsPerPage}
                            label="bài hát"
                        />
                    )}
                </View>
            )}

            {/* Artists Section */}
            {artists.length > 0 && (
                <View className="mb-6">
                    <Text className={`text-lg font-bold mb-3 ${isDark ? "text-white" : "text-gray-900"}`}>
                        Nghệ sĩ ({artists.length})
                    </Text>
                    {artists.slice(0, visibleCounts.artists).map((artist) => (
                        <SearchArtistItem
                            key={`artist-${artist.id}`}
                            artist={artist}
                            onPress={() => onArtistPress(artist.id)}
                            isDark={isDark}
                        />
                    ))}
                    {artists.length > visibleCounts.artists && (
                        <LoadMoreButton
                            onPress={onLoadMoreArtists}
                            remainingCount={artists.length - visibleCounts.artists}
                            itemsPerPage={itemsPerPage}
                            label="nghệ sĩ"
                        />
                    )}
                </View>
            )}

            {/* Albums Section */}
            {albums.length > 0 && (
                <View className="mb-6">
                    <Text className={`text-lg font-bold mb-3 ${isDark ? "text-white" : "text-gray-900"}`}>
                        Album ({albums.length})
                    </Text>
                    {albums.slice(0, visibleCounts.albums).map((album) => (
                        <SearchAlbumItem
                            key={`album-${album.id}`}
                            album={album}
                            onPress={() => onAlbumPress(album.id)}
                            isDark={isDark}
                        />
                    ))}
                    {albums.length > visibleCounts.albums && (
                        <LoadMoreButton
                            onPress={onLoadMoreAlbums}
                            remainingCount={albums.length - visibleCounts.albums}
                            itemsPerPage={itemsPerPage}
                            label="album"
                        />
                    )}
                </View>
            )}
        </View>
    );
}
