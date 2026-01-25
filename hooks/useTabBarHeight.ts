import { useSafeAreaInsets } from "react-native-safe-area-context";

export function useTabBarHeight() {
  const insets = useSafeAreaInsets();
  const bottomPadding = insets.bottom > 0 ? insets.bottom : 20;
  return 65 + bottomPadding;
}
