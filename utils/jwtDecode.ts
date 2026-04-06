/**
 * Lightweight JWT decoder (không cần thư viện bên ngoài).
 * Chỉ decode payload – KHÔNG verify signature.
 */

interface JwtPayload {
  exp?: number; // Unix timestamp (seconds)
  iat?: number;
  sub?: string;
  [key: string]: unknown;
}

/**
 * Decode JWT payload từ token string.
 * @returns JwtPayload hoặc null nếu token không hợp lệ.
 */
export const decodeJwtPayload = (token: string): JwtPayload | null => {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    // Base64Url → Base64
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");

    // Decode base64 string
    const jsonPayload = atob(base64);

    return JSON.parse(jsonPayload) as JwtPayload;
  } catch {
    return null;
  }
};

/**
 * Lấy thời gian hết hạn (milliseconds) từ JWT token.
 * @returns timestamp (ms) hoặc null nếu không decode được.
 */
export const getTokenExpirationMs = (token: string): number | null => {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return null;
  return payload.exp * 1000; // Convert seconds → milliseconds
};

/**
 * Kiểm tra token đã hết hạn chưa.
 * @param bufferMs - Buffer time (ms) trước khi hết hạn thật.
 *                   Mặc định 60s để proactive refresh.
 */
export const isTokenExpired = (
  token: string,
  bufferMs: number = 60_000,
): boolean => {
  const expiresAt = getTokenExpirationMs(token);
  if (!expiresAt) return true; // Không decode được → coi như hết hạn
  return Date.now() >= expiresAt - bufferMs;
};
