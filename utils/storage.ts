import AsyncStorage from "@react-native-async-storage/async-storage";
import { getTokenExpirationMs } from "./jwtDecode";

// ====================================================
// Keys
// ====================================================
const KEYS = {
  ACCESS_TOKEN: "access_token",
  REFRESH_TOKEN: "refresh_token",
  ACCESS_TOKEN_EXPIRES_AT: "access_token_expires_at",
  REFRESH_TOKEN_EXPIRES_AT: "refresh_token_expires_at",
} as const;

// ====================================================
// Lưu Token + Expire Time
// ====================================================
export const saveTokens = async (
  accessToken: string,
  refreshToken: string,
) => {
  if (typeof window === "undefined") return;
  try {
    // Decode expire time từ JWT
    const accessExpiresAt = getTokenExpirationMs(accessToken);
    const refreshExpiresAt = getTokenExpirationMs(refreshToken);

    await AsyncStorage.multiSet([
      [KEYS.ACCESS_TOKEN, accessToken],
      [KEYS.REFRESH_TOKEN, refreshToken],
      [KEYS.ACCESS_TOKEN_EXPIRES_AT, String(accessExpiresAt ?? "")],
      [KEYS.REFRESH_TOKEN_EXPIRES_AT, String(refreshExpiresAt ?? "")],
    ]);
  } catch (e) {
    console.error("Lỗi lưu token", e);
  }
};

// ====================================================
// Lấy Token + Expire Time
// ====================================================
export interface StoredTokens {
  accessToken: string | null;
  refreshToken: string | null;
  accessExpiresAt: number | null;
  refreshExpiresAt: number | null;
}

export const getTokens = async (): Promise<StoredTokens> => {
  if (typeof window === "undefined") {
    return {
      accessToken: null,
      refreshToken: null,
      accessExpiresAt: null,
      refreshExpiresAt: null,
    };
  }
  try {
    const values = await AsyncStorage.multiGet([
      KEYS.ACCESS_TOKEN,
      KEYS.REFRESH_TOKEN,
      KEYS.ACCESS_TOKEN_EXPIRES_AT,
      KEYS.REFRESH_TOKEN_EXPIRES_AT,
    ]);

    const accessExpiresAtRaw = values[2][1];
    const refreshExpiresAtRaw = values[3][1];

    return {
      accessToken: values[0][1],
      refreshToken: values[1][1],
      accessExpiresAt: accessExpiresAtRaw ? Number(accessExpiresAtRaw) : null,
      refreshExpiresAt: refreshExpiresAtRaw
        ? Number(refreshExpiresAtRaw)
        : null,
    };
  } catch {
    return {
      accessToken: null,
      refreshToken: null,
      accessExpiresAt: null,
      refreshExpiresAt: null,
    };
  }
};

// ====================================================
// Kiểm tra Access Token sắp hết hạn
// ====================================================
/**
 * @param bufferMs - Thời gian buffer trước khi hết hạn (mặc định 60s).
 *                   Nếu token sẽ hết hạn trong vòng bufferMs → trả về true.
 */
export const isAccessTokenExpiringSoon = async (
  bufferMs: number = 60_000,
): Promise<boolean> => {
  const { accessExpiresAt } = await getTokens();
  if (!accessExpiresAt) return true; // Không có expire time → coi như sắp hết
  return Date.now() >= accessExpiresAt - bufferMs;
};

// ====================================================
// Kiểm tra Refresh Token đã hết hạn
// ====================================================
export const isRefreshTokenExpired = async (): Promise<boolean> => {
  const { refreshExpiresAt } = await getTokens();
  if (!refreshExpiresAt) return true;
  return Date.now() >= refreshExpiresAt;
};

// ====================================================
// Xóa Token
// ====================================================
export const clearTokens = async () => {
  if (typeof window === "undefined") return;
  try {
    await AsyncStorage.multiRemove([
      KEYS.ACCESS_TOKEN,
      KEYS.REFRESH_TOKEN,
      KEYS.ACCESS_TOKEN_EXPIRES_AT,
      KEYS.REFRESH_TOKEN_EXPIRES_AT,
    ]);
  } catch (e) {
    console.error("Lỗi xóa token", e);
  }
};
