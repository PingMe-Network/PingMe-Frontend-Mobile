import React, { useCallback, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Animated,
  RefreshControl,
} from "react-native";
import { FlatList } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RefreshCw } from "lucide-react-native";
import { Colors } from "@/constants/Colors";
import ReelCard from "@/components/reels/ReelCard";
import ReelCommentSheet from "@/components/reels/ReelCommentSheet";
import { ReelHeader, CreateReelModal } from "@/components/reels";
import { useReelFeed } from "@/hooks/useReelFeed";
import { useAppSelector } from "@/features/store";
import type { Reel } from "@/types/reels";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const VIEWABILITY_CONFIG = {
  itemVisiblePercentThreshold: 60,
  minimumViewTime: 300,
};

/**
 * ======================================
 * REELS SCREEN — TikTok-style vertical feed
 * ======================================
 */
export default function ReelsScreen() {
  const insets = useSafeAreaInsets();
  const { mode } = useAppSelector((state) => state.theme);
  const isDark = mode === "dark";
  const [isMuted, setIsMuted] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const {
    feed,
    feedLoading,
    feedError,
    activeReelIndex,
    comments,
    commentHasMore,
    commentsLoading,
    isCommentSheetOpen,
    activeCommentReelId,
    likingIds,
    savingIds,

    handleViewableItemsChanged,
    handleLike,
    handleSave,
    handleOpenComments,
    handleCloseComments,
    handleLoadMoreComments,
    handleSubmitComment,
    handleRefresh,
  } = useReelFeed();

  const viewabilityConfigCallbackPairs = useRef([
    {
      viewabilityConfig: VIEWABILITY_CONFIG,
      onViewableItemsChanged: handleViewableItemsChanged,
    },
  ]);

  const handleToggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  const handlePullRefresh = useCallback(async () => {
    setIsRefreshing(true);
    handleRefresh();
    setTimeout(() => setIsRefreshing(false), 1000);
  }, [handleRefresh]);

  const renderReel = useCallback(
    ({ item, index }: { item: Reel; index: number }) => (
      <ReelCard
        reel={item}
        isActive={index === activeReelIndex}
        isLiking={likingIds.includes(item.id)}
        isSaving={savingIds.includes(item.id)}
        onLike={handleLike}
        onSave={handleSave}
        onComment={handleOpenComments}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
      />
    ),
    [
      activeReelIndex,
      likingIds,
      savingIds,
      handleLike,
      handleSave,
      handleOpenComments,
      isMuted,
      handleToggleMute,
    ]
  );

  const keyExtractor = useCallback((item: Reel) => item.id.toString(), []);

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: SCREEN_HEIGHT,
      offset: SCREEN_HEIGHT * index,
      index,
    }),
    []
  );

  // Active reel comments
  const activeComments =
    activeCommentReelId !== null ? comments[activeCommentReelId] ?? [] : [];
  const activeCommentPage =
    activeCommentReelId !== null ? (comments[activeCommentReelId]?.length ?? 0) : 0;
  const activeHasMore =
    activeCommentReelId !== null ? commentHasMore[activeCommentReelId] ?? false : false;

  // Error state
  if (feedError && feed.length === 0) {
    return (
      <View className="flex-1 bg-black items-center justify-center gap-3 px-10">
        <Text className="text-white text-xl font-bold text-center">
          😕 Không thể tải Reels
        </Text>
        <Text className="text-gray-400 text-sm text-center">{feedError}</Text>
        <TouchableOpacity
          className="flex-row items-center gap-2 mt-2 bg-primary px-6 py-3 rounded-full"
          onPress={handleRefresh}
        >
          <RefreshCw size={18} color="#fff" />
          <Text className="text-white font-bold text-[15px]">Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Reel Feed */}
      <FlatList
        data={feed}
        renderItem={renderReel}
        keyExtractor={keyExtractor}
        getItemLayout={getItemLayout}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={SCREEN_HEIGHT}
        snapToAlignment="start"
        decelerationRate="fast"
        viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs.current}
        removeClippedSubviews
        maxToRenderPerBatch={3}
        windowSize={5}
        initialNumToRender={2}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handlePullRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
        ListEmptyComponent={
          feedLoading ? (
            <LoadingSkeleton />
          ) : (
            <View
              className="items-center justify-center gap-3 px-10"
              style={{ height: SCREEN_HEIGHT }}
            >
              <Text className="text-white text-xl font-bold text-center">
                🎬 Chưa có Reels nào
              </Text>
              <Text className="text-gray-400 text-sm text-center">
                Hãy theo dõi thêm người dùng để xem nội dung!
              </Text>
            </View>
          )
        }
      />

      {/* Top header overlay */}
      <View
        className="absolute top-0 left-0 right-0 z-50"
        style={{ paddingTop: insets.top }}
      >
        <ReelHeader 
          isDark={isDark} 
          onOpenCreate={() => setIsCreateModalOpen(true)}
        />
        {isMuted && (
          <View className="absolute right-4 top-16 rounded-2xl px-3 py-1 border border-white/20" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <Text className="text-white text-xs font-semibold">🔇 Đã tắt tiếng</Text>
          </View>
        )}
      </View>

      {/* Comment Sheet */}
      <ReelCommentSheet
        reelId={activeCommentReelId}
        comments={activeComments}
        commentsLoading={commentsLoading}
        hasMore={activeHasMore}
        onLoadMore={handleLoadMoreComments}
        currentPage={Math.floor(activeCommentPage / 20)}
        onSubmit={handleSubmitComment}
        onClose={handleCloseComments}
        visible={isCommentSheetOpen}
      />

      <CreateReelModal
        visible={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        isDark={isDark}
      />
    </View>
  );
}

/**
 * ======================================
 * LOADING SKELETON
 * ======================================
 */
function LoadingSkeleton() {
  const opacity = useRef(new Animated.Value(0.3)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, [opacity]);

  return (
    <View className="bg-[#111] justify-end p-4 gap-3" style={{ height: SCREEN_HEIGHT }}>
      {/* Fake video bg */}
      <Animated.View className="absolute inset-0 bg-[#222]" style={{ opacity }} />

      <View className="gap-2.5 pb-28">
        {/* Avatar + name row */}
        <View className="flex-row items-center gap-2.5">
          <Animated.View className="w-[42px] h-[42px] rounded-full bg-[#333]" style={{ opacity }} />
          <Animated.View className="w-28 h-3.5 rounded-full bg-[#333]" style={{ opacity }} />
        </View>
        {/* Caption lines */}
        <Animated.View className="w-4/5 h-3 rounded-full bg-[#333]" style={{ opacity }} />
        <Animated.View className="w-3/5 h-3 rounded-full bg-[#333]" style={{ opacity }} />
      </View>
    </View>
  );
}
