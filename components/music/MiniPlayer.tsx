import { View, Text, TouchableOpacity, Image, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAppSelector, useAppDispatch } from "@/features/store";
import {
    playSong,
    pauseSong,
    playNextSong,
    playPreviousSong,
    setPlayerMinimized,
    clearShouldPlayNext,
} from "@/features/slices/playerSlice";
import { useEffect, useRef } from "react";

export const MiniPlayer = () => {
    const dispatch = useAppDispatch();
    const { mode } = useAppSelector((state) => state.theme);
    const isDark = mode === "dark";

    const { currentSong, isPlaying, position, duration, isPlayerMinimized, shouldPlayNext } =
        useAppSelector((state) => state.player);

    const slideAnim = useRef(new Animated.Value(200)).current;

    // Auto-play next song when current song finishes
    useEffect(() => {
        if (shouldPlayNext) {
            // Clear the flag first
            dispatch(clearShouldPlayNext());
            // Play next song (playNextSong handles all repeat modes)
            dispatch(playNextSong());
        }
    }, [shouldPlayNext, dispatch]);

    useEffect(() => {
        // Show MiniPlayer when there's a song and player is minimized
        // Hide when no song or player is expanded (full screen)
        const shouldShow = currentSong && isPlayerMinimized;

        Animated.timing(slideAnim, {
            toValue: shouldShow ? 0 : 200,
            duration: 300,
            useNativeDriver: true,
        }).start();
    }, [isPlayerMinimized, currentSong, slideAnim]);

    // Don't render at all if no current song
    if (!currentSong) return null;

    const progress = duration > 0 ? (position / duration) * 100 : 0;

    const handlePlayPause = () => {
        if (isPlaying) {
            dispatch(pauseSong());
        } else {
            dispatch(playSong());
        }
    };

    const handleExpand = () => {
        dispatch(setPlayerMinimized(false));
    };

    return (
        <Animated.View
            style={{
                transform: [{ translateY: slideAnim }],
            }}
            className={`${isDark ? "bg-gray-900" : "bg-white"
                } border-t ${isDark ? "border-gray-800" : "border-gray-200"} shadow-lg`}
        >
            {/* Progress Bar */}
            <View className="h-1 bg-gray-700">
                <View
                    className="h-full bg-primary"
                    style={{ width: `${progress}%` }}
                />
            </View>

            <TouchableOpacity
                onPress={handleExpand}
                activeOpacity={0.9}
                className="flex-row items-center p-3 pb-4"
            >
                <Image
                    source={{ uri: currentSong.coverImageUrl || "https://via.placeholder.com/50" }}
                    className="w-12 h-12 rounded-md"
                />

                <View className="flex-1 ml-3">
                    <Text
                        className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}
                        numberOfLines={1}
                    >
                        {currentSong.title}
                    </Text>
                    {currentSong.mainArtist && (
                        <Text className="text-sm text-gray-400" numberOfLines={1}>
                            {currentSong.mainArtist.name}
                        </Text>
                    )}
                </View>

                <View className="flex-row items-center gap-3">
                    <TouchableOpacity
                        onPress={() => dispatch(playPreviousSong())}
                        className="p-2"
                    >
                        <Ionicons
                            name="play-skip-back"
                            size={24}
                            color={isDark ? "white" : "#1f2937"}
                        />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={handlePlayPause} className="p-2">
                        <Ionicons
                            name={isPlaying ? "pause" : "play"}
                            size={28}
                            color={isDark ? "white" : "#1f2937"}
                        />
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => dispatch(playNextSong())}
                        className="p-2"
                    >
                        <Ionicons
                            name="play-skip-forward"
                            size={24}
                            color={isDark ? "white" : "#1f2937"}
                        />
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
};
