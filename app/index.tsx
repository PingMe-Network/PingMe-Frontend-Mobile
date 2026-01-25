import { Redirect } from "expo-router";
import { useAppSelector } from "@/features/store";

export default function Index() {
  const { isLoggedIn } = useAppSelector((state) => state.auth);

  if (isLoggedIn) {
    return <Redirect href="/(app)/messages" />;
  }

  return <Redirect href="/(public)/login" />;
}
