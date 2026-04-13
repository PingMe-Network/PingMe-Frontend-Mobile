import { View, Text, TouchableOpacity, Image, ActivityIndicator } from "react-native";
import { Users, UserMinus, Check, X, Clock, MessageCircle } from "lucide-react-native";
import type { UserSummaryResponse } from "@/types/common/userSummary";
import type { TabId } from "./types";

type UserCardProps = {
  item: UserSummaryResponse;
  activeTab: TabId;
  iconColor: string;
  isProcessing: boolean;
  onStartChat: (userId: number) => void;
  onRemoveFriend: (friendshipId: number) => void;
  onAccept: (friendshipId: number) => void;
  onReject: (friendshipId: number) => void;
  onCancel: (friendshipId: number) => void;
};

export function UserCard({
  item,
  activeTab,
  iconColor,
  isProcessing,
  onStartChat,
  onRemoveFriend,
  onAccept,
  onReject,
  onCancel,
}: Readonly<UserCardProps>) {
  const friendshipId = item.friendshipSummary?.id;
  const isOnline = item.status === "ONLINE";

  return (
    <View className="flex-row items-center py-3 px-4 mb-2 mx-4 bg-card border border-border rounded-custom shadow-sm">
      <View className="relative">
        {item.avatarUrl ? (
          <Image
            source={{ uri: item.avatarUrl }}
            className="w-12 h-12 rounded-full border-[1.5px] border-primary/20"
          />
        ) : (
          <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center border border-primary/10">
            <Users size={20} className="text-primary" color={iconColor} />
          </View>
        )}
        {activeTab === "friends" && isOnline && (
          <View className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-[2.5px] border-card z-10" />
        )}
      </View>

      <View className="flex-1 ml-3">
        <Text className="font-bold text-[14px] text-foreground" numberOfLines={1}>
          {item.name}
        </Text>
        <Text className="text-[12px] text-muted-foreground mt-0.5" numberOfLines={1}>
          {item.email}
        </Text>
      </View>

      <View className="flex-row items-center gap-2 ml-2">
        {activeTab === "friends" && (
          <>
            <TouchableOpacity
              onPress={() => onStartChat(item.id)}
              className="w-8 h-8 rounded-full bg-primary/10 items-center justify-center border border-primary/20"
            >
              <MessageCircle size={15} className="text-primary" color={iconColor} />
            </TouchableOpacity>
            {friendshipId && (
              <TouchableOpacity
                onPress={() => onRemoveFriend(friendshipId)}
                disabled={isProcessing}
                className="w-8 h-8 rounded-full bg-red-500/10 items-center justify-center border border-red-500/20"
              >
                {isProcessing ? (
                  <ActivityIndicator size={12} color="#EF4444" />
                ) : (
                  <UserMinus size={14} color="#EF4444" />
                )}
              </TouchableOpacity>
            )}
          </>
        )}

        {activeTab === "received" && friendshipId && (
          <>
            <TouchableOpacity
              onPress={() => onAccept(friendshipId)}
              disabled={isProcessing}
              className="w-9 h-9 rounded-full bg-green-500/10 border border-green-500/30 items-center justify-center"
            >
              {isProcessing ? (
                <ActivityIndicator size={12} color="#22C55E" />
              ) : (
                <Check size={16} color="#22C55E" />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onReject(friendshipId)}
              disabled={isProcessing}
              className="w-9 h-9 rounded-full bg-red-500/10 border border-red-500/20 items-center justify-center"
            >
              <X size={16} color="#EF4444" />
            </TouchableOpacity>
          </>
        )}

        {activeTab === "sent" && (
          <View className="flex-row items-center gap-2">
            <View className="flex-row items-center bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
              <Clock size={11} color="#F59E0B" />
              <Text className="text-[11px] text-amber-500 font-semibold ml-1">Chờ</Text>
            </View>
            {friendshipId && (
              <TouchableOpacity
                onPress={() => onCancel(friendshipId)}
                disabled={isProcessing}
                className="w-8 h-8 rounded-full bg-red-500/10 items-center justify-center border border-red-500/20"
              >
                {isProcessing ? (
                  <ActivityIndicator size={12} color="#EF4444" />
                ) : (
                  <X size={14} color="#EF4444" />
                )}
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </View>
  );
}
