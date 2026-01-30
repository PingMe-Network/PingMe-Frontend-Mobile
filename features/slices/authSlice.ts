import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type {
  CurrentUserSessionResponse,
  MobileAuthResponse,
} from "@/types/authentication";
import { getCurrentUserSession, loginThunk, logoutThunk } from "./authThunk";

interface AuthState {
  userSession: CurrentUserSessionResponse;
  isLogin: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  userSession: {} as CurrentUserSessionResponse,
  isLogin: false,
  isLoading: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    updateUserSession(state, action: PayloadAction<MobileAuthResponse>) {
      state.userSession = action.payload.userSession;
    },
  },
  extraReducers: (builder) => {
    // ================
    // LOGIN
    // ================

    builder.addCase(loginThunk.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });

    builder.addCase(loginThunk.fulfilled, (state, action) => {
      state.userSession = action.payload.userSession;
      state.isLoading = false;
      state.isLogin = true;
    });

    builder.addCase(loginThunk.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload ?? null;
    });

    // ================
    // LOGOUT
    // ================
    builder.addCase(logoutThunk.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });

    builder.addCase(logoutThunk.fulfilled, (state) => {
      state.userSession = {} as CurrentUserSessionResponse;

      state.isLogin = false;
      state.isLoading = false;
    });

    builder.addCase(logoutThunk.rejected, (state, action) => {
      state.userSession = {} as CurrentUserSessionResponse;

      state.isLogin = false;
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // ================
    // GET CURRENT SESSION
    // ================
    builder.addCase(getCurrentUserSession.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });

    builder.addCase(
      getCurrentUserSession.fulfilled,
      (state, action: PayloadAction<CurrentUserSessionResponse>) => {
        state.userSession = action.payload;

        state.isLogin = true;
        state.isLoading = false;
      },
    );

    builder.addCase(getCurrentUserSession.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
  },
});

export const { updateUserSession } = authSlice.actions;
export default authSlice.reducer;
