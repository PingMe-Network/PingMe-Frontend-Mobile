import { createSlice } from "@reduxjs/toolkit";
import type { CurrentUserSessionResponse } from "@/types/authentication";
import { loginThunk, logoutThunk, registerThunk } from "./authThunk";

interface AuthState {
  user: CurrentUserSessionResponse | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  isLoggedIn: false,
  isLoading: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {},
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
      state.isLoggedIn = false;
    });
  },
});

export default authSlice.reducer;
