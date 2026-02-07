import { View, Text, ActivityIndicator } from "react-native";
import { Colors } from "@/constants/Colors";

interface SearchLoadingProps {
    isDark: boolean;
}

export function SearchLoading({ isDark }: SearchLoadingProps) {
    return (
        <View className="items-center justify-center py-8">
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text className={`mt-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                Đang tìm kiếm...
            </Text>
        </View>
    );
}
