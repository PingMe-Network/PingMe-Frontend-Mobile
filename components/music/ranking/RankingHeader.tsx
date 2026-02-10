
import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface RankingHeaderProps {
    headerImage: string;
    title: string;
    currentDate: string;
    songCount: number;
    isDark: boolean;
    topInset: number;
    onBack: () => void;
    onPlayAll: () => void;
    onShufflePlay: () => void;
}

export const RankingHeader = ({
    headerImage,
    title,
    currentDate,
    songCount,
    isDark,
    topInset,
    onBack,
    onPlayAll,
    onShufflePlay
}: Readonly<RankingHeaderProps>) => (
    <View className="relative h-80 w-full overflow-hidden mb-4">
        <Image
            source={{ uri: headerImage }}
            className="absolute w-full h-full"
            style={{ width: '100%', height: '100%', position: 'absolute' }}
            contentFit="cover"
            blurRadius={Platform.OS === 'ios' ? 10 : 3}
        />
        {/* Overlay for better readability */}
        <View className="absolute w-full h-full bg-black/30" />
        <LinearGradient
            colors={['transparent', isDark ? '#000000' : '#ffffff']}
            className="absolute w-full h-full"
        />

        <View
            style={{ paddingTop: topInset + 10 }}
            className="px-4 h-full flex justify-between pb-6"
        >
            <TouchableOpacity onPress={onBack} className="w-10 h-10 items-center justify-center rounded-full bg-black/20">
                <Ionicons name="chevron-back" size={24} color="white" />
            </TouchableOpacity>

            <View>
                <Text className="text-white text-3xl font-bold mb-2 shadow-sm">
                    {title}
                </Text>
                <View className="flex-row items-center mb-4">
                    <Text className="text-gray-300 text-sm mr-2">Cập nhật {currentDate}</Text>
                    <Ionicons name="chevron-down" size={14} color="#d1d5db" />
                </View>

                <View className="flex-row items-center justify-between">
                    <View className="flex-row gap-4">
                        <TouchableOpacity className="items-center justify-center">
                            <Ionicons name="arrow-redo-outline" size={24} color="white" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={onShufflePlay}
                            className="overflow-hidden rounded-full"
                        >
                            <LinearGradient
                                colors={['#ec4899', '#a855f7']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                className="px-6 py-2 flex-row items-center"
                            >
                                <Ionicons name="shuffle" size={16} color="white" style={{ marginRight: 4 }} />
                                <Text className="font-bold text-white">Ngẫu nhiên</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        onPress={onPlayAll}
                        className="w-12 h-12 rounded-full overflow-hidden"
                    >
                        <LinearGradient
                            colors={['#ec4899', '#a855f7']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            className="w-full h-full items-center justify-center"
                        >
                            <Ionicons name="play" size={24} color="white" style={{ marginLeft: 2 }} />
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </View>
        </View>

        <View className="px-4 flex-row items-center justify-between mt-2">
            <Text className={`text-base font-medium ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                {songCount} bài
            </Text>
            <View className="flex-row gap-4">
                <TouchableOpacity>
                    <Ionicons name="download-outline" size={22} color={isDark ? "#9ca3af" : "#4b5563"} />
                </TouchableOpacity>
                <TouchableOpacity>
                    <Ionicons name="add-circle-outline" size={22} color={isDark ? "#9ca3af" : "#4b5563"} />
                </TouchableOpacity>
            </View>
        </View>
    </View>
);
