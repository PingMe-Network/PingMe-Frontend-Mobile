import { View, Text, TouchableOpacity, Animated, TextInput, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export type FavoritesHeaderProps = {
    isDark: boolean;
    headerHeight: any;
    searchOpacity: any;
    titleOpacity: any;
    searchQuery: string;
    onSearchChange: (value: string) => void;
    onClearSearch: () => void;
    headerCover?: string;
    songCount: number;
    onShufflePlay: () => void;
    onPlayAll: () => void;
};

export function FavoritesHeader({
    isDark,
    headerHeight,
    searchOpacity,
    titleOpacity,
    searchQuery,
    onSearchChange,
    onClearSearch,
    headerCover,
    songCount,
    onShufflePlay,
    onPlayAll,
}: Readonly<FavoritesHeaderProps>) {
    return (
        <Animated.View
            style={{ height: headerHeight }}
            className={isDark ? "bg-background-dark" : "bg-background-light"}
        >
            <Animated.View style={{ opacity: searchOpacity }} className="px-4 pt-2">
                <View className="flex-row items-center">
                    <View
                        className={`flex-1 flex-row items-center px-4 py-2 ${isDark ? "bg-gray-800/80" : "bg-gray-200"
                            }`}
                    >
                        <Ionicons
                            name="search"
                            size={18}
                            color={isDark ? "#9ca3af" : "#6b7280"}
                        />
                        <TextInput
                            placeholder="Tìm trong mục Bài hát đã thích"
                            placeholderTextColor={isDark ? "#6b7280" : "#9ca3af"}
                            value={searchQuery}
                            onChangeText={onSearchChange}
                            className={`flex-1 ml-2 ${isDark ? "text-white" : "text-gray-900"}`}
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={onClearSearch}>
                                <Ionicons
                                    name="close"
                                    size={18}
                                    color={isDark ? "#9ca3af" : "#6b7280"}
                                />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </Animated.View>

            <Animated.View style={{ opacity: titleOpacity }} className="px-4 pt-6">
                <Text
                    className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}
                >
                    Bài hát đã thích
                </Text>
                <Text className={isDark ? "text-gray-300" : "text-gray-500"}>
                    {songCount} bài hát
                </Text>

                <View className="mt-4 flex-row items-center justify-between">
                    <View className="flex-row items-center gap-4">
                        <View
                            className={`h-12 w-12 rounded-lg ${isDark ? "bg-gray-700" : "bg-gray-200"
                                } overflow-hidden items-center justify-center`}
                        >
                            {headerCover ? (
                                <Image
                                    source={{ uri: headerCover }}
                                    className="h-12 w-12"
                                    resizeMode="cover"
                                />
                            ) : (
                                <Ionicons
                                    name="musical-notes"
                                    size={20}
                                    color={isDark ? "#e5e7eb" : "#374151"}
                                />
                            )}
                        </View>
                        <TouchableOpacity className="h-12 w-12 items-center justify-center rounded-full border border-gray-500/40">
                            <Ionicons
                                name="arrow-down"
                                size={20}
                                color={isDark ? "#e5e7eb" : "#374151"}
                            />
                        </TouchableOpacity>
                    </View>

                    <View className="flex-row items-center gap-4">
                        <TouchableOpacity
                            className="h-12 w-12 items-center justify-center rounded-full"
                            onPress={onShufflePlay}
                        >
                            <Ionicons
                                name="shuffle"
                                size={22}
                                color={isDark ? "#e5e7eb" : "#374151"}
                            />
                        </TouchableOpacity>
                        <TouchableOpacity
                            className="h-14 w-14 items-center justify-center rounded-full bg-primary"
                            onPress={onPlayAll}
                        >
                            <Ionicons name="play" size={22} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>
            </Animated.View>
        </Animated.View>
    );
}
