import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { RankingItem } from "./RankingItem";
import { useAppSelector } from "@/features/store";
import type { SongResponseWithAllAlbum, TopSongPlayCounter } from "@/types/music";
import React, { memo } from "react";

interface RankingCardProps {
    title: string;
    data: (TopSongPlayCounter | SongResponseWithAllAlbum)[];
    onPress: () => void;
    onPlayPress: () => void;
    onSongPress?: (item: TopSongPlayCounter | SongResponseWithAllAlbum) => void;
    color?: string; // Optional accent color for future use
}

const RankingCardComponent = ({
    title,
    data,
    onPress,
    onPlayPress,
    onSongPress,
}: Readonly<RankingCardProps>) => {
    const { mode } = useAppSelector((state) => state.theme);
    const isDark = mode === "dark";

    return (
        <View
            className={`rounded-3xl p-4 w-80 mr-4 ${isDark ? "bg-[#1E1E1E]" : "bg-white border border-gray-200"
                }`}
        >
            {/* Header */}
            <View className="flex-row items-center justify-between mb-4">
                <TouchableOpacity
                    onPress={onPress}
                    className="flex-row items-center flex-1"
                >
                    <Text
                        className={`text-xl font-bold mr-2 ${isDark ? "text-white" : "text-gray-900"}`}
                        numberOfLines={1}
                    >
                        {title}
                    </Text>
                    <Ionicons
                        name="chevron-forward"
                        size={20}
                        color={isDark ? "white" : "black"}
                    />
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={onPlayPress}
                    className="w-10 h-10 rounded-full bg-[#DF40A3] items-center justify-center ml-2"
                >
                    <Ionicons name="play" size={20} color="white" style={{ marginLeft: 2 }} />
                </TouchableOpacity>
            </View>

            {/* List */}
            <View className="min-h-[100px] justify-center">
                {data.length > 0 ? (
                    data.slice(0, 5).map((item, index) => (
                        <RankingItem
                            key={'id' in item ? item.id : item.songId}
                            item={item}
                            rank={index + 1}
                            onPress={() => onSongPress?.(item)} // Navigate to full list on item press too
                            variant="compact"
                            showChange={true}
                        />
                    ))
                ) : (
                    <View className="items-center justify-center py-4">
                        <Ionicons name="stats-chart" size={32} color={isDark ? "#374151" : "#e5e7eb"} />
                        <Text className={`text-sm mt-2 font-medium ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                            Chưa có dữ liệu
                        </Text>
                    </View>
                )}
            </View>
        </View>
    );
};

export const RankingCard = memo(RankingCardComponent);

