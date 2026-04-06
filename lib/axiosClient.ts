import axios from "axios";
import type { InternalAxiosRequestConfig, AxiosError } from "axios";
import {
  getTokens,
  saveTokens,
  clearTokens,
  isAccessTokenExpiringSoon,
} from "@/utils/storage";
import { getSessionMetaRequest } from "@/utils/sessionMetaHandler";
import type { ApiResponse } from "@/types/base/apiResponse";
import type { MobileAuthResponse } from "@/types/auth";

// 1. Cấu hình cơ bản
const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

const axiosClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// ============================================================
// REDUX BRIDGE
// ============================================================
let onTokenRefreshed: ((payload: MobileAuthResponse) => void) | null = null;
let onLogout: (() => void) | null = null;

export function setupAxiosInterceptors(opts: {
  onTokenRefreshed?: (payload: MobileAuthResponse) => void;
  onLogout?: () => void;
}) {
  onTokenRefreshed = opts.onTokenRefreshed ?? null;
  onLogout = opts.onLogout ?? null;
}

// ============================================================
// SHARED PROMISE
// ============================================================
let refreshPromise: Promise<string> | null = null;

const performRefreshToken = async (): Promise<string> => {
  try {
    const { refreshToken } = await getTokens();
    if (!refreshToken) throw new Error("No refresh token available");

    const metaData = await getSessionMetaRequest();

    // Gọi API Refresh
    const response = await axios.post(`${BASE_URL}/auth/mobile/refresh`, {
      refreshToken: refreshToken,
      submitSessionMetaRequest: metaData,
    });

    const payload = response.data.data as MobileAuthResponse;

    // Lưu token mới vào Storage
    await saveTokens(payload.accessToken, payload.refreshToken);

    // Bắn tín hiệu về Redux để cập nhật State
    if (onTokenRefreshed) {
      onTokenRefreshed(payload);
    }

    return payload.accessToken;
  } catch (error) {
    await clearTokens();
    if (onLogout) {
      onLogout();
    }
    throw error;
  }
};

// ============================================================
// PROACTIVE REFRESH BUFFER (60 giây)
// ============================================================
const REFRESH_BUFFER_MS = 60_000;

// ============================================================
// REQUEST INTERCEPTOR
// ============================================================
axiosClient.interceptors.request.use(
  async (config) => {
    // Bỏ qua auth-related requests
    const isAuthRequest =
      config.url?.includes("/auth/mobile/login") ||
      config.url?.includes("/auth/mobile/refresh") ||
      config.url?.includes("/auth/register");

    if (isAuthRequest) return config;

    const { accessToken } = await getTokens();

    if (accessToken) {
      // Proactive Refresh: nếu token sắp hết hạn trong 60s → refresh trước
      const expiringSoon = await isAccessTokenExpiringSoon(REFRESH_BUFFER_MS);

      if (expiringSoon) {
        console.log("[Axios] Access token sắp hết hạn, proactive refresh...");
        try {
          // Dùng shared promise để tránh refresh trùng lặp
          if (!refreshPromise) {
            refreshPromise = performRefreshToken().finally(() => {
              refreshPromise = null;
            });
          }
          const newToken = await refreshPromise;
          config.headers = config.headers ?? {};
          config.headers.Authorization = `Bearer ${newToken}`;
          return config;
        } catch {
          // Nếu refresh thất bại → vẫn gửi request với token cũ
          // Response interceptor sẽ xử lý 401
          console.warn("[Axios] Proactive refresh thất bại, dùng token cũ");
        }
      }

      // Token còn hạn → gắn bình thường
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// ============================================================
// RESPONSE INTERCEPTOR
// ============================================================
axiosClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Phân tích lỗi
    const payload = error.response?.data as ApiResponse<unknown> | undefined;
    const code = payload?.errorCode;

    // Điều kiện: 401 VÀ ErrorCode 1102 (Token Expired)
    const isTokenExpired = error.response?.status === 401 && code === 1102;

    if (!isTokenExpired || !originalRequest || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Chặn Loop vô tận
    if (
      originalRequest.url?.includes("/auth/mobile/login") ||
      originalRequest.url?.includes("/auth/mobile/refresh")
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    // Logic Shared Promise
    if (!refreshPromise) {
      refreshPromise = performRefreshToken().finally(() => {
        refreshPromise = null;
      });
    }

    try {
      const newToken = await refreshPromise;

      // Gắn token mới và gọi lại request cũ
      originalRequest.headers = originalRequest.headers ?? {};
      originalRequest.headers.Authorization = `Bearer ${newToken}`;

      axiosClient.defaults.headers.common.Authorization = `Bearer ${newToken}`;

      return axiosClient(originalRequest);
    } catch (e) {
      return Promise.reject(e);
    }
  },
);

export default axiosClient;
