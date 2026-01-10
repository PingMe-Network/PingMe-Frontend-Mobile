import { createAsyncThunk } from "@reduxjs/toolkit";
import { loginMobileApi, logoutApi } from "@/services/authentication";
import type { LoginRequest, MobileAuthResponse } from "@/types/authentication";
import { saveTokens, clearTokens } from "@/utils/storage";
import { getErrorMessage } from "@/utils/errorMessageHandler";

// =========================================================
// THUNK LOGIN
// =========================================================
export const loginThunk = createAsyncThunk<
  MobileAuthResponse, // Kiểu dữ liệu trả về khi thành công
  LoginRequest // Kiểu dữ liệu đầu vào
>("auth/login", async (payload, { rejectWithValue }) => {
  try {
    // 1. Gọi API
    const response = await loginMobileApi(payload);
    const data = response.data.data;

    // 2. Lưu token vào máy (Quan trọng!)
    await saveTokens(data.accessToken, data.refreshToken);

    // 3. Trả data về cho Slice cập nhật State
    return data;
  } catch (error: any) {
    return rejectWithValue(getErrorMessage(error));
  }
});

// =========================================================
// THUNK LOGOUT
// =========================================================
export const logoutThunk = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      // Gọi API báo server hủy session (nếu server chết cũng ko sao)
      await logoutApi();
    } catch (error) {
      console.log("Logout API warning:", error);
    } finally {
      // QUAN TRỌNG NHẤT: Xóa token trong máy user
      await clearTokens();
    }
  }
);
