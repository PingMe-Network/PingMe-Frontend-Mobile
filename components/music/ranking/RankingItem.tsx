import { View, Text, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import type { SongResponseWithAllAlbum, TopSongPlayCounter } from "@/types/music";
import { useAppSelector } from "@/features/store";
import React, { memo } from "react";

interface RankingItemProps {
    item: TopSongPlayCounter | SongResponseWithAllAlbum;
    rank: number;
    onPress?: () => void;
    showChange?: boolean; // Show up/down/neutral indicator
    variant?: "compact" | "full";
}

const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
};

const RankingItemComponent = ({
    item,
    rank,
    onPress,
    showChange = false,
    variant = "compact",
}: Readonly<RankingItemProps>) => {
    const { mode } = useAppSelector((state) => state.theme);
    const isDark = mode === "dark";

    // Handle different item types (TopSongPlayCounter vs SongResponseWithAllAlbum)
    const title = item.title;
    const imgUrl = 'coverImageUrl' in item ? item.coverImageUrl : item.imgUrl;
    const artist = 'artist' in item && item.artist ? item.artist : ('mainArtist' in item ? item.mainArtist.name : "Unknown Artist");
    // const playCount = item.playCount; // Unused variable

    // Determine rank color
    let rankColor = isDark ? "text-white" : "text-gray-900";
    if (rank === 1) rankColor = "text-[#DF40A3]"; // Primary
    else if (rank === 2) rankColor = "text-[#00E5FF]"; // Secondary
    else if (rank === 3) rankColor = "text-green-500"; // Green

    // Mock rank change (random for demo if not provided by API)
    const getChangeIcon = () => {
        if (!showChange) return null;
        if (rank === 1) return <View className="w-2 h-[2px] bg-gray-500" />;
        if (rank % 2 === 0) return <Ionicons name="caret-up" size={12} color="#22c55e" />;
        return <Ionicons name="caret-down" size={12} color="#ef4444" />;
    };

    return (
        <TouchableOpacity
            onPress={onPress}
            className={`flex-row items-center py-2 px-1 ${isDark ? "border-gray-800" : "border-gray-200"
                } border-b`}
            activeOpacity={0.7}
        >
            <View className="w-8 items-center justify-center mr-2">
                <Text
                    className={`text-lg font-bold ${rank <= 3 ? "text-3xl" : "text-lg"} ${rankColor}`}
                    style={{ fontFamily: 'System' }}
                >
                    {rank}
                </Text>
                {showChange && <View className="mt-1">{getChangeIcon()}</View>}
            </View>

            <Image
                source={{ uri: imgUrl || "https://via.placeholder.com/50" }}
                className="w-12 h-12 rounded-lg"
                style={{ width: 48, height: 48, borderRadius: 8 }}
                contentFit="cover"
                transition={200}
            />

            <View className="flex-1 ml-3 justify-center">
                <Text
                    className={`font-semibold text-base ${isDark ? "text-white" : "text-gray-900"}`}
                    numberOfLines={1}
                >
                    {title}
                </Text>
                <Text className="text-sm text-gray-400" numberOfLines={1}>
                    {artist}
                </Text>
            </View>

            {variant === "full" && (
                <TouchableOpacity onPress={() => { }} className="p-2">
                    <Ionicons name="ellipsis-horizontal" size={20} color="#9ca3af" />
                </TouchableOpacity>
            )}
        </TouchableOpacity>
    );
};

export const RankingItem = memo(RankingItemComponent);

