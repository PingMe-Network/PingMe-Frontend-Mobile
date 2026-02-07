import { View, TouchableOpacity, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

interface SearchHeaderProps {
    searchQuery: string;
    onSearchChange: (text: string) => void;
    onClear: () => void;
    isDark: boolean;
}

export function SearchHeader({ searchQuery, onSearchChange, onClear, isDark }: Readonly<SearchHeaderProps>) {
    return (
        <View className={`flex-row items-center px-4 py-3 ${isDark ? "bg-background-dark" : "bg-background-light"}`}>
            {/* Back Button */}
            <TouchableOpacity
                onPress={() => router.back()}
                className="mr-3"
            >
                <Ionicons
                    name="arrow-back"
                    size={24}
                    color={isDark ? "#ffffff" : "#111827"}
                />
            </TouchableOpacity>

            {/* Search Input */}
            <View
                className={`flex-1 flex-row items-center px-4 py-2.5 rounded ${isDark ? "bg-gray-800" : "bg-gray-100"}`}
            >
                <Ionicons
                    name="search"
                    size={20}
                    color={isDark ? "#9CA3AF" : "#6B7280"}
                />
                <TextInput
                    value={searchQuery}
                    onChangeText={onSearchChange}
                    placeholder="Bạn muốn nghe gì?"
                    placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
                    className={`flex-1 ml-3 text-base ${isDark ? "text-white" : "text-gray-900"}`}
                    autoFocus={false}
                />
            </View>

            {/* Clear Button */}
            {searchQuery.length > 0 && (
                <TouchableOpacity
                    onPress={onClear}
                    className="ml-3"
                >
                    <Ionicons
                        name="close"
                        size={24}
                        color={isDark ? "#ffffff" : "#111827"}
                    />
                </TouchableOpacity>
            )}
        </View>
    );
}
