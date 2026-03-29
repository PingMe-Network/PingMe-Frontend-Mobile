import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";
import { favoriteApi } from "@/services/music/favoriteApi";
import type { FavoriteDto } from "@/types/music/favorite";

interface FavoriteState {
  // List of favorite songs
  favorites: FavoriteDto[];

  // Quick lookup array for favorite song IDs
  favoriteSongIds: number[];

  // Loading states
  loading: boolean;
  operationLoading: Record<number, boolean>; // Track loading per song

  // Error state
  error: string | null;

  // Metadata
  lastFetched: number | null;
}

const initialState: FavoriteState = {
  favorites: [],
  favoriteSongIds: [],
  loading: false,
  operationLoading: {},
  error: null,
  lastFetched: null,
};

// Async Thunks
export const fetchFavorites = createAsyncThunk(
  "favorite/fetchFavorites",
  async () => {
    return await favoriteApi.getFavorites();
  },
);

export const addFavorite = createAsyncThunk(
  "favorite/addFavorite",
  async (songId: number) => {
    await favoriteApi.addFavorite(songId);
    return songId;
  },
);

export const removeFavorite = createAsyncThunk(
  "favorite/removeFavorite",
  async (songId: number) => {
    await favoriteApi.removeFavorite(songId);
    return songId;
  },
);

export const toggleFavorite = createAsyncThunk(
  "favorite/toggleFavorite",
  async (songId: number, { getState }) => {
    const state = getState() as { favorite: FavoriteState };
    const isFavorite = state.favorite.favoriteSongIds.includes(songId);

    if (isFavorite) {
      await favoriteApi.removeFavorite(songId);
      return { songId, action: "removed" as const };
    } else {
      await favoriteApi.addFavorite(songId);
      return { songId, action: "added" as const };
    }
  },
);

const favoriteSlice = createSlice({
  name: "favorite",
  initialState,
  reducers: {
    clearFavorites(state) {
      state.favorites = [];
      state.favoriteSongIds = [];
      state.lastFetched = null;
    },
    clearError(state) {
      state.error = null;
    },
    // Optimistic update helpers
    optimisticAddFavorite(
      state,
      action: PayloadAction<{ songId: number; title: string }>,
    ) {
      const { songId, title } = action.payload;
      if (!state.favoriteSongIds.includes(songId)) {
        state.favorites.push({ id: Date.now(), songId, title });
        state.favoriteSongIds.push(songId);
      }
    },
    optimisticRemoveFavorite(state, action: PayloadAction<number>) {
      const songId = action.payload;
      state.favorites = state.favorites.filter((f) => f.songId !== songId);
      state.favoriteSongIds = state.favoriteSongIds.filter(
        (id) => id !== songId,
      );
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch favorites
      .addCase(fetchFavorites.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFavorites.fulfilled, (state, action) => {
        state.favorites = action.payload;
        state.favoriteSongIds = action.payload.map((f) => f.songId);
        state.lastFetched = Date.now();
        state.loading = false;
      })
      .addCase(fetchFavorites.rejected, (state, action) => {
        state.error = action.error.message || "Failed to fetch favorites";
        state.loading = false;
      })

      // Add favorite
      .addCase(addFavorite.pending, (state, action) => {
        state.operationLoading[action.meta.arg] = true;
        state.error = null;
      })
      .addCase(addFavorite.fulfilled, (state, action) => {
        const songId = action.payload;
        if (!state.favoriteSongIds.includes(songId)) {
          state.favoriteSongIds.push(songId);
        }
        state.operationLoading[songId] = false;
        // Note: We don't add to favorites array here as we don't have full FavoriteDto
        // It will be updated on next fetchFavorites
      })
      .addCase(addFavorite.rejected, (state, action) => {
        const songId = action.meta.arg;
        state.operationLoading[songId] = false;
        state.error = action.error.message || "Failed to add favorite";
      })

      // Remove favorite
      .addCase(removeFavorite.pending, (state, action) => {
        state.operationLoading[action.meta.arg] = true;
        state.error = null;
      })
      .addCase(removeFavorite.fulfilled, (state, action) => {
        const songId = action.payload;
        state.favorites = state.favorites.filter((f) => f.songId !== songId);
        state.favoriteSongIds = state.favoriteSongIds.filter(
          (id) => id !== songId,
        );
        state.operationLoading[songId] = false;
      })
      .addCase(removeFavorite.rejected, (state, action) => {
        const songId = action.meta.arg;
        state.operationLoading[songId] = false;
        state.error = action.error.message || "Failed to remove favorite";
      })

      // Toggle favorite
      .addCase(toggleFavorite.pending, (state, action) => {
        state.operationLoading[action.meta.arg] = true;
        state.error = null;
      })
      .addCase(toggleFavorite.fulfilled, (state, action) => {
        const { songId, action: favoriteAction } = action.payload;

        if (favoriteAction === "added") {
          if (!state.favoriteSongIds.includes(songId)) {
            state.favoriteSongIds.push(songId);
          }
        } else {
          state.favorites = state.favorites.filter((f) => f.songId !== songId);
          state.favoriteSongIds = state.favoriteSongIds.filter(
            (id) => id !== songId,
          );
        }

        state.operationLoading[songId] = false;
      })
      .addCase(toggleFavorite.rejected, (state, action) => {
        const songId = action.meta.arg;
        state.operationLoading[songId] = false;
        state.error = action.error.message || "Failed to toggle favorite";
      });
  },
});

export const {
  clearFavorites,
  clearError,
  optimisticAddFavorite,
  optimisticRemoveFavorite,
} = favoriteSlice.actions;

export default favoriteSlice.reducer;
