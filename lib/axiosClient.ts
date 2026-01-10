import axios from "axios";
import type { InternalAxiosRequestConfig, AxiosError } from "axios";
import { getTokens, saveTokens, clearTokens } from "@/utils/storage";
import { getSessionMetaRequest } from "@/utils/sessionMetaHandler";
import type { ApiResponse } from "@/types/base/apiResponse";
import type { MobileAuthResponse } from "@/types/authentication";

// 1. Cấu hình cơ bản
const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

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
// REQUEST INTERCEPTOR
// ============================================================
axiosClient.interceptors.request.use(
  async (config) => {
    const { accessToken } = await getTokens();

    // Nếu có token và không phải API refresh thì gắn vào header
    if (accessToken && !config.url?.includes("/auth/mobile/refresh")) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
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
  }
);

export default axiosClient;
