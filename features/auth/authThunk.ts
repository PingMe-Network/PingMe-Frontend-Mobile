import { createAsyncThunk } from "@reduxjs/toolkit";
import { loginMobileApi, logoutApi, registerApi } from "@/services/authentication";
import type {
  CurrentUserSessionResponse,
  LoginRequest,
  MobileAuthResponse,
  RegisterRequest,
} from "@/types/authentication";
import { saveTokens, clearTokens } from "@/utils/storage";
import { getErrorMessage } from "@/utils/errorMessageHandler";
import { getCurrentUserSessionApi } from "@/services/user/currentUserProfileApi";

// =========================================================
// THUNK LOGIN
// =========================================================
export const loginThunk = createAsyncThunk<
  MobileAuthResponse,
  LoginRequest,
  { rejectValue: string }
>("auth/login", async (payload, { rejectWithValue }) => {
  try {
    const response = await loginMobileApi(payload);
    const data = response.data.data;

    await saveTokens(data.accessToken, data.refreshToken);

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
      await logoutApi();
      await clearTokens();
    } catch (error) {
      console.log("Logout API warning:", error);
    } finally {
      await clearTokens();
    }
  },
);

// =========================================================
// THUNK GET CURRENT USER SESSION
// =========================================================
export const getCurrentUserSession = createAsyncThunk<
  CurrentUserSessionResponse,
  void,
  { rejectValue: string }
>("auth/me", async (_, thunkAPI) => {
  try {
    const res = await getCurrentUserSessionApi();
    return res.data.data;
  } catch (err: unknown) {
    const message = getErrorMessage(err, "Lấy thông tin tài khoản thất bại");
    return thunkAPI.rejectWithValue(message);
  }
});
// =========================================================
// THUNK REGISTER
// =========================================================
export const registerThunk = createAsyncThunk<
  void,
  RegisterRequest,
  { rejectValue: string }
>("auth/register", async (payload, { rejectWithValue }) => {
  try {
    await registerApi(payload);
  } catch (error: any) {
    return rejectWithValue(getErrorMessage(error));
  }
});

