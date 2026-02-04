import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppSelector } from "@/features/store";
import { router } from "expo-router";
import { usePlaylists } from "@/hooks/usePlaylists";
import { PlaylistCard } from "@/components/music";
import { Ionicons } from "@expo/vector-icons";

export default function PlaylistsScreen() {
    const { mode } = useAppSelector((state) => state.theme);
    const isDark = mode === "dark";
    const { playlists, create } = usePlaylists();

    const handleCreatePlaylist = async () => {
        // TODO: Show modal for creating playlist
        await create("New Playlist", false);
    };

    return (
        <SafeAreaView
            className={`flex-1 ${isDark ? "bg-background-dark" : "bg-background-light"}`}
        >
            {/* Header */}
            <View className="flex-row items-center justify-between px-4 py-2 mb-4">
                <View className="flex-row items-center gap-2">
                    <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
                        <Ionicons
                            name="chevron-back"
                            size={24}
                            color={isDark ? "white" : "#1f2937"}
                        />
                    </TouchableOpacity>
                    <Text
                        className={`text-lg font-bold ${isDark ? "text-white" : "text-gray-900"
                            }`}
                    >
                        My Playlists
                    </Text>
                </View>
                <TouchableOpacity onPress={handleCreatePlaylist} className="p-2 -mr-2">
                    <Ionicons
                        name="add-circle"
                        size={28}
                        color="#3b82f6"
                    />
                </TouchableOpacity>
            </View>

            <FlatList
                data={playlists}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <View className="px-4 mb-3">
                        <PlaylistCard
                            playlist={item}
                            variant="compact"
                            onPress={() => {
                                // TODO: Navigate to playlist detail
                            }}
                        />
                    </View>
                )}
                ListEmptyComponent={
                    <View className="flex-1 items-center justify-center p-8 mt-20">
                        <Ionicons name="musical-notes-outline" size={64} color="#9ca3af" />
                        <Text
                            className={`text-xl font-bold mt-4 ${isDark ? "text-white" : "text-gray-900"
                                }`}
                        >
                            No Playlists Yet
                        </Text>
                        <Text className="text-center text-gray-400 mt-2">
                            Create your first playlist to get started
                        </Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}
