import { View, Text, TouchableOpacity, Image, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { useAppSelector, useAppDispatch } from "@/features/store";
import {
    playSong,
    pauseSong,
    playNextSong,
    playPreviousSong,
    seekTo,
    toggleRepeat,
    toggleShuffle,
    setPlayerMinimized,
    setVolume,
} from "@/features/slices/playerSlice";
import { useState } from "react";

const formatTime = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

const getRepeatIcon = (repeatMode: "off" | "one" | "all") => {
    switch (repeatMode) {
        case "one":
            return "repeat-outline";
        case "all":
            return "repeat";
        default:
            return "repeat-outline";
    }
};

export const FullPlayer = () => {
    const dispatch = useAppDispatch();
    const { mode } = useAppSelector((state) => state.theme);
    const isDark = mode === "dark";

    const {
        currentSong,
        isPlaying,
        position,
        duration,
        isPlayerMinimized,
        repeatMode,
        isShuffled,
        volume,
        isMuted,
    } = useAppSelector((state) => state.player);

    const [showVolumeControl, setShowVolumeControl] = useState(false);

    if (!currentSong || isPlayerMinimized) return null;

    const handlePlayPause = () => {
        if (isPlaying) {
            dispatch(pauseSong());
        } else {
            dispatch(playSong());
        }
    };

    const handleSeek = (value: number) => {
        dispatch(seekTo(value));
    };

    return (
        <Modal
            visible={!isPlayerMinimized}
            animationType="slide"
            presentationStyle="fullScreen"
        >
            <View
                className={`flex-1 ${isDark ? "bg-gray-900" : "bg-white"}`}
            >
                {/* Header */}
                <View className="flex-row items-center justify-between p-4 pt-12">
                    <TouchableOpacity
                        onPress={() => dispatch(setPlayerMinimized(true))}
                        className="p-2"
                    >
                        <Ionicons
                            name="chevron-down"
                            size={28}
                            color={isDark ? "white" : "#1f2937"}
                        />
                    </TouchableOpacity>

                    <Text className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
                        Now Playing
                    </Text>

                    <TouchableOpacity className="p-2">
                        <Ionicons
                            name="ellipsis-horizontal"
                            size={24}
                            color={isDark ? "white" : "#1f2937"}
                        />
                    </TouchableOpacity>
                </View>

                {/* Album Art */}
                <View className="flex-1 items-center justify-center px-8">
                    <Image
                        source={{
                            uri: currentSong.coverImageUrl || "https://via.placeholder.com/300",
                        }}
                        className="w-80 h-80 rounded-2xl shadow-2xl"
                        resizeMode="cover"
                    />
                </View>

                {/* Song Info */}
                <View className="px-8 mb-4">
                    <Text
                        className={`text-2xl font-bold mb-2 ${isDark ? "text-white" : "text-gray-900"
                            }`}
                        numberOfLines={1}
                    >
                        {currentSong.title}
                    </Text>
                    {currentSong.mainArtist && (
                        <Text className="text-lg text-gray-400" numberOfLines={1}>
                            {currentSong.mainArtist.name}
                        </Text>
                    )}
                </View>

                {/* Progress Bar */}
                <View className="px-8 mb-2">
                    <Slider
                        value={position}
                        minimumValue={0}
                        maximumValue={duration}
                        onSlidingComplete={handleSeek}
                        minimumTrackTintColor="#3b82f6"
                        maximumTrackTintColor={isDark ? "#374151" : "#d1d5db"}
                        thumbTintColor="#3b82f6"
                    />
                    <View className="flex-row justify-between">
                        <Text className="text-xs text-gray-400">{formatTime(position)}</Text>
                        <Text className="text-xs text-gray-400">{formatTime(duration)}</Text>
                    </View>
                </View>

                {/* Controls */}
                <View className="px-8 mb-8">
                    {/* Secondary Controls */}
                    <View className="flex-row items-center justify-between mb-6">
                        <TouchableOpacity onPress={() => dispatch(toggleShuffle())}>
                            <Ionicons
                                name="shuffle"
                                size={24}
                                color={isShuffled ? "#3b82f6" : "#9ca3af"}
                            />
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => dispatch(toggleRepeat())}>
                            <Ionicons
                                name={getRepeatIcon(repeatMode)}
                                size={24}
                                color={repeatMode === "off" ? "#9ca3af" : "#3b82f6"}
                            />
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => setShowVolumeControl(!showVolumeControl)}>
                            <Ionicons
                                name={isMuted ? "volume-mute" : "volume-high"}
                                size={24}
                                color="#9ca3af"
                            />
                        </TouchableOpacity>
                    </View>

                    {/* Main Controls */}
                    <View className="flex-row items-center justify-between">
                        <TouchableOpacity
                            onPress={() => dispatch(playPreviousSong())}
                            className="p-3"
                        >
                            <Ionicons
                                name="play-skip-back"
                                size={36}
                                color={isDark ? "white" : "#1f2937"}
                            />
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={handlePlayPause}
                            className={`w-20 h-20 rounded-full items-center justify-center ${isDark ? "bg-gray-800" : "bg-gray-100"
                                }`}
                        >
                            <Ionicons
                                name={isPlaying ? "pause" : "play"}
                                size={40}
                                color={isDark ? "white" : "#1f2937"}
                            />
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => dispatch(playNextSong())}
                            className="p-3"
                        >
                            <Ionicons
                                name="play-skip-forward"
                                size={36}
                                color={isDark ? "white" : "#1f2937"}
                            />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Volume Control Modal */}
                {showVolumeControl && (
                    <View className="px-8 mb-4">
                        <Slider
                            value={volume}
                            minimumValue={0}
                            maximumValue={1}
                            onValueChange={(value) => dispatch(setVolume(value))}
                            minimumTrackTintColor="#3b82f6"
                            maximumTrackTintColor={isDark ? "#374151" : "#d1d5db"}
                            thumbTintColor="#3b82f6"
                        />
                    </View>
                )}
            </View>
        </Modal>
    );
};
