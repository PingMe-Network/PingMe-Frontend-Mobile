import React from "react";
import { View, Text, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, Stack } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useAppSelector } from "@/features/store";
import { useColorScheme } from "nativewind";

import { Colors } from "@/constants/Colors";

interface AccountLayoutProps {
  title?: string;
  children: React.ReactNode;
  showBackButton?: boolean;
  onBackPress?: () => void;
  loading?: boolean;
  contentContainerStyle?: any;
  noScrollView?: boolean;
}

export const AccountLayout: React.FC<AccountLayoutProps> = ({
  title,
  children,
  showBackButton = true,
  onBackPress,
  loading = false,
  contentContainerStyle,
  noScrollView = false,
}) => {
  const { mode } = useAppSelector((state) => state.theme);
  const isDark = mode === "dark";
  const { setColorScheme } = useColorScheme();

  React.useEffect(() => {
    setColorScheme(mode);
  }, [mode]);

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  const renderMainContent = () => {
    if (loading) {
      return (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      );
    }

    if (noScrollView) {
      return children;
    }

    return (
      <ScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[{ paddingTop: 24, paddingBottom: 100 }, contentContainerStyle]}
      >
        {children}
      </ScrollView>
    );
  };

  const content = (
    <View className="flex-1">
      {/* Header */}
      {title && (
        <View className={`flex-row items-center px-4 py-3 ${isDark ? "bg-white/5 border-b border-white/10" : "bg-white border-b border-gray-100"}`}>
          {showBackButton && (
            <TouchableOpacity onPress={handleBack} className="p-2 mr-2">
              <Feather name="arrow-left" size={24} color={isDark ? "white" : "black"} />
            </TouchableOpacity>
          )}
          <Text className={`text-lg font-bold flex-1 ${isDark ? "text-white" : "text-midnight-velvet"}`}>
            {title}
          </Text>
        </View>
      )}

      {renderMainContent()}
    </View>
  );

  return (
    <SafeAreaView className={`flex-1 ${isDark ? "bg-background-dark" : "bg-background-light"}`} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        {content}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
