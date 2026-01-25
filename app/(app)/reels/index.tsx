import { View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppSelector } from "@/features/store";
import { useTabBarHeight } from "@/hooks/useTabBarHeight";

export default function ReelsScreen() {
  const { mode } = useAppSelector((state) => state.theme);
  const isDark = mode === "dark";
  const tabBarHeight = useTabBarHeight();

  return (
    <SafeAreaView className={`flex-1 ${isDark ? "bg-background-dark" : "bg-background-light"}`}>
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
          <Text className={`text-2xl font-bold mb-2 ${isDark ? "text-white" : "text-midnight-velvet"}`}>
            Thuoc Phim
          </Text>
          <Text className={`text-center ${isDark ? "text-gray-400" : "text-gray-500"}`}>
            Video ngan se hien thi o day
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
