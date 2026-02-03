import { configureStore, combineReducers } from "@reduxjs/toolkit";
import {
  useDispatch,
  useSelector,
  type TypedUseSelectorHook,
} from "react-redux";
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
import AsyncStorage from "@react-native-async-storage/async-storage";
import authReducer from "./slices/authSlice";
import themeReducer from "./slices/themeSlice";
import musicReducer from "./slices/musicSlice";
import favoriteReducer from "./slices/favoriteSlice";
import playerReducer from "./slices/playerSlice";
import playlistReducer from "./slices/playlistSlice";

const persistConfig = {
  key: "root",
  version: 2, // Increment this when schema changes
  storage: AsyncStorage,
  whitelist: ["auth", "theme", "favorite", "playlist"], // Removed "player" - Audio.Sound cannot be serialized
  migrate: (state: any) => {
    // Migration for favorite.favoriteSongIds from Set to Array
    if (state?.favorite?.favoriteSongIds) {
      const ids = state.favorite.favoriteSongIds;
      // If it's a Set-like object, convert to array
      if (typeof ids === "object" && !Array.isArray(ids)) {
        state.favorite.favoriteSongIds = [];
      }
    }
    // Clear player state on migration (Audio.Sound cannot persist)
    if (state?.player) {
      delete state.player;
    }
    return Promise.resolve(state);
  },
};

const rootReducer = combineReducers({
  auth: authReducer,
  music: musicReducer,
  favorite: favoriteReducer,
  player: playerReducer,
  playlist: playlistReducer,
  theme: themeReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          FLUSH,
          REHYDRATE,
          PAUSE,
          PERSIST,
          PURGE,
          REGISTER,
          "player/loadAndPlaySong/fulfilled", // Ignore sound object in payload
        ],
        ignoredActionPaths: ["payload.sound"], // Ignore sound in action payloads
        ignoredPaths: ["player.sound"], // Ignore expo-av Sound object in state
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
