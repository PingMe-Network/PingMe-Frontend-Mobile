import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppSelector, useAppDispatch } from "@/features/store";
import { useTabBarHeight } from "@/hooks/useTabBarHeight";
import { useEffect, useState } from "react";
import { fetchMusicData } from "@/features/slices/musicSlice";
import { Ionicons } from "@expo/vector-icons";
import { loadAndPlaySong, setQueue, setPlayerMinimized } from "@/features/slices/playerSlice";
import { useRouter } from "expo-router";
import { HomeMusic } from "./screens/HomeMusic";

export default function MusicScreen() {
  const dispatch = useAppDispatch();
  const router = useRouter();
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

  const filters: { key: string; label: string; route?: string }[] = [
    { key: "all", label: "Tất cả" },
    { key: "playlist", label: "Playlist", route: "/(app)/music/screens/Playlists" },
    { key: "favorite", label: "Yêu thích", route: "/(app)/music/screens/Favorites" },
  ];

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
            <View className="flex-row items-center justify-between">
              <Text
                className={`text-2xl font-bold ${isDark ? "text-white" : "text-midnight-velvet"
                  }`}
              >
                Ping Music
              </Text>

              <TouchableOpacity
                className={`h-10 w-10 items-center justify-center rounded-full ${isDark ? "bg-gray-800" : "bg-gray-200"
                  }`}
              >
                <Ionicons
                  name="search"
                  size={20}
                  color={isDark ? "#ffffff" : "#111827"}
                />
              </TouchableOpacity>
            </View>

            <View className="mt-4 flex-row items-center">
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingRight: 12 }}
              >
                <View className="flex-row gap-2">
                  {filters.map((filter) => {
                    const isAll = filter.key === "all";

                    // Extract pill background color logic
                    const getPillBgColor = () => {
                      if (isAll) return "bg-primary";
                      return isDark ? "bg-gray-800" : "bg-gray-200";
                    };

                    // Extract text color and style logic
                    const getTextClass = () => {
                      if (isAll) return "text-white font-semibold";
                      return isDark ? "text-white" : "text-gray-900";
                    };

                    const pillClass = getPillBgColor();
                    const textClass = getTextClass();

                    return (
                      <TouchableOpacity
                        key={filter.key}
                        onPress={() => {
                          if (filter.route) {
                            router.push(filter.route as any);
                          }
                        }}
                        className={`px-4 py-2 rounded-full ${pillClass}`}
                      >
                        <Text className={textClass}>
                          {filter.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            </View>
          </View>

          <HomeMusic
            isDark={isDark}
            activeFilter="all"
            topSongs={topSongs}
            favoriteSongs={topSongs}
            userPlaylists={[]}
            playlistsLoading={false}
            popularAlbums={popularAlbums}
            popularArtists={popularArtists}
            allGenres={allGenres}
            onSongPress={handleSongPress}
          />

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

    </View>
  );
}
