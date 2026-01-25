import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, type TextInputProps } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";

interface InputFieldProps extends TextInputProps {
    label?: string;
    error?: string | null;
    isPassword?: boolean;
}

export const InputField = ({
    label,
    error,
    isPassword = false,
    className,
    ...props
}: InputFieldProps) => {
    const [showPassword, setShowPassword] = useState(false);

    // Nếu là password field thì secureTextEntry phụ thuộc vào showPassword (trừ khi props truyền cứng)
    const isSecure = isPassword ? !showPassword : props.secureTextEntry;

    return (
        <View className="mb-4">
            {label && <Text className="mb-2 font-medium text-gray-300">{label}</Text>}

            <View className="relative">
                <TextInput
                    className={`border rounded-custom p-4 bg-gray-900 text-white text-base ${error ? "border-red-500 bg-red-900/10" : "border-gray-700"
                        } ${isPassword ? "pr-12" : ""} ${className || ""}`}
                    placeholderTextColor={Colors.text.gray}
                    secureTextEntry={isSecure}
                    {...props}
                />

                {isPassword && (
                    <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-4"
                        activeOpacity={0.7}
                    >
                        <Ionicons
                            name={showPassword ? "eye-off" : "eye"}
                            size={24}
                            color={Colors.text.gray}
                        />
                    </TouchableOpacity>
                )}
            </View>

            {error && <Text className="mt-1 text-sm text-red-400">{error}</Text>}
        </View>
    );
};
