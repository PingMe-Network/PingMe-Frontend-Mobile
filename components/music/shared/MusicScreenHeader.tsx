import { View, Text, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

export type MusicScreenHeaderProps = {
    title: string;
    isDark: boolean;
    rightIconName?: IconName;
    onRightPress?: () => void;
    rightIconColor?: string;
};

export function MusicScreenHeader({
    title,
    isDark,
    rightIconName,
    onRightPress,
    rightIconColor,
}: Readonly<MusicScreenHeaderProps>) {
    const defaultIconColor = isDark ? "white" : "#1f2937";

    return (
        <View className="flex-row items-center justify-between px-4 py-2">
            <View className="flex-row items-center gap-2">
                <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
                    <Ionicons
                        name="chevron-back"
                        size={24}
                        color={defaultIconColor}
                    />
                </TouchableOpacity>
                <Text className={`text-lg font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                    {title}
                </Text>
            </View>
            {rightIconName && (
                <TouchableOpacity onPress={onRightPress} className="p-2 -mr-2">
                    <Ionicons
                        name={rightIconName}
                        size={rightIconName === "add-circle" ? 28 : 24}
                        color={rightIconColor ?? defaultIconColor}
                    />
                </TouchableOpacity>
            )}
        </View>
    );
}
