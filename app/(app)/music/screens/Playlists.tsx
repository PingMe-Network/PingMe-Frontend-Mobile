import { useState, useMemo } from "react";
import { View, Text, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppSelector } from "@/features/store";
import { usePlaylists } from "@/hooks/usePlaylists";
import { usePlaylistCovers } from "@/hooks/usePlaylistCovers";
import { PlaylistCard, PlaylistsHeader, CreatePlaylistModal } from "@/components/music";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTabBarHeight } from "@/hooks/useTabBarHeight";
import { useAlert } from "@/components/ui/AlertProvider";

export default function PlaylistsScreen() {
    const { mode } = useAppSelector((state) => state.theme);
    const isDark = mode === "dark";
    const { playlists, create, deletePlaylistById } = usePlaylists();
    const { showAlert } = useAlert();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const tabBarHeight = useTabBarHeight();

    // ✨ Load cover images cho tất cả playlists
    const playlistIds = useMemo(() => playlists.map(p => p.id), [playlists]);
    const { coverImagesMap } = usePlaylistCovers(playlistIds);

    const handleCreatePlaylist = async (playlistName: string) => {
        // Default is private (isPublic = false)
        await create(playlistName, false);
        setShowCreateModal(false);
    };

    const handleOpenCreateModal = () => {
        setShowCreateModal(true);
    };

    const handleDeletePlaylist = (playlistId: number, playlistName: string) => {
        showAlert({
            type: "warning",
            title: "Xóa playlist",
            message: `Bạn có chắc chắn muốn xóa playlist "${playlistName}"? Hành động này không thể hoàn tác.`,
            confirmText: "Xóa",
            cancelText: "Hủy",
            onConfirm: async () => {
                try {
                    await deletePlaylistById(playlistId);
                } catch {
                    showAlert({
                        type: "error",
                        title: "Lỗi",
                        message: "Không thể xóa playlist. Vui lòng thử lại.",
                    });
                }
            },
        });
    };

    return (
        <SafeAreaView
            className={`flex-1 ${isDark ? "bg-background-dark" : "bg-background-light"}`}
        >
            {/* Header */}
            <PlaylistsHeader
                isDark={isDark}
                playlistCount={playlists.length}
                onCreatePress={handleOpenCreateModal}
                onBackPress={() => router.back()}
            />

            {/* Create Playlist Modal */}
            <CreatePlaylistModal
                visible={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onCreate={handleCreatePlaylist}
                isDark={isDark}
                existingPlaylistCount={playlists.length}
            />

            <FlatList
                data={playlists}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={{ paddingBottom: tabBarHeight + 80 }}
                renderItem={({ item }) => (
                    <View className="px-4 mb-3">
                        <PlaylistCard
                            playlist={item}
                            variant="compact"
                            coverImages={coverImagesMap[item.id] || []}
                            onPress={() => {
                                router.push(`/(app)/music/screens/PlaylistDetail?id=${item.id}`);
                            }}
                            onMorePress={() => {
                                handleDeletePlaylist(item.id, item.name);
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
                            Không có playlist nào
                        </Text>
                        <Text className="text-center text-gray-400 mt-2">
                            Tạo playlist đầu tiên của bạn để bắt đầu
                        </Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}
