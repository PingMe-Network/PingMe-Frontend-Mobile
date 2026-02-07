import { View, Text, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

interface GenreCardProps {
    genreId: number;
    genreName: string;
    colors: [string, string];
    onPress: (genreId: number, genreName: string) => void;
}

export function GenreCard({ genreId, genreName, colors, onPress }: Readonly<GenreCardProps>) {
    const [color1, color2] = colors;

    return (
        <TouchableOpacity
            onPress={() => onPress(genreId, genreName)}
            style={{ width: "48%" }}
            activeOpacity={0.7}
        >
            <LinearGradient
                colors={[color1, color2]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="h-24 rounded-lg p-3 justify-between overflow-hidden"
            >
                <Text className="text-white font-bold text-base">
                    {genreName}
                </Text>
                <View className="absolute -right-2 -bottom-2 w-16 h-16 bg-black/10 rounded-lg transform rotate-12" />
            </LinearGradient>
        </TouchableOpacity>
    );
}
