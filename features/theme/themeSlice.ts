import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { Appearance } from "react-native";

interface ThemeState {
  mode: "light" | "dark";
}

const initialState: ThemeState = {
  mode: Appearance.getColorScheme() === "dark" ? "dark" : "light",
};

const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    toggleTheme: (state) => {
      // Disabled: Forced Light Mode
      state.mode = "light";
    },
    setTheme: (state, action: PayloadAction<"light" | "dark">) => {
      // Disabled: Forced Light Mode
      state.mode = "light";
    },
  },
});

export const { toggleTheme, setTheme } = themeSlice.actions;
export default themeSlice.reducer;
