import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
  ActivityIndicator,
  Image,
  Animated,
} from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import { LinearGradient } from "expo-linear-gradient";
import {
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  VolumeX,
  Volume2,
} from "lucide-react-native";
import type { Reel } from "@/types/reels";
import { Colors } from "@/constants/Colors";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface ReelCardProps {
  reel: Reel;
  isActive: boolean;
  isLiking?: boolean;
  isSaving?: boolean;
  onLike: (id: number) => void;
  onSave: (id: number) => void;
  onComment: (id: number) => void;
  onShare?: (id: number) => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

/**
 * ======================================
 * REEL CARD — Full-screen video card (expo-video)
 * ======================================
 */
export default function ReelCard({
  reel,
  isActive,
  isLiking = false,
  isSaving = false,
  onLike,
  onSave,
  onComment,
  onShare,
  isMuted,
  onToggleMute,
}: ReelCardProps) {
  const [isVideoPaused, setIsVideoPaused] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const heartScale = useRef(new Animated.Value(1)).current;
  const lastTapTime = useRef<number>(0);          // Timestamp of last tap
  const [showHeartFlash, setShowHeartFlash] = useState(false);

  // expo-video player
  const player = useVideoPlayer(reel.videoUrl, (p) => {
    p.loop = true;
    p.muted = isMuted;
    if (isActive) {
      p.play();
    }
  });

  // Sync play/pause based on isActive and pause state
  // NOTE: `player` intentionally excluded from deps — it's stable from useVideoPlayer
  // and including it would cause play() to override pause on every re-render
  useEffect(() => {
    if (isActive && !isVideoPaused) {
      player.play();
    } else {
      player.pause();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, isVideoPaused]);

  // Sync mute state
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    player.muted = isMuted;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMuted]);

  // Listen to playback status for loading indicator — run once on mount
  useEffect(() => {
    const subscription = player.addListener("statusChange", (status) => {
      if (status.status === "readyToPlay") {
        setIsLoading(false);
      }
      if (status.status === "error") {
        setIsLoading(false);
        setVideoError(true);
      }
    });
    return () => subscription.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePressVideo = useCallback(() => {
    setIsVideoPaused((prev) => !prev);
  }, []);

  const showHeartAnimation = useCallback(() => {
    setShowHeartFlash(true);
    Animated.sequence([
      Animated.spring(heartScale, { toValue: 1.4, useNativeDriver: true }),
      Animated.spring(heartScale, { toValue: 1, useNativeDriver: true }),
    ]).start(() => setTimeout(() => setShowHeartFlash(false), 500));
  }, [heartScale]);

  /**
   * Tap handler — instant response:
   * - Single tap  → pause/resume IMMEDIATELY (no delay)
   * - Double tap  → like + heart flash (2nd tap within 300ms on top of the pause)
   */
  const handleVideoTap = useCallback(() => {
    const now = Date.now();
    const isDoubleTap = now - lastTapTime.current < 300;
    lastTapTime.current = now;

    // Always toggle pause instantly on every tap
    handlePressVideo();

    if (isDoubleTap) {
      // 2nd tap: also like + heart
      showHeartAnimation();
      if (!reel.isLikedByMe) {
        onLike(reel.id);
      }
    }
  }, [handlePressVideo, showHeartAnimation, reel.isLikedByMe, reel.id, onLike]);

  const handleLikePress = useCallback(() => {
    Animated.sequence([
      Animated.spring(heartScale, { toValue: 1.3, useNativeDriver: true, speed: 40 }),
      Animated.spring(heartScale, { toValue: 1, useNativeDriver: true, speed: 40 }),
    ]).start();
    onLike(reel.id);
  }, [heartScale, onLike, reel.id]);

  const formatCount = (count: number): string => {
    if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
    if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
    return count.toString();
  };

  return (
    <View style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }} className="bg-black">
      {/* Video layer */}
      <TouchableOpacity
        activeOpacity={1}
        style={StyleSheet.absoluteFill}
        onPress={handleVideoTap}
      >
        {videoError ? (
          <View className="flex-1 items-center justify-center bg-[#111]">
            <Text className="text-white/70 text-sm">Không thể tải video</Text>
          </View>
        ) : (
          <VideoView
            player={player}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            nativeControls={false}
          />
        )}

        {/* Loading */}
        {isLoading && !videoError && (
          <View
            className="absolute inset-0 items-center justify-center"
            style={{ backgroundColor: "rgba(0,0,0,0.3)" }}
          >
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        )}

        {/* Pause indicator */}
        {isVideoPaused && !isLoading && (
          <View className="absolute inset-0 items-center justify-center">
            <View
              className="rounded-full p-5"
              style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
            >
              <Text className="text-white text-2xl tracking-widest">▐▐</Text>
            </View>
          </View>
        )}

        {/* Double-tap heart flash */}
        {showHeartFlash && (
          <View className="absolute inset-0 items-center justify-center">
            <Animated.View style={{ transform: [{ scale: heartScale }] }}>
              <Heart
                size={90}
                color={Colors.primary}
                fill={Colors.primary}
                strokeWidth={0}
              />
            </Animated.View>
          </View>
        )}
      </TouchableOpacity>

      {/* Bottom gradient */}
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.7)", "rgba(0,0,0,0.9)"]}
        style={[StyleSheet.absoluteFill, { top: "45%" }]}
        pointerEvents="none"
      />

      {/* Bottom content row */}
      <View className="absolute bottom-24 left-0 right-0 flex-row items-end px-4 gap-3">
        {/* Left: user info + caption */}
        <View className="flex-1 gap-1.5">
          {/* User row */}
          <View className="flex-row items-center gap-2.5">
            <View className="relative w-[42px] h-[42px]">
              {reel.userAvatarUrl ? (
                <Image
                  source={{ uri: reel.userAvatarUrl }}
                  className="w-[42px] h-[42px] rounded-full"
                />
              ) : (
                <View className="w-[42px] h-[42px] rounded-full bg-primary items-center justify-center">
                  <Text className="text-white text-base font-bold">
                    {reel.userName.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <View className="absolute -top-0.5 -left-0.5 -right-0.5 -bottom-0.5 rounded-full border-2 border-primary" />
            </View>
            <Text
              className="text-white font-bold text-[15px] flex-shrink"
              numberOfLines={1}
              style={{
                textShadowColor: "rgba(0,0,0,0.5)",
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 3,
              }}
            >
              @{reel.userName}
            </Text>
          </View>

          {/* Caption */}
          {!!reel.caption && (
            <Text
              className="text-white/90 text-[13px] leading-[18px]"
              numberOfLines={2}
              style={{
                textShadowColor: "rgba(0,0,0,0.5)",
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 3,
              }}
            >
              {reel.caption}
            </Text>
          )}

          {/* Hashtags */}
          {reel.hashtags && reel.hashtags.length > 0 && (
            <View className="flex-row flex-wrap">
              {reel.hashtags.slice(0, 4).map((tag, i) => (
                <Text key={i} className="text-secondary text-[13px] font-semibold">
                  #{tag}{" "}
                </Text>
              ))}
            </View>
          )}
        </View>

        {/* Right: action buttons */}
        <View className="items-center gap-4 pb-2">
          {/* Like */}
          <TouchableOpacity
            className="items-center gap-1"
            onPress={handleLikePress}
            disabled={isLiking}
          >
            <Animated.View style={{ transform: [{ scale: heartScale }] }}>
              <Heart
                size={28}
                color={reel.isLikedByMe ? Colors.primary : "#fff"}
                fill={reel.isLikedByMe ? Colors.primary : "transparent"}
                strokeWidth={reel.isLikedByMe ? 0 : 2}
              />
            </Animated.View>
            <Text className="text-white text-xs font-semibold">
              {formatCount(reel.likeCount)}
            </Text>
          </TouchableOpacity>

          {/* Comment */}
          <TouchableOpacity
            className="items-center gap-1"
            onPress={() => onComment(reel.id)}
          >
            <MessageCircle size={28} color="#fff" strokeWidth={2} />
            <Text className="text-white text-xs font-semibold">
              {formatCount(reel.commentCount)}
            </Text>
          </TouchableOpacity>

          {/* Save */}
          <TouchableOpacity
            className="items-center gap-1"
            onPress={() => onSave(reel.id)}
            disabled={isSaving}
          >
            <Bookmark
              size={28}
              color={reel.isSavedByMe ? Colors.secondary : "#fff"}
              fill={reel.isSavedByMe ? Colors.secondary : "transparent"}
              strokeWidth={reel.isSavedByMe ? 0 : 2}
            />
            <Text className="text-white text-xs font-semibold">Lưu</Text>
          </TouchableOpacity>

          {/* Share */}
          <TouchableOpacity
            className="items-center gap-1"
            onPress={() => onShare?.(reel.id)}
          >
            <Share2 size={26} color="#fff" strokeWidth={2} />
            <Text className="text-white text-xs font-semibold">Chia sẻ</Text>
          </TouchableOpacity>

          {/* Mute */}
          <TouchableOpacity
            className="mt-2 rounded-full p-2"
            style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
            onPress={onToggleMute}
          >
            {isMuted ? (
              <VolumeX size={20} color="#fff" />
            ) : (
              <Volume2 size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
