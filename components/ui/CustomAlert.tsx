import { Modal, View, Text, TouchableOpacity, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";
import { useEffect, useRef } from "react";

export type AlertType = "success" | "error" | "info" | "warning";

export type CustomAlertProps = {
    visible: boolean;
    type: AlertType;
    title: string;
    message?: string;
    isDark: boolean;
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
    onCancel?: () => void;
};

const getAlertConfig = (type: AlertType) => {
    switch (type) {
        case "success":
            return {
                icon: "checkmark-circle" as const,
                color: Colors.primary,
                bgColor: Colors.primary + "20",
            };
        case "error":
            return {
                icon: "close-circle" as const,
                color: Colors.primary,
                bgColor: Colors.primary + "20",
            };
        case "warning":
            return {
                icon: "warning" as const,
                color: Colors.primary,
                bgColor: Colors.primary + "20",
            };
        case "info":
        default:
            return {
                icon: "information-circle" as const,
                color: Colors.primary,
                bgColor: Colors.primary + "20",
            };
    }
};

export function CustomAlert({
    visible,
    type,
    title,
    message,
    isDark,
    confirmText = "OK",
    cancelText,
    onConfirm,
    onCancel,
}: Readonly<CustomAlertProps>) {
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    useNativeDriver: true,
                    tension: 100,
                    friction: 8,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            scaleAnim.setValue(0);
            opacityAnim.setValue(0);
        }
    }, [visible, scaleAnim, opacityAnim]);

    const config = getAlertConfig(type);

    const handleConfirm = () => {
        onConfirm?.();
    };

    const handleCancel = () => {
        onCancel?.();
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            statusBarTranslucent
        >
            <Animated.View
                style={{ opacity: opacityAnim }}
                className="flex-1 items-center justify-center bg-black/60 px-6"
            >
                <Animated.View
                    style={{
                        transform: [{ scale: scaleAnim }],
                    }}
                    className={`w-full max-w-sm rounded-3xl p-6 ${isDark ? "bg-gray-800" : "bg-white"
                        }`}
                >
                    {/* Icon */}
                    <View className="items-center mb-4">
                        <View
                            style={{ backgroundColor: config.bgColor }}
                            className="w-16 h-16 rounded-full items-center justify-center"
                        >
                            <Ionicons
                                name={config.icon}
                                size={32}
                                color={config.color}
                            />
                        </View>
                    </View>

                    {/* Title */}
                    <Text
                        className={`text-xl font-bold text-center mb-2 ${isDark ? "text-white" : "text-gray-900"
                            }`}
                    >
                        {title}
                    </Text>

                    {/* Message */}
                    {message && (
                        <Text
                            className={`text-center mb-6 leading-5 ${isDark ? "text-gray-300" : "text-gray-600"
                                }`}
                        >
                            {message}
                        </Text>
                    )}

                    {/* Buttons */}
                    <View className="flex-row gap-3">
                        {cancelText && onCancel && (
                            <TouchableOpacity
                                onPress={handleCancel}
                                className={`flex-1 py-3 rounded-xl ${isDark ? "bg-gray-700" : "bg-gray-200"
                                    }`}
                            >
                                <Text
                                    className={`text-center font-semibold ${isDark ? "text-white" : "text-gray-900"
                                        }`}
                                >
                                    {cancelText}
                                </Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            onPress={handleConfirm}
                            style={{ backgroundColor: config.color }}
                            className={`${cancelText ? "flex-1" : "flex-1"} py-3 rounded-xl`}
                        >
                            <Text className="text-center font-semibold text-white">
                                {confirmText}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </Animated.View>
        </Modal>
    );
}
