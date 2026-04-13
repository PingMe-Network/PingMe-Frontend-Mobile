import { View, Text, TouchableOpacity, Image } from "react-native";
import { UserPlus } from "lucide-react-native";

type ContactsHeaderProps = {
  avatarUrl?: string;
  totalFriends: number;
  onToggleAddFriend: () => void;
  iconColor: string;
};

export function ContactsHeader({
  avatarUrl,
  totalFriends,
  onToggleAddFriend,
  iconColor,
}: Readonly<ContactsHeaderProps>) {
  return (
    <View className="px-6 pt-5 pb-2 flex-row items-center justify-between">
      <View className="flex-row items-center">
        <View className="w-11 h-11 rounded-full overflow-hidden border-2 border-primary/30">
          <Image
            source={{ uri: avatarUrl || "https://i.pravatar.cc/150?img=11" }}
            className="w-full h-full"
          />
        </View>
        <View className="ml-3">
          <Text className="text-2xl font-black text-foreground tracking-tight">Danh bạ</Text>
          <Text className="text-xs text-muted-foreground mt-0.5">{totalFriends} bạn bè</Text>
        </View>
      </View>
      <TouchableOpacity
        onPress={onToggleAddFriend}
        className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 items-center justify-center"
      >
        <UserPlus size={20} className="text-primary" color={iconColor} />
      </TouchableOpacity>
    </View>
  );
}
