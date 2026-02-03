import { Text, TouchableOpacity, Image } from "react-native";
import type { ArtistResponse } from "@/types/music";
import { useAppSelector } from "@/features/store";

interface ArtistCardProps {
    artist: ArtistResponse;
    onPress?: () => void;
    variant?: "default" | "compact";
}

export const ArtistCard = ({ artist, onPress, variant = "default" }: ArtistCardProps) => {
    const { mode } = useAppSelector((state) => state.theme);
    const isDark = mode === "dark";

    if (variant === "compact") {
        return (
            <TouchableOpacity
                onPress={onPress}
                className="items-center w-28 mr-4"
                activeOpacity={0.7}
            >
                <Image
                    source={{ uri: artist.imgUrl || "https://via.placeholder.com/100" }}
                    className="w-24 h-24 rounded-full"
                    resizeMode="cover"
                />
                <Text
                    className={`font-semibold mt-2 text-center ${isDark ? "text-white" : "text-gray-900"
                        }`}
                    numberOfLines={1}
                >
                    {artist.name}
                </Text>
            </TouchableOpacity>
        );
    }

    return (
        <TouchableOpacity
            onPress={onPress}
            className={`items-center p-4 rounded-xl ${isDark ? "bg-gray-800/80" : "bg-white"
                } shadow-sm`}
            activeOpacity={0.8}
        >
            <Image
                source={{ uri: artist.imgUrl || "https://via.placeholder.com/120" }}
                className="w-32 h-32 rounded-full mb-3"
                resizeMode="cover"
            />
            <Text
                className={`font-bold text-base text-center ${isDark ? "text-white" : "text-gray-900"
                    }`}
                numberOfLines={2}
            >
                {artist.name}
            </Text>
            {artist.bio && (
                <Text
                    className="text-xs text-gray-400 text-center mt-1"
                    numberOfLines={2}
                >
                    {artist.bio}
                </Text>
            )}
        </TouchableOpacity>
    );
};
