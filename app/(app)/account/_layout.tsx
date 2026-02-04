import { Stack } from "expo-router";
import { useAppSelector } from "@/features/store";
import { Colors } from "@/constants/Colors";

export default function AccountLayout() {
  const { mode } = useAppSelector((state) => state.theme);
  const isDark = mode === "dark";

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "none",
        contentStyle: {
          backgroundColor: isDark ? Colors.background.dark : Colors.background.light,
        },
      }}
    />
  );
}
