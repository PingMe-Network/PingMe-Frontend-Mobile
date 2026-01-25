import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  CurrentUserSessionResponse,
  MobileAuthResponse,
} from "@/types/authentication";
import { loginThunk, logoutThunk, registerThunk } from "./authThunk";

interface AuthState {
  user: CurrentUserSessionResponse | null;
  accessToken: string | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  isLoggedIn: false,
  isLoading: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    updateTokenManually: (state, action: PayloadAction<MobileAuthResponse>) => {
      state.accessToken = action.payload.accessToken;
      // Backend MobileAuthResponse có trả về userSession mới
      if (action.payload.userSession) {
        state.user = action.payload.userSession;
      }
    },

    // Action này dùng lúc mở App: Check storage có token thì set lại state
    setAuthData: (
      state,
      action: PayloadAction<{
        user: CurrentUserSessionResponse | null;
        token: string;
      }>
    ) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.token;
      state.isLoggedIn = true;
    },

    // Reset lỗi
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // --- Xử lý Login ---
    builder.addCase(loginThunk.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(loginThunk.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isLoggedIn = true;
      state.user = action.payload.userSession;
      state.accessToken = action.payload.accessToken;
    });
    builder.addCase(loginThunk.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // --- Xử lý Register ---
    builder.addCase(registerThunk.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(registerThunk.fulfilled, (state) => {
      state.isLoading = false;
    });
    builder.addCase(registerThunk.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // --- Xử lý Logout ---
    builder.addCase(logoutThunk.fulfilled, (state) => {
      state.user = null;
      state.accessToken = null;
      state.isLoggedIn = false;
    });
  },
});

export const { updateTokenManually, setAuthData, clearError } =
  authSlice.actions;
export default authSlice.reducer;
