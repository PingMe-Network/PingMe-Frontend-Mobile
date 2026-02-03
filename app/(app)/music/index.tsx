import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppSelector, useAppDispatch } from "@/features/store";
import { useTabBarHeight } from "@/hooks/useTabBarHeight";
import { useEffect, useState } from "react";
import { fetchMusicData } from "@/features/slices/musicSlice";
import { SongCard, AlbumCard, ArtistCard, MiniPlayer, FullPlayer } from "@/components/music";
import { Ionicons } from "@expo/vector-icons";
import { loadAndPlaySong, setQueue, setPlayerMinimized } from "@/features/slices/playerSlice";

export default function MusicScreen() {
  const dispatch = useAppDispatch();
  const { mode } = useAppSelector((state) => state.theme);
  const isDark = mode === "dark";
  const tabBarHeight = useTabBarHeight();

  const { topSongs, popularAlbums, popularArtists, allGenres, loading } =
    useAppSelector((state) => state.music);

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (topSongs.length === 0) {
      dispatch(fetchMusicData(10));
    }
  }, [dispatch, topSongs.length]);

  const onRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchMusicData(10));
    setRefreshing(false);
  };

  const handleSongPress = (song: any, index: number) => {
    dispatch(setQueue({ songs: topSongs, startIndex: index }));
    dispatch(loadAndPlaySong(song));
    dispatch(setPlayerMinimized(true)); // Show MiniPlayer
  };

  return (
    <View style={{ flex: 1 }}>
      <SafeAreaView
        className={`flex-1 ${isDark ? "bg-background-dark" : "bg-background-light"}`}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingBottom: tabBarHeight + 80 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Header */}
          <View className="px-6 pt-4 pb-2">
            <Text
              className={`text-3xl font-bold ${isDark ? "text-white" : "text-midnight-velvet"
                }`}
            >
              Music
            </Text>
          </View>

          {/* Top Songs Section */}
          <View className="mt-4">
            <View className="flex-row items-center justify-between px-6 mb-3">
              <Text
                className={`text-xl font-bold ${isDark ? "text-white" : "text-gray-900"
                  }`}
              >
                Top Songs
              </Text>
              <TouchableOpacity>
                <Text className="text-primary font-semibold">See All</Text>
              </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row px-6 gap-4">
                {topSongs.slice(0, 5).map((song, index) => (
                  <View key={song.id} style={{ width: 180 }}>
                    <SongCard
                      song={song}
                      onPress={() => handleSongPress(song, index)}
                      variant="default"
                    />
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Popular Albums Section */}
          {popularAlbums.length > 0 && (
            <View className="mt-6">
              <View className="flex-row items-center justify-between px-6 mb-3">
                <Text
                  className={`text-xl font-bold ${isDark ? "text-white" : "text-gray-900"
                    }`}
                >
                  Popular Albums
                </Text>
                <TouchableOpacity>
                  <Text className="text-primary font-semibold">See All</Text>
                </TouchableOpacity>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row px-6 gap-4">
                  {popularAlbums.slice(0, 5).map((album) => (
                    <View key={album.id} style={{ width: 160 }}>
                      <AlbumCard
                        album={album}
                        variant="compact"
                      />
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          {/* Popular Artists Section */}
          {popularArtists.length > 0 && (
            <View className="mt-6">
              <View className="flex-row items-center justify-between px-6 mb-3">
                <Text
                  className={`text-xl font-bold ${isDark ? "text-white" : "text-gray-900"
                    }`}
                >
                  Popular Artists
                </Text>
                <TouchableOpacity>
                  <Text className="text-primary font-semibold">See All</Text>
                </TouchableOpacity>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row px-6 gap-4">
                  {popularArtists.slice(0, 5).map((artist) => (
                    <View key={artist.id} style={{ width: 140 }}>
                      <ArtistCard
                        artist={artist}
                        variant="compact"
                      />
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          {/* Genres Section */}
          {allGenres.length > 0 && (
            <View className="mt-6 px-6">
              <Text
                className={`text-xl font-bold mb-3 ${isDark ? "text-white" : "text-gray-900"
                  }`}
              >
                Browse by Genre
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {allGenres.map((genre) => (
                  <TouchableOpacity
                    key={genre.id}
                    className={`px-4 py-2 rounded-full ${isDark ? "bg-gray-800" : "bg-gray-200"
                      }`}
                  >
                    <Text
                      className={isDark ? "text-white" : "text-gray-900"}
                    >
                      {genre.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Empty State */}
          {!loading && topSongs.length === 0 && (
            <View className="flex-1 items-center justify-center p-8">
              <Ionicons
                name="musical-notes-outline"
                size={64}
                color="#9ca3af"
              />
              <Text
                className={`text-xl font-bold mt-4 ${isDark ? "text-white" : "text-midnight-velvet"
                  }`}
              >
                No Music Available
              </Text>
              <Text className="text-center text-gray-400 mt-2">
                Check back later for new music
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* MiniPlayer - positioned above TabBar */}
      <View style={{ position: 'absolute', bottom: tabBarHeight, left: 0, right: 0 }}>
        <MiniPlayer />
      </View>

      {/* FullPlayer Modal - can be opened from MiniPlayer */}
      <FullPlayer />
    </View>
  );
}
