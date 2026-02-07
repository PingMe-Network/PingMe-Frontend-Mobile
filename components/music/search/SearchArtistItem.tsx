import { View, Text, TouchableOpacity, Image } from "react-native";
import type { ArtistResponse } from "@/types/music";

interface SearchArtistItemProps {
    artist: ArtistResponse;
    onPress: () => void;
    isDark: boolean;
}

export function SearchArtistItem({ artist, onPress, isDark }: SearchArtistItemProps) {
    return (
        <TouchableOpacity
            onPress={onPress}
            className="flex-row items-center py-2"
            activeOpacity={0.7}
        >
            <Image
                source={{ uri: artist.imgUrl }}
                className="w-14 h-14 rounded-full"
            />
            <View className="flex-1 ml-3">
                <Text
                    className={`text-base font-medium ${isDark ? "text-white" : "text-gray-900"}`}
                    numberOfLines={1}
                >
                    {artist.name}
                </Text>
                <Text
                    className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
                    numberOfLines={1}
                >
                    Nghệ sĩ
                </Text>
            </View>
        </TouchableOpacity>
    );
}
