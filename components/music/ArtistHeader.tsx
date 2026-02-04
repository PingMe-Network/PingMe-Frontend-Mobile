import { View, Text, TouchableOpacity, Animated, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";

export type ArtistHeaderProps = {
    isDark: boolean;
    headerHeight: any;
    titleOpacity: any;
    imageOpacity: any;
    artistName: string;
    followerCount: number;
    artistImage?: string;
    onPlayPress: () => void;
    onFollowPress: () => void;
};

export function ArtistHeader({
    isDark,
    headerHeight,
    titleOpacity,
    imageOpacity,
    artistName,
    followerCount,
    artistImage,
    onPlayPress,
    onFollowPress,
}: Readonly<ArtistHeaderProps>) {
    return (
        <Animated.View style={{ height: headerHeight }} className={isDark ? "bg-background-dark" : "bg-background-light"}>
            {/* Expandable Image Section */}
            <Animated.View style={{ opacity: imageOpacity }} className="items-center pt-4">
                <Image
                    source={{
                        uri: artistImage || "https://via.placeholder.com/200",
                    }}
                    className="w-48 h-48 rounded-full"
                    resizeMode="cover"
                />
            </Animated.View>

            {/* Artist Info Section */}
            <Animated.View style={{ opacity: titleOpacity }} className="px-4 pt-6 pb-4">
                <Text
                    className="text-3xl font-bold text-center"
                    style={{ color: isDark ? Colors.text.dark : Colors.text.light }}
                    numberOfLines={1}
                >
                    {artistName}
                </Text>

                <Text
                    className="text-center mt-2"
                    style={{ color: Colors.text.gray }}
                >
                    {followerCount.toLocaleString()} người nghe hàng tháng
                </Text>

                {/* Action Buttons */}
                <View className="mt-6 flex-row items-center justify-center gap-4">
                    <TouchableOpacity
                        className="flex-row items-center gap-2 px-6 py-3 rounded-full border"
                        style={{
                            borderColor: Colors.primary,
                            backgroundColor: isDark ? Colors.background.dark : Colors.background.light,
                        }}
                        onPress={onFollowPress}
                    >
                        <Ionicons name="heart" size={20} color={Colors.primary} />
                        <Text style={{ color: Colors.primary }} className="font-semibold">
                            Theo dõi
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        className="h-14 w-14 items-center justify-center rounded-full"
                        style={{ backgroundColor: Colors.primary }}
                        onPress={onPlayPress}
                    >
                        <Ionicons name="play" size={22} color="white" />
                    </TouchableOpacity>
                </View>
            </Animated.View>
        </Animated.View>
    );
}
