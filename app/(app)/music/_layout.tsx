import { Stack } from "expo-router";
import { View } from "react-native";
import { MiniPlayer, FullPlayer } from "@/components/music";
import { useTabBarHeight } from "@/hooks/useTabBarHeight";

export default function MusicLayout() {
  const tabBarHeight = useTabBarHeight();

  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }} />

      <View style={{ position: "absolute", bottom: tabBarHeight, left: 0, right: 0 }}>
        <MiniPlayer />
      </View>

      <FullPlayer />
    </View>
  );
}
