import { Stack } from "expo-router";
import { useAppSelector } from "@/features/store";

export default function MessagesLayout() {
  const { mode } = useAppSelector((state) => state.theme);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="[roomId]" />
    </Stack>
  );
}
