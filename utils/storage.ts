import AsyncStorage from "@react-native-async-storage/async-storage";

// ====================================================
// Lưu Token
// ====================================================
export const saveTokens = async (accessToken: string, refreshToken: string) => {
  try {
    await AsyncStorage.multiSet([
      ["access_token", accessToken],
      ["refresh_token", refreshToken],
    ]);
  } catch (e) {
    console.error("Lỗi lưu token", e);
  }
};

// ====================================================
// Lấy Token
// ====================================================
export const getTokens = async () => {
  try {
    const values = await AsyncStorage.multiGet([
      "access_token",
      "refresh_token",
    ]);
    return {
      accessToken: values[0][1],
      refreshToken: values[1][1],
    };
  } catch {
    return { accessToken: null, refreshToken: null };
  }
};

// ====================================================
// Xóa Token
// ====================================================
export const clearTokens = async () => {
  try {
    await AsyncStorage.multiRemove(["access_token", "refresh_token"]);
  } catch (e) {
    console.error("Lỗi xóa token", e);
  }
};
