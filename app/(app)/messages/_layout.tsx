import { Stack } from "expo-router";

export default function MessagesLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="[roomId]" />
      <Stack.Screen name="call/[roomId]" options={{ animation: "slide_from_bottom" }} />
    </Stack>
  );
}
