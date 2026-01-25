import { Text, TouchableOpacity, ActivityIndicator, type TouchableOpacityProps } from "react-native";
import { Colors } from "@/constants/Colors";

interface ButtonProps extends TouchableOpacityProps {
    title: string;
    isLoading?: boolean;
    variant?: "primary" | "outline";
}

export const Button = ({
    title,
    isLoading = false,
    variant = "primary",
    className,
    disabled,
    ...props
}: ButtonProps) => {
    const isPrimary = variant === "primary";

    const baseStyle = "p-4 rounded-custom flex-row justify-center items-center";
    let bgStyle;
    if (isPrimary) {
        bgStyle = isLoading || disabled ? "bg-primary/70" : "bg-primary";
    } else {
        bgStyle = "bg-transparent border border-primary";
    }

    const textStyle = isPrimary ? "text-white" : "text-primary";

    return (
        <TouchableOpacity
            className={`${baseStyle} ${bgStyle} ${className || ""}`}
            disabled={isLoading || disabled}
            activeOpacity={0.8}
            {...props}
        >
            {isLoading ? (
                <ActivityIndicator color={isPrimary ? Colors.background.light : Colors.primary} />
            ) : (
                <Text className={`${textStyle} font-semibold text-lg`}>{title}</Text>
            )}
        </TouchableOpacity>
    );
};
