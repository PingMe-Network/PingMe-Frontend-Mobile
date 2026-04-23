import { View, Text, TouchableOpacity, Image } from "react-native";
import { UserPlus } from "lucide-react-native";

type ContactsHeaderProps = {
  avatarUrl?: string;
  totalFriends: number;
  onToggleAddFriend: () => void;
};

export function ContactsHeader({
  avatarUrl,
  totalFriends,
  onToggleAddFriend,
}: Readonly<ContactsHeaderProps>) {
  return (
    <View className="px-5 pt-4 pb-2.5 flex-row items-center justify-between">
      <View className="flex-row items-center">
        <View className="w-11 h-11 rounded-full overflow-hidden border border-primary/20">
          <Image
            source={{ uri: avatarUrl || "https://i.pravatar.cc/150?img=11" }}
            className="w-full h-full"
          />
        </View>
        <View className="ml-3">
          <Text className="text-[22px] font-bold text-foreground tracking-tight">Danh bạ</Text>
          <Text className="text-xs text-muted-foreground mt-0.5">{totalFriends} bạn bè</Text>
        </View>
      </View>
      <TouchableOpacity
        onPress={onToggleAddFriend}
        className="h-10 px-3 rounded-full bg-primary items-center justify-center flex-row"
      >
        <UserPlus size={16} color="#FFFFFF" />
        <Text className="text-white font-bold text-[13px] ml-1.5">Thêm</Text>
      </TouchableOpacity>
    </View>
  );
}
