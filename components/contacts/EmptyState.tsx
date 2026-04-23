import { View, Text } from "react-native";
import { Users } from "lucide-react-native";

type EmptyStateProps = {
  message: string;
  iconColor: string;
};

export function EmptyState({ message, iconColor }: Readonly<EmptyStateProps>) {
  return (
    <View className="items-center justify-center mt-14 px-8">
      <View className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 items-center justify-center mb-3">
        <Users size={26} className="text-primary" color={iconColor} />
      </View>
      <Text className="text-[14px] font-semibold text-foreground mb-1">{message}</Text>
      <Text className="text-[12px] text-muted-foreground text-center">
        Bấm nút thêm để kết bạn mới nhé
      </Text>
    </View>
  );
}
