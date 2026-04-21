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
import type { MobileAuthResponse, RefreshMobileRequest } from "@/types/auth";

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
    const response = await axios.post<ApiResponse<MobileAuthResponse>>(
      `${BASE_URL}/auth-service/auth/mobile/refresh`,
      {
        refreshToken: refreshToken,
        submitSessionMetaRequest: metaData,
      } as RefreshMobileRequest
    );

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
// GLOBAL RATE LIMITER FOR MUSIC SERVICE
// ============================================================
const MUSIC_RATE_LIMIT_DELAY = 600; // 600ms between requests
const MAX_RETRIES = 3;

let musicQueue: Promise<void> = Promise.resolve();

// ============================================================
// REQUEST INTERCEPTOR
// ============================================================
axiosClient.interceptors.request.use(
  async (config) => {
    // 1. Handle Rate Limiting for music-service
    // Queue all requests to /music-service to avoid 429 errors from bursting
    if (config.url?.includes("/music-service/")) {
      await new Promise<void>((resolve) => {
        musicQueue = musicQueue.then(async () => {
          resolve(); // Let the request proceed
          // Delay the next item in the queue
          await new Promise((r) => setTimeout(r, MUSIC_RATE_LIMIT_DELAY));
        });
      });
    }

    // 2. Handle Auth
    const isAuthRequest =
      config.url?.includes("/auth-service/auth/mobile/login") ||
      config.url?.includes("/auth-service/auth/mobile/refresh") ||
      config.url?.includes("/auth-service/auth/register");

    if (isAuthRequest) return config;

    const { accessToken } = await getTokens();

    if (accessToken) {
      const expiringSoon = await isAccessTokenExpiringSoon(REFRESH_BUFFER_MS);

      if (expiringSoon) {
        console.log("[Axios] Access token sắp hết hạn, proactive refresh...");
        try {
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
          console.warn("[Axios] Proactive refresh thất bại, dùng token cũ");
        }
      }

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
      _retryCount?: number;
    };

    if (!originalRequest) {
      return Promise.reject(error);
    }

    // 1. Handle 429 Too Many Requests (Exponential Backoff)
    if (error.response?.status === 429 && originalRequest.url?.includes("/music-service/")) {
      originalRequest._retryCount = originalRequest._retryCount || 0;
      if (originalRequest._retryCount < MAX_RETRIES) {
        originalRequest._retryCount++;
        const delay = Math.pow(2, originalRequest._retryCount) * 1000;
        console.warn(`[Axios] 429 received for ${originalRequest.url}, retrying in ${delay}ms (attempt ${originalRequest._retryCount}/${MAX_RETRIES})`);
        await new Promise((r) => setTimeout(r, delay));
        // Reprocess request (it will go through the request interceptor and queue again)
        return axiosClient(originalRequest);
      }
    }

    // 2. Handle 401 Token Expired
    const payload = error.response?.data as ApiResponse<unknown> | undefined;
    const code = payload?.errorCode;
    const isTokenExpired = error.response?.status === 401 && code === 1102;

    if (!isTokenExpired || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Chặn Loop vô tận cho Auth
    if (
      originalRequest.url?.includes("/auth-service/auth/mobile/login") ||
      originalRequest.url?.includes("/auth-service/auth/mobile/refresh")
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (!refreshPromise) {
      refreshPromise = performRefreshToken().finally(() => {
        refreshPromise = null;
      });
    }

    try {
      const newToken = await refreshPromise;
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
