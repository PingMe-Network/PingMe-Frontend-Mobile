import { View, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface PlaylistCoverProps {
    coverImages: (string | null | undefined)[];
    size: number;
    isDark: boolean;
}

export const PlaylistCover = ({ coverImages, size, isDark }: Readonly<PlaylistCoverProps>) => {
    // Lọc ra các ảnh hợp lệ
    const validImages = coverImages.filter((img): img is string => !!img);

    // Nếu không có ảnh nào, hiển thị icon mặc định
    if (validImages.length === 0) {
        const backgroundColor = isDark ? "bg-gray-700" : "bg-gray-200";
        return (
            <View
                className={`rounded-lg items-center justify-center ${backgroundColor}`}
                style={{ width: size, height: size }}
            >
                <Ionicons
                    name="musical-notes"
                    size={size * 0.4}
                    color={isDark ? "#9ca3af" : "#6b7280"}
                />
            </View>
        );
    }

    // Lấy tối đa 4 ảnh (nếu ít hơn 4 thì lặp lại)
    const imagesToShow = Array.from({ length: 4 }, (_, i) =>
        validImages[i % validImages.length]
    );

    const imageSize = size / 2;
    const gap = 1; // Khoảng cách giữa các ảnh (1px)

    return (
        <View
            className="rounded-lg overflow-hidden"
            style={{ width: size, height: size }}
        >
            <View className="flex-row flex-wrap">
                {imagesToShow.map((imageUrl, index) => (
                    <View
                        key={index}
                        style={{
                            width: imageSize - (gap / 2),
                            height: imageSize - (gap / 2),
                            marginRight: index % 2 === 0 ? gap : 0,
                            marginBottom: index < 2 ? gap : 0,
                        }}
                    >
                        <Image
                            source={{ uri: imageUrl }}
                            style={{ width: "100%", height: "100%", backgroundColor: isDark ? "#374151" : "#e5e7eb" }}
                            resizeMode="cover"
                        />
                    </View>
                ))}
            </View>
        </View>
    );
};
