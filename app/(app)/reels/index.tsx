import { View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Film } from "lucide-react-native";
import { useTabBarHeight } from "@/hooks/useTabBarHeight";

export default function ReelsScreen() {
  const tabBarHeight = useTabBarHeight();

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: tabBarHeight + 20 }}
        className="px-6"
        showsVerticalScrollIndicator={false}
        decelerationRate="fast"
        scrollEventThrottle={16}
        bounces={true}
        overScrollMode="never"
      >
        <View className="flex-1 items-center justify-center">
            <View className="w-20 h-20 rounded-full bg-primary/10 items-center justify-center mb-6 border-2 border-primary/20">
                <Film size={36} color="#c026d3" />
            </View>
          <Text className="text-2xl font-black mb-2 text-foreground tracking-tight">
            Thước phim
          </Text>
          <Text className="text-center text-muted-foreground pb-12">
            Tính năng đang được phát triển.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
