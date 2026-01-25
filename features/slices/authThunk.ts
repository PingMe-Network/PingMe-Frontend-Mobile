import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  loginMobileApi,
  logoutApi,
  registerApi,
} from "@/services/authentication";
import type {
  LoginRequest,
  MobileAuthResponse,
  RegisterRequest,
} from "@/types/authentication";
import { saveTokens, clearTokens } from "@/utils/storage";
import { getErrorMessage } from "@/utils/errorMessageHandler";

// =========================================================
// THUNK LOGIN
// =========================================================
export const loginThunk = createAsyncThunk<MobileAuthResponse, LoginRequest>(
  "auth/login",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await loginMobileApi(payload);
      const data = response.data.data;

      await saveTokens(data.accessToken, data.refreshToken);

      return data;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

// =========================================================
// THUNK REGISTER
// =========================================================
export const registerThunk = createAsyncThunk<void, RegisterRequest>(
  "auth/register",
  async (payload, { rejectWithValue }) => {
    try {
      await registerApi(payload);
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

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
