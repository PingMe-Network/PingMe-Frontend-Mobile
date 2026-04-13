import { View, Text, TextInput, TouchableOpacity, Image, ActivityIndicator } from "react-native";
import { Search, Users } from "lucide-react-native";
import type { UserSummaryResponse } from "@/types/common/userSummary";

type AddFriendPanelProps = {
  visible: boolean;
  searchEmail: string;
  setSearchEmail: (value: string) => void;
  isSearching: boolean;
  searchResult: UserSummaryResponse | null;
  currentUserId?: number;
  onSearch: () => void;
  onSendInvitation: (targetUserId: number) => void;
  iconColor: string;
};

export function AddFriendPanel({
  visible,
  searchEmail,
  setSearchEmail,
  isSearching,
  searchResult,
  currentUserId,
  onSearch,
  onSendInvitation,
  iconColor,
}: Readonly<AddFriendPanelProps>) {
  if (!visible) return null;

  const friendshipStatusLabel =
    searchResult?.friendshipSummary?.friendshipStatus === "ACCEPTED"
      ? "Đã là bạn"
      : "Đang chờ";
  const canSendInvitation =
    !!searchResult &&
    !searchResult.friendshipSummary &&
    searchResult.id !== currentUserId;

  return (
    <View className="mx-6 mb-2.5 p-4 rounded-xl bg-card border border-border shadow-sm">
      <Text className="text-[14px] font-bold text-foreground mb-3">Thêm bạn bè</Text>
      <View className="flex-row gap-2">
        <View className="flex-1 flex-row items-center h-[42px] px-3.5 rounded-[16px] bg-muted/60 border border-border">
          <Search size={16} className="text-muted-foreground" color="#71717A" />
          <TextInput
            className="flex-1 ml-2 text-[13px] text-foreground"
            placeholder="Nhập email..."
            placeholderTextColor="#71717A"
            value={searchEmail}
            onChangeText={setSearchEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            onSubmitEditing={onSearch}
          />
        </View>
        <TouchableOpacity
          onPress={onSearch}
          disabled={isSearching || !searchEmail.trim()}
          className={`h-[42px] px-4.5 rounded-xl items-center justify-center ${
            searchEmail.trim() ? "bg-primary" : "bg-primary/50"
          }`}
        >
          {isSearching ? (
            <ActivityIndicator size={14} color="#fff" />
          ) : (
            <Text className="text-primary-foreground font-bold text-[13px]">Tìm</Text>
          )}
        </TouchableOpacity>
      </View>

      {searchResult && (
        <View className="mt-3 flex-row items-center pt-3 border-t border-border">
          {searchResult.avatarUrl ? (
            <Image
              source={{ uri: searchResult.avatarUrl }}
              className="w-10 h-10 rounded-full border-[1.5px] border-primary/20"
            />
          ) : (
            <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center border border-primary/10">
              <Users size={16} className="text-primary" color={iconColor} />
            </View>
          )}
          <View className="flex-1 ml-3">
            <Text className="font-semibold text-[14px] text-foreground" numberOfLines={1}>
              {searchResult.name}
            </Text>
            <Text className="text-[12px] text-muted-foreground">{searchResult.email}</Text>
          </View>
          {searchResult?.friendshipSummary && (
            <View className="bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20">
              <Text className="text-[11px] font-semibold text-primary">{friendshipStatusLabel}</Text>
            </View>
          )}
          {canSendInvitation && (
            <TouchableOpacity
              onPress={() => onSendInvitation(searchResult.id)}
              className="bg-primary px-4 py-2 rounded-full shadow-sm"
            >
              <Text className="text-primary-foreground text-[12px] font-bold">Kết bạn</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}
