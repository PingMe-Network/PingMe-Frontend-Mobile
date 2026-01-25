import { View, Platform } from "react-native";

interface TabBarBackgroundProps {
    iosBlurClass: string;
}

export const TabBarBackground = ({ iosBlurClass }: TabBarBackgroundProps) => {
    if (Platform.OS === "ios") {
        return <View className={`flex-1 ${iosBlurClass}`} />;
    }
    return null;
};
