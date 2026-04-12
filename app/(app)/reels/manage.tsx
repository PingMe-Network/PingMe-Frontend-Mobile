import React, { useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft, Play, Trash2, Video } from "lucide-react-native";
import { router } from "expo-router";
import { useMyReels } from "@/hooks/useMyReels";
import { useAppSelector } from "@/features/store";
import { Colors } from "@/constants/Colors";
import type { Reel } from "@/types/reels";

const { width } = Dimensions.get("window");
const COLUMN_COUNT = 3;
const ITEM_SIZE = width / COLUMN_COUNT;

export default function MyReelsScreen() {
  const insets = useSafeAreaInsets();
  const { mode } = useAppSelector((state) => state.theme);
  const isDark = mode === "dark";
  
  const { 
    myReels, 
    myReelsLoading, 
    refreshMyReels, 
    loadMore, 
    handleDelete 
  } = useMyReels();

  const renderItem = useCallback(({ item }: { item: Reel }) => (
    <View 
      style={{ width: ITEM_SIZE, height: ITEM_SIZE * 1.5 }}
      className="p-[1px] relative"
    >
      <TouchableOpacity 
        className="flex-1 bg-gray-200 overflow-hidden"
        onPress={() => router.push(`/(app)/reels?id=${item.id}`)}
      >
        {/* Placeholder for video thumbnail since we're using raw videos */}
        <View className="flex-1 bg-midnight-velvet/80 items-center justify-center">
            <Video size={40} color="#fff" opacity={0.3} />
        </View>

        {/* Info Overlay */}
        <View className="absolute bottom-2 left-2 flex-row items-center">
          <Play size={10} color="#fff" fill="#fff" />
          <Text className="text-white text-[10px] ml-1 font-bold">
            {item.viewCount}
          </Text>
        </View>

        {/* Delete action */}
        <TouchableOpacity 
          className="absolute top-2 right-2 bg-black/40 p-1.5 rounded-full"
          onPress={() => handleDelete(item.id)}
        >
          <Trash2 size={14} color="#ff4444" />
        </TouchableOpacity>
      </TouchableOpacity>
    </View>
  ), [handleDelete]);

  return (
    <View className={`flex-1 ${isDark ? "bg-midnight-velvet" : "bg-white"}`}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      
      {/* Header */}
      <View 
        style={{ paddingTop: insets.top }}
        className={`flex-row items-center px-4 py-3 border-b ${isDark ? "border-white/10" : "border-gray-100"}`}
      >
        <TouchableOpacity onPress={() => router.back()} className="p-1">
          <ChevronLeft size={28} color={isDark ? "#fff" : "#333"} />
        </TouchableOpacity>
        <Text className={`flex-1 text-center text-lg font-bold mr-8 ${isDark ? "text-white" : "text-midnight-velvet"}`}>
          Thước phim của tôi
        </Text>
      </View>

      {/* Grid List */}
      <FlatList
        data={myReels}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        numColumns={COLUMN_COUNT}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={refreshMyReels}
            tintColor={Colors.primary}
          />
        }
        ListEmptyComponent={
          myReelsLoading ? (
            <View className="flex-1 items-center justify-center mt-20">
              <ActivityIndicator color={Colors.primary} size="large" />
            </View>
          ) : (
            <View className="flex-1 items-center justify-center mt-20 px-10">
              <Video size={60} color={isDark ? "#333" : "#ddd"} />
              <Text className={`text-center mt-4 text-base font-bold ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                Bạn chưa đăng thước phim nào
              </Text>
              <TouchableOpacity 
                className="mt-6 bg-primary px-8 py-3 rounded-full"
                onPress={() => {/* Open Create Modal */}}
              >
                <Text className="text-white font-bold">Tạo video đầu tiên</Text>
              </TouchableOpacity>
            </View>
          )
        }
      />
    </View>
  );
}
