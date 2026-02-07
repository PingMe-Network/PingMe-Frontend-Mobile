import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface SearchEmptyStateProps {
    isDark: boolean;
}

export function SearchEmptyState({ isDark }: Readonly<SearchEmptyStateProps>) {
    return (
        <View className="items-center justify-center py-8 px-4">
            <Ionicons
                name="search-outline"
                size={64}
                color={isDark ? "#4B5563" : "#9CA3AF"}
            />
            <Text
                className={`text-lg font-semibold mt-4 ${isDark ? "text-white" : "text-gray-900"}`}
            >
                Không tìm thấy kết quả
            </Text>
            <Text className={`text-center mt-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                Hãy thử với từ khóa khác
            </Text>
        </View>
    );
}
