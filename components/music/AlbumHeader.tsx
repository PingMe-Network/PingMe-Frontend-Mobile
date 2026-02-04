import { View, Text, TouchableOpacity, Image } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";

export type AlbumHeaderProps = {
    isDark: boolean;
    coverImageUrl?: string;
    albumTitle: string;
    artistName?: string;
    songCount: number;
};

export function AlbumHeader({
    isDark,
    coverImageUrl,
    albumTitle,
    artistName,
    songCount,
}: Readonly<AlbumHeaderProps>) {
    return (
        <View className="px-4 pt-2 pb-4">
            {/* Header */}
            <View className="flex-row items-center">
                <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
                    <Ionicons
                        name="chevron-back"
                        size={24}
                        color={isDark ? Colors.text.dark : Colors.text.light}
                    />
                </TouchableOpacity>
            </View>

            {/* Album Art */}
            <View className="items-center mt-2">
                <Image
                    source={{
                        uri: coverImageUrl || "https://via.placeholder.com/300",
                    }}
                    className="w-80 h-80 rounded-2xl"
                    resizeMode="cover"
                />
            </View>

            {/* Album Info */}
            <View className="mt-6">
                <Text
                    className="text-3xl font-bold"
                    style={{ color: isDark ? Colors.text.dark : Colors.text.light }}
                    numberOfLines={1}
                >
                    {albumTitle}
                </Text>
                {artistName && (
                    <View className="flex-row items-center mt-2">
                        <View
                            className="h-9 w-9 rounded-full items-center justify-center border"
                            style={{
                                backgroundColor: isDark
                                    ? Colors.background.dark
                                    : Colors.background.light,
                                borderColor: Colors.text.gray,
                            }}
                        >
                            <Ionicons name="person" size={18} color={Colors.text.gray} />
                        </View>
                        <Text
                            className="ml-3 font-semibold"
                            style={{ color: isDark ? Colors.text.dark : Colors.text.light }}
                        >
                            {artistName}
                        </Text>
                    </View>
                )}
                <Text className="mt-2" style={{ color: Colors.text.gray }}>
                    {songCount} bài hát
                </Text>
            </View>

            {/* Actions */}
            <View className="mt-6 flex-row items-center justify-between">
                <View className="flex-row items-center gap-4">
                    <TouchableOpacity
                        className="h-11 w-11 items-center justify-center rounded-full border"
                        style={{
                            backgroundColor: isDark ? Colors.background.dark : Colors.background.light,
                            borderColor: Colors.text.gray,
                        }}
                    >
                        <Ionicons name="add" size={22} color={Colors.text.gray} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        className="h-11 w-11 items-center justify-center rounded-full border"
                        style={{
                            backgroundColor: isDark ? Colors.background.dark : Colors.background.light,
                            borderColor: Colors.text.gray,
                        }}
                    >
                        <Ionicons name="arrow-down" size={22} color={Colors.text.gray} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        className="h-11 w-11 items-center justify-center rounded-full border"
                        style={{
                            backgroundColor: isDark ? Colors.background.dark : Colors.background.light,
                            borderColor: Colors.text.gray,
                        }}
                    >
                        <Ionicons name="ellipsis-horizontal" size={20} color={Colors.text.gray} />
                    </TouchableOpacity>
                </View>

                <View className="flex-row items-center gap-4">
                    <TouchableOpacity className="h-12 w-12 items-center justify-center rounded-full">
                        <Ionicons name="shuffle" size={22} color={Colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        className="h-14 w-14 items-center justify-center rounded-full"
                        style={{ backgroundColor: Colors.primary }}
                    >
                        <Ionicons name="play" size={22} color="white" />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}
