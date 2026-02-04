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
import { Colors } from "@/constants/Colors";

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
        dispatch(isPlaying ? pauseSong() : playSong());
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
                className="flex-1"
                style={{ backgroundColor: isDark ? Colors.background.dark : Colors.background.light }}
            >
                {/* Header */}
                <View className="flex-row items-center justify-between p-2 pt-12">
                    <TouchableOpacity
                        onPress={() => dispatch(setPlayerMinimized(true))}
                        className="p-2"
                    >
                        <Ionicons
                            name="chevron-down"
                            size={28}
                            color={isDark ? Colors.text.dark : Colors.text.light}
                        />
                    </TouchableOpacity>

                    <Text
                        className="font-semibold"
                        style={{ color: isDark ? Colors.text.dark : Colors.text.light }}
                    >
                        Now Playing
                    </Text>

                    <TouchableOpacity className="p-2">
                        <Ionicons
                            name="ellipsis-horizontal"
                            size={24}
                            color={isDark ? Colors.text.dark : Colors.text.light}
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
                        className="text-2xl font-bold mb-2"
                        style={{ color: isDark ? Colors.text.dark : Colors.text.light }}
                        numberOfLines={1}
                    >
                        {currentSong.title}
                    </Text>
                    {currentSong.mainArtist && (
                        <Text
                            className="text-lg"
                            style={{ color: Colors.text.gray }}
                            numberOfLines={1}
                        >
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
                        minimumTrackTintColor={Colors.primary}
                        maximumTrackTintColor={Colors.text.gray}
                        thumbTintColor={Colors.primary}
                    />
                    <View className="flex-row justify-between">
                        <Text className="text-xs" style={{ color: Colors.text.gray }}>
                            {formatTime(position)}
                        </Text>
                        <Text className="text-xs" style={{ color: Colors.text.gray }}>
                            {formatTime(duration)}
                        </Text>
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
                                color={isShuffled ? Colors.primary : Colors.text.gray}
                            />
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => dispatch(toggleRepeat())}>
                            <Ionicons
                                name={getRepeatIcon(repeatMode)}
                                size={24}
                                color={repeatMode === "off" ? Colors.text.gray : Colors.primary}
                            />
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => setShowVolumeControl(!showVolumeControl)}>
                            <Ionicons
                                name={isMuted ? "volume-mute" : "volume-high"}
                                size={24}
                                color={Colors.text.gray}
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
                                color={isDark ? Colors.text.dark : Colors.text.light}
                            />
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={handlePlayPause}
                            className="w-20 h-20 rounded-full items-center justify-center"
                            style={{ backgroundColor: isDark ? Colors.background.dark : Colors.background.light }}
                        >
                            <Ionicons
                                name={isPlaying ? "pause" : "play"}
                                size={40}
                                color={isDark ? Colors.text.dark : Colors.text.light}
                            />
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => dispatch(playNextSong())}
                            className="p-3"
                        >
                            <Ionicons
                                name="play-skip-forward"
                                size={36}
                                color={isDark ? Colors.text.dark : Colors.text.light}
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
                            minimumTrackTintColor={Colors.primary}
                            maximumTrackTintColor={Colors.text.gray}
                            thumbTintColor={Colors.primary}
                        />
                    </View>
                )}
            </View>
        </Modal>
    );
};
