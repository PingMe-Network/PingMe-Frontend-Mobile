import { Text, TouchableOpacity, ActivityIndicator, type TouchableOpacityProps } from "react-native";

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

    const baseStyle = "p-4 rounded-xl flex-row justify-center items-center";
    const bgStyle = isPrimary
        ? (isLoading || disabled ? "bg-blue-400" : "bg-blue-600")
        : "bg-transparent border border-blue-600";

    const textStyle = isPrimary ? "text-white" : "text-blue-600";

    return (
        <TouchableOpacity
            className={`${baseStyle} ${bgStyle} ${className || ""}`}
            disabled={isLoading || disabled}
            activeOpacity={0.8}
            {...props}
        >
            {isLoading ? (
                <ActivityIndicator color={isPrimary ? "#fff" : "#2563EB"} />
            ) : (
                <Text className={`${textStyle} font-semibold text-lg`}>{title}</Text>
            )}
        </TouchableOpacity>
    );
};
