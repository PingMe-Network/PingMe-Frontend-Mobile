import { Stack } from "expo-router";
import { View } from "react-native";
import { MiniPlayer, FullPlayer } from "@/components/music";
import { useTabBarHeight } from "@/hooks/useTabBarHeight";
import { useAppSelector } from "@/features/store";
import { Colors } from "@/constants/Colors";

export default function MusicLayout() {
  const tabBarHeight = useTabBarHeight();
  const { mode } = useAppSelector((state) => state.theme);
  const isDark = mode === "dark";

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? Colors.background.dark : Colors.background.light }}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "none",
          contentStyle: {
            backgroundColor: isDark ? Colors.background.dark : Colors.background.light,
          },
        }}
      />

      <View style={{ position: "absolute", bottom: tabBarHeight, left: 0, right: 0 }}>
        <MiniPlayer />
      </View>

      <FullPlayer />
    </View>
  );
}
