import React, { useState, useRef } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  Animated,
  StyleSheet,
  Platform,
} from "react-native";
import { Search, PlusSquare, User, X } from "lucide-react-native";
import { router } from "expo-router";
import { Colors } from "@/constants/Colors";
import { useAppDispatch, useAppSelector } from "@/features/store";
import { setSearchQuery, setIsSearching, searchReelsThunk, fetchReelFeed, resetFeed } from "@/features/reels/reelsSlice";

interface ReelHeaderProps {
  isDark: boolean;
  onOpenCreate?: () => void;
}

export const ReelHeader = ({ isDark, onOpenCreate }: ReelHeaderProps) => {
  const dispatch = useAppDispatch();
  const { searchQuery, isSearching } = useAppSelector((state) => state.reels);
  const [localQuery, setLocalQuery] = useState(searchQuery);
  const searchAnim = useRef(new Animated.Value(0)).current;

  const handleSearch = () => {
    if (localQuery.trim()) {
      dispatch(setIsSearching(true));
      dispatch(setSearchQuery(localQuery));
      dispatch(resetFeed());
      dispatch(searchReelsThunk({ query: localQuery, page: 0 }));
    }
  };

  const clearSearch = () => {
    setLocalQuery("");
    dispatch(setSearchQuery(""));
    dispatch(setIsSearching(false));
    dispatch(resetFeed());
    dispatch(fetchReelFeed({ page: 0 }));
  };

  const toggleSearchUI = (expand: boolean) => {
    Animated.spring(searchAnim, {
      toValue: expand ? 1 : 0,
      useNativeDriver: false,
      friction: 8,
    }).start();
  };

  const inputWidth = searchAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <View className="flex-row items-center px-4 py-2 gap-3">
      {/* Title vs Search Input */}
      <View className="flex-1 relative justify-center h-10">
        <Animated.View
          style={{ width: inputWidth, opacity: searchAnim }}
          className={`absolute left-0 z-10 flex-row items-center rounded-full px-3 ${
            isDark ? "bg-white/10" : "bg-black/5"
          }`}
        >
          <Search size={18} color={isDark ? "#ccc" : "#666"} />
          <TextInput
            className={`flex-1 h-10 ml-2 text-sm ${isDark ? "text-white" : "text-midnight-velvet"}`}
            placeholder="Tìm kiếm thước phim..."
            placeholderTextColor={isDark ? "#888" : "#999"}
            value={localQuery}
            onChangeText={setLocalQuery}
            onSubmitEditing={handleSearch}
            onFocus={() => toggleSearchUI(true)}
            onBlur={() => !localQuery && toggleSearchUI(false)}
          />
          {localQuery ? (
            <TouchableOpacity onPress={clearSearch}>
              <X size={18} color={isDark ? "#ccc" : "#666"} />
            </TouchableOpacity>
          ) : null}
        </Animated.View>

        {!isSearching && localQuery === "" && (
          <Text className="text-white text-xl font-extrabold tracking-wide">
            Thước Phim
          </Text>
        )}
      </View>

      {/* Actions */}
      <View className="flex-row items-center gap-4">
        <TouchableOpacity 
           onPress={() => toggleSearchUI(true)}
           className={isSearching ? "hidden" : "flex"}
        >
          <Search size={24} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={onOpenCreate}
          className="bg-primary/20 p-2 rounded-full border border-primary/30"
        >
          <PlusSquare size={24} color={Colors.primary} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={() => router.push("/reels/manage")}
          className="rounded-full border border-white/20 overflow-hidden"
        >
          <View className="bg-white/10 p-2">
            <User size={20} color="#fff" />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};
