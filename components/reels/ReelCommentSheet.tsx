import React, {
  useCallback,
  useRef,
  useState,
  useEffect,
} from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ActivityIndicator,
  Image,
  Modal,
  Dimensions,
  PanResponder,
  ListRenderItem,
} from "react-native";
import { X, Send, Heart } from "lucide-react-native";
import type { ReelComment } from "@/types/reels";
import { Colors } from "@/constants/Colors";
import { useAppSelector } from "@/features/store";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface ReelCommentSheetProps {
  reelId: number | null;
  comments: ReelComment[];
  commentsLoading: boolean;
  hasMore: boolean;
  onLoadMore: (reelId: number, currentPage: number) => void;
  currentPage: number;
  onSubmit: (reelId: number, content: string) => Promise<void>;
  onClose: () => void;
  visible: boolean;
}

/**
 * ======================================
 * REEL COMMENT SHEET
 * ======================================
 */
export default function ReelCommentSheet({
  reelId,
  comments,
  commentsLoading,
  hasMore,
  onLoadMore,
  currentPage,
  onSubmit,
  onClose,
  visible,
}: Readonly<ReelCommentSheetProps>) {
  const { mode } = useAppSelector((state) => state.theme);
  const isDark = mode === "dark";

  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setIsMounted(true);
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 60,
          friction: 10,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: SCREEN_HEIGHT,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setIsMounted(false);
      });
    }
  }, [visible, translateY, backdropOpacity]);

  // Swipe down to close
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => g.dy > 5,
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) {
          translateY.setValue(g.dy);
        }
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 100 || g.vy > 0.5) {
          onClose();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 60,
            friction: 10,
          }).start();
        }
      },
    })
  ).current;

  const handleSubmit = useCallback(async () => {
    if (!reelId || !commentText.trim() || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit(reelId, commentText.trim());
      setCommentText("");
      inputRef.current?.blur();
    } finally {
      setSubmitting(false);
    }
  }, [reelId, commentText, submitting, onSubmit]);

  const handleLoadMore = useCallback(() => {
    if (!reelId || !hasMore || commentsLoading) return;
    onLoadMore(reelId, currentPage);
  }, [reelId, hasMore, commentsLoading, onLoadMore, currentPage]);

  const renderComment: ListRenderItem<ReelComment> = useCallback(
    ({ item }) => (
      <CommentItem comment={item} isDark={isDark} />
    ),
    [isDark]
  );

  const renderFooter = useCallback(() => {
    if (!commentsLoading || comments.length === 0) return null;
    return (
      <View className="py-4 items-center">
        <ActivityIndicator size="small" color={Colors.primary} />
      </View>
    );
  }, [commentsLoading, comments.length]);

  const renderEmpty = useCallback(() => {
    if (commentsLoading) {
      return (
        <View className="py-10 items-center">
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      );
    }
    return (
      <View className="py-10 items-center px-6">
        <Text className={`text-sm text-center ${isDark ? "text-gray-400" : "text-gray-500"}`}>
          Chưa có bình luận nào. Hãy là người đầu tiên! 💬
        </Text>
      </View>
    );
  }, [commentsLoading, isDark]);

  if (!isMounted) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <Animated.View
        className="absolute inset-0 bg-black/60"
        style={{ opacity: backdropOpacity }}
      >
        <TouchableOpacity className="flex-1" onPress={onClose} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View
        className={`absolute bottom-0 left-0 right-0 rounded-t-3xl overflow-hidden ${
          isDark ? "bg-midnight-velvet" : "bg-white"
        }`}
        style={[{ height: SCREEN_HEIGHT * 0.7 }, { transform: [{ translateY }] }]}
      >
        {/* Drag handle */}
        <View {...panResponder.panHandlers} className="py-3 items-center">
          <View className="w-10 h-1 rounded-full bg-primary" />
        </View>

        {/* Header */}
        <View
          className={`flex-row items-center justify-between px-4 pb-3 border-b ${
            isDark ? "border-white/10" : "border-gray-100"
          }`}
        >
          <View className="w-8" />
          <Text className={`text-base font-bold ${isDark ? "text-white" : "text-midnight-velvet"}`}>
            Bình luận
          </Text>
          <TouchableOpacity onPress={onClose} className="p-1">
            <X size={20} color={isDark ? "#fff" : "#333"} />
          </TouchableOpacity>
        </View>

        {/* Comment List */}
        <FlatList
          data={comments}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderComment}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8 }}
          showsVerticalScrollIndicator={false}
          className="flex-1"
        />

        {/* Input */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
        >
          <View
            className={`flex-row items-end gap-3 px-4 py-3 border-t ${
              isDark
                ? "bg-midnight-velvet border-white/10"
                : "bg-white border-gray-100"
            }`}
          >
            <TextInput
              ref={inputRef}
              className={`flex-1 min-h-[40px] max-h-[100px] rounded-full px-4 py-2.5 text-sm ${
                isDark
                  ? "bg-white/10 text-white"
                  : "bg-gray-100 text-midnight-velvet"
              }`}
              placeholder="Thêm bình luận..."
              placeholderTextColor={isDark ? "#666" : "#aaa"}
              value={commentText}
              onChangeText={setCommentText}
              multiline
              maxLength={500}
              returnKeyType="send"
              onSubmitEditing={handleSubmit}
            />
            <TouchableOpacity
              className={`w-10 h-10 rounded-full items-center justify-center bg-primary ${
                (!commentText.trim() || submitting) ? "opacity-40" : "opacity-100"
              }`}
              onPress={handleSubmit}
              disabled={!commentText.trim() || submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Send size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Animated.View>
    </Modal>
  );
}

/**
 * ======================================
 * COMMENT ITEM
 * ======================================
 */
function CommentItem({
  comment,
  isDark,
}: {
  comment: ReelComment;
  isDark: boolean;
}) {
  const [liked, setLiked] = useState(!!comment.myReaction);
  const heartScale = useRef(new Animated.Value(1)).current;

  const handleLike = useCallback(() => {
    Animated.sequence([
      Animated.spring(heartScale, { toValue: 1.4, useNativeDriver: true, speed: 40 }),
      Animated.spring(heartScale, { toValue: 1, useNativeDriver: true, speed: 40 }),
    ]).start();
    setLiked((prev) => !prev);
  }, [heartScale]);

  const formatTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Vừa xong";
    if (mins < 60) return `${mins} phút`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} giờ`;
    return `${Math.floor(hours / 24)} ngày`;
  };

  const pinnedStyle = comment.isPinned ? "bg-primary/5 rounded-xl px-2 mb-1" : "";

  return (
    <View className={`flex-row gap-2.5 py-2.5 ${pinnedStyle}`}>
      {/* Avatar */}
      <View className="relative">
        {comment.userAvatarUrl ? (
          <Image
            source={{ uri: comment.userAvatarUrl }}
            className="w-9 h-9 rounded-full"
          />
        ) : (
          <View className="w-9 h-9 rounded-full bg-primary items-center justify-center">
            <Text className="text-white font-bold text-sm">
              {comment.userName.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        {comment.isPinned && (
          <View className="absolute -bottom-1 -right-1">
            <Text className="text-xs">📌</Text>
          </View>
        )}
      </View>

      {/* Comment body */}
      <View className="flex-1 gap-0.5">
        <Text className={`font-bold text-[13px] ${isDark ? "text-white" : "text-midnight-velvet"}`}>
          @{comment.userName}
          {comment.isReelOwner && (
            <Text className="text-primary font-semibold text-xs"> · Tác giả</Text>
          )}
        </Text>
        <Text className={`text-[13px] leading-[18px] ${isDark ? "text-gray-300" : "text-gray-700"}`}>
          {comment.content}
        </Text>
        <View className="flex-row gap-3 mt-0.5">
          <Text className="text-[11px] text-gray-400">{formatTime(comment.createdAt)}</Text>
          <TouchableOpacity>
            <Text className="text-[12px] text-primary font-semibold">Trả lời</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Like */}
      <TouchableOpacity className="items-center gap-0.5 pt-1" onPress={handleLike}>
        <Animated.View style={{ transform: [{ scale: heartScale }] }}>
          <Heart
            size={16}
            color={liked ? Colors.primary : "#aaa"}
            fill={liked ? Colors.primary : "transparent"}
            strokeWidth={liked ? 0 : 2}
          />
        </Animated.View>
        {comment.reactionCount > 0 && (
          <Text className={`text-[11px] ${liked ? "text-primary" : "text-gray-400"}`}>
            {comment.reactionCount}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}
