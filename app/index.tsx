import { Redirect } from "expo-router";
import { useAppSelector } from "@/features/store";

export default function Index() {
  const { isLogin } = useAppSelector((state) => state.auth);

  return <Redirect href={isLogin ? "/(app)/messages" : "/(public)/login"} />;
}
