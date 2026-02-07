import { View, Text, TouchableOpacity } from "react-native";

interface LoadMoreButtonProps {
    onPress: () => void;
    remainingCount: number;
    itemsPerPage: number;
    label: string;
}

export function LoadMoreButton({ onPress, remainingCount, itemsPerPage, label }: LoadMoreButtonProps) {
    const count = Math.min(itemsPerPage, remainingCount);

    return (
        <TouchableOpacity
            onPress={onPress}
            className="py-3 items-center"
        >
            <Text className="text-base font-semibold text-primary">
                Xem thêm {count} {label}
            </Text>
        </TouchableOpacity>
    );
}
