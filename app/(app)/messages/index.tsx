import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Image, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Search, Plus, MoreHorizontal } from "lucide-react-native";
import { useAppSelector } from "@/features/store";
import { useTabBarHeight } from "@/hooks/useTabBarHeight";

const DUMMY_CHATS = [
  { id: '1', name: 'Nhóm Thiết Kế', lastMessage: 'Đã cập nhật hệ thống màu', time: '10:30', unread: 2, isOnline: true, avatar: 'https://i.pravatar.cc/150?img=33' },
  { id: '2', name: 'Nguyễn Văn A', lastMessage: 'Ok bạn nhé 👍', time: 'Hôm qua', unread: 0, isOnline: false, avatar: 'https://i.pravatar.cc/150?img=12' },
  { id: '3', name: 'Trần Thị B', lastMessage: 'Cuối tuần đi cafe không?', time: 'T6', unread: 5, isOnline: true, avatar: 'https://i.pravatar.cc/150?img=5' },
  { id: '4', name: 'DevOps Team', lastMessage: 'Server staging deploy xong', time: '11:00', unread: 0, isOnline: false, avatar: 'https://i.pravatar.cc/150?img=14' },
  { id: '5', name: 'Bảo Anh', lastMessage: 'Gửi mình link design PingMe', time: '14:20', unread: 1, isOnline: true, avatar: 'https://i.pravatar.cc/150?img=9' },
  { id: '6', name: 'Team Marketing', lastMessage: 'Kế hoạch event tuần tới', time: 'T2', unread: 0, isOnline: true, avatar: 'https://i.pravatar.cc/150?img=41' },
  { id: '7', name: 'Sếp', lastMessage: 'Báo cáo tháng này đâu em?', time: '09:00', unread: 1, isOnline: true, avatar: 'https://i.pravatar.cc/150?img=68' },
];

export default function MessagesScreen() {
  const { mode } = useAppSelector((state) => state.theme);
  const { userSession } = useAppSelector((state) => state.auth);
  const isDark = mode === "dark";
  const tabBarHeight = useTabBarHeight();
  
  const [searchQuery, setSearchQuery] = useState("");

  const bgClass = isDark ? "bg-background-dark" : "bg-background-light";
  const textTitleClass = isDark ? "text-white" : "text-gray-900";
  const textSubClass = isDark ? "text-gray-400" : "text-gray-500";
  const searchBgClass = isDark ? "bg-gray-900 border border-gray-800" : "bg-white border border-gray-100 shadow-sm";
  const iconColor = isDark ? "#9CA3AF" : "#6B7280";
  
  const renderItem = ({ item }: { item: typeof DUMMY_CHATS[0] }) => {
    return (
      <TouchableOpacity 
        activeOpacity={0.7}
        className={`flex-row items-center py-3 px-4 mb-3 rounded-2xl mx-6 ${isDark ? "bg-[#252123]" : "bg-white border border-gray-50 shadow-sm"}`}
      >
        <View className="relative">
          <Image source={{ uri: item.avatar }} className="w-14 h-14 rounded-full bg-gray-200" />
          {item.isOnline && (
            <View className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2" style={{ borderColor: isDark ? '#252123' : '#fff' }} />
          )}
        </View>
        <View className="flex-1 ml-4 justify-center">
          <View className="flex-row justify-between items-center mb-1">
            <Text className={`font-semibold text-[15px] ${textTitleClass}`} numberOfLines={1}>{item.name}</Text>
            <Text className={`text-xs ${item.unread > 0 ? "text-primary font-bold" : textSubClass}`}>{item.time}</Text>
          </View>
          <View className="flex-row justify-between items-center">
            <Text className={`text-[13px] flex-1 mr-4 ${item.unread > 0 ? (isDark ? "text-gray-200 font-medium" : "text-gray-800 font-medium") : textSubClass}`} numberOfLines={1}>
              {item.lastMessage}
            </Text>
            {item.unread > 0 && (
              <View className="bg-primary rounded-full px-2 py-0.5 min-w-[20px] items-center justify-center">
                <Text className="text-white text-[10px] font-bold">{item.unread}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className={`flex-1 ${bgClass}`} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View className="px-6 py-4 pt-6 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <Image 
            source={{ uri: userSession?.avatarUrl || "https://i.pravatar.cc/150?img=11" }} 
            className="w-11 h-11 rounded-full bg-gray-300"
          />
          <Text className={`ml-3 text-3xl font-black tracking-tight ${textTitleClass}`}>Tin nhắn</Text>
        </View>
        <View className="flex-row gap-3">
          <TouchableOpacity className={`w-10 h-10 rounded-full items-center justify-center ${isDark ? "bg-[#252123]" : "bg-white shadow-sm border border-gray-50"}`}>
            <Plus size={22} color={isDark ? "#FFF" : "#111"} />
          </TouchableOpacity>
          <TouchableOpacity className={`w-10 h-10 rounded-full items-center justify-center ${isDark ? "bg-[#252123]" : "bg-white shadow-sm border border-gray-50"}`}>
            <MoreHorizontal size={22} color={isDark ? "#FFF" : "#111"} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View className="px-6 mb-5 mt-2">
        <View className={`flex-row items-center h-12 px-4 rounded-xl ${searchBgClass}`}>
          <Search size={20} color={iconColor} />
          <TextInput 
            className={`flex-1 ml-3 text-[15px] ${isDark ? "text-white" : "text-gray-900"}`}
            placeholder="Tìm kiếm..."
            placeholderTextColor={iconColor}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Chat List */}
      <FlatList
        data={DUMMY_CHATS.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: tabBarHeight + 20 }}
        ListEmptyComponent={
          <View className="items-center justify-center mt-10">
            <Text className={textSubClass}>Không tìm thấy cuộc trò chuyện nào</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
