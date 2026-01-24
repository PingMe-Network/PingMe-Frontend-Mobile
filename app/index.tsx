import { Redirect } from "expo-router";
import { useAppSelector } from "@/features/store";

export default function Index() {
  const { isLoggedIn, accessToken } = useAppSelector((state) => state.auth);

  // Redirect based on auth state
  if (isLoggedIn || accessToken) {
    return <Redirect href="/(app)/messages" />;
  }

  return <Redirect href="/(public)/login" />;
}
