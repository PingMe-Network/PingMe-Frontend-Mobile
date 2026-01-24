import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ContactsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-2xl font-bold text-gray-800 mb-2">Danh ba</Text>
        <Text className="text-gray-500 text-center">
          Danh sach lien he se hien thi o day
        </Text>
      </View>
    </SafeAreaView>
  );
}
