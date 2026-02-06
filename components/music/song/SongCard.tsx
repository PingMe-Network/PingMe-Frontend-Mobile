import { View, Text, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { SongResponseWithAllAlbum } from "@/types/music";
import { useAppSelector, useAppDispatch } from "@/features/store";
import { toggleFavorite } from "@/features/slices/favoriteSlice";

interface SongCardProps {
    song: SongResponseWithAllAlbum;
    onPress?: () => void;
    onMorePress?: () => void;
    showAlbum?: boolean;
    showArtist?: boolean;
    variant?: "default" | "compact" | "list";
}

const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const FavoriteButton = ({ isFavorite, onToggle, variant = "default" }: { isFavorite: boolean; onToggle: () => void; variant?: "default" | "compact" }) => {
    let heartColor: string;
    if (isFavorite) {
        heartColor = "#ef4444";
    } else if (variant === "default") {
        heartColor = "white";
    } else {
        heartColor = "#9ca3af";
    }

    return (
        <TouchableOpacity
            onPress={onToggle}
            className={variant === "default" ? "bg-black/50 p-2 rounded-full" : "p-1"}
        >
            <Ionicons
                name={isFavorite ? "heart" : "heart-outline"}
                size={20}
                color={heartColor}
            />
        </TouchableOpacity>
    );
};

const SongInfo = ({ song, showArtist, isDark }: { song: SongResponseWithAllAlbum; showArtist: boolean; isDark: boolean }) => (
    <View className="flex-1 ml-3">
        <Text
            className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}
            numberOfLines={1}
        >
            {song.title}
        </Text>
        {showArtist && song.mainArtist && (
            <Text className="text-sm text-gray-400" numberOfLines={1}>
                {song.mainArtist.name}
            </Text>
        )}
    </View>
);

export const SongCard = ({
    song,
    onPress,
    onMorePress,
    showAlbum = true,
    showArtist = true,
    variant = "default",
}: SongCardProps) => {
    const dispatch = useAppDispatch();
    const { mode } = useAppSelector((state) => state.theme);
    const isDark = mode === "dark";
    const favoriteSongIds = useAppSelector((state) => state.favorite?.favoriteSongIds || []);
    const isFavorite = Array.isArray(favoriteSongIds)
        ? favoriteSongIds.includes(song.id)
        : false;

    const handleFavoriteToggle = () => dispatch(toggleFavorite(song.id));

    if (variant === "compact") {
        return (
            <TouchableOpacity
                onPress={onPress}
                className={`flex-row items-center p-3 rounded-lg ${isDark ? "bg-gray-800/50" : "bg-gray-100"
                    }`}
                activeOpacity={0.7}
            >
                <Image
                    source={{ uri: song.coverImageUrl || "https://via.placeholder.com/50" }}
                    className="w-12 h-12 rounded-md"
                />
                <SongInfo song={song} showArtist={showArtist} isDark={isDark} />
                <Text className="text-xs text-gray-400 mr-2">
                    {formatDuration(song.duration)}
                </Text>
                <FavoriteButton isFavorite={isFavorite} onToggle={handleFavoriteToggle} variant="compact" />
            </TouchableOpacity>
        );
    }

    if (variant === "list") {
        return (
            <TouchableOpacity
                onPress={onPress}
                className={`flex-row items-center py-2 px-1 ${isDark ? "border-gray-800" : "border-gray-200"
                    } border-b`}
                activeOpacity={0.7}
            >
                <Image
                    source={{ uri: song.coverImageUrl || "https://via.placeholder.com/40" }}
                    className="w-10 h-10 rounded"
                />
                <SongInfo song={song} showArtist={showArtist} isDark={isDark} />
                <Text className="text-xs text-gray-400 mx-2">
                    {formatDuration(song.duration)}
                </Text>
                <TouchableOpacity onPress={onMorePress} className="p-2">
                    <Ionicons name="ellipsis-vertical" size={18} color="#9ca3af" />
                </TouchableOpacity>
            </TouchableOpacity>
        );
    }

    // Default variant
    return (
        <TouchableOpacity
            onPress={onPress}
            className={`rounded-xl overflow-hidden ${isDark ? "bg-gray-800/80" : "bg-white"
                } shadow-sm`}
            activeOpacity={0.8}
        >
            <View className="relative">
                <Image
                    source={{ uri: song.coverImageUrl || "https://via.placeholder.com/200" }}
                    className="w-full h-48"
                    resizeMode="cover"
                />
                <View className="absolute top-2 right-2 flex-row gap-2">
                    <FavoriteButton isFavorite={isFavorite} onToggle={handleFavoriteToggle} variant="default" />
                    {onMorePress && (
                        <TouchableOpacity
                            onPress={onMorePress}
                            className="bg-black/50 p-2 rounded-full"
                        >
                            <Ionicons name="ellipsis-horizontal" size={20} color="white" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <View className="p-4">
                <Text
                    className={`font-bold text-base mb-1 ${isDark ? "text-white" : "text-gray-900"
                        }`}
                    numberOfLines={1}
                >
                    {song.title}
                </Text>

                {showArtist && song.mainArtist && (
                    <Text className="text-sm text-gray-400 mb-1" numberOfLines={1}>
                        {song.mainArtist.name}
                    </Text>
                )}

                {showAlbum && song.albums && song.albums.length > 0 && (
                    <Text className="text-xs text-gray-500" numberOfLines={1}>
                        {song.albums[0].title}
                    </Text>
                )}

                <View className="flex-row items-center justify-between mt-2">
                    <Text className="text-xs text-gray-400">
                        {formatDuration(song.duration)}
                    </Text>
                    <View className="flex-row items-center">
                        <Ionicons name="play" size={12} color="#9ca3af" />
                        <Text className="text-xs text-gray-400 ml-1">
                            {song.playCount.toLocaleString()}
                        </Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
};
