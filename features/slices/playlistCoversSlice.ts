import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface PlaylistCoversState {
  // Cache cover images theo playlist ID
  coverImagesCache: Record<number, string[]>;
  
  // Timestamp để biết khi nào cache hết hạn
  cacheTimestamps: Record<number, number>;
  
  // Loading state
  loadingIds: number[];
}

const initialState: PlaylistCoversState = {
  coverImagesCache: {},
  cacheTimestamps: {},
  loadingIds: [],
};

// Cache TTL: 5 phút
const CACHE_TTL = 5 * 60 * 1000;

const playlistCoversSlice = createSlice({
  name: "playlistCovers",
  initialState,
  reducers: {
    setCoverImages(
      state,
      action: PayloadAction<{ playlistId: number; coverImages: string[] }>
    ) {
      const { playlistId, coverImages } = action.payload;
      state.coverImagesCache[playlistId] = coverImages;
      state.cacheTimestamps[playlistId] = Date.now();
    },

    setMultipleCoverImages(
      state,
      action: PayloadAction<Record<number, string[]>>
    ) {
      const now = Date.now();
      Object.entries(action.payload).forEach(([id, images]) => {
        const playlistId = Number(id);
        state.coverImagesCache[playlistId] = images;
        state.cacheTimestamps[playlistId] = now;
      });
    },

    setLoadingIds(state, action: PayloadAction<number[]>) {
      state.loadingIds = action.payload;
    },

    clearExpiredCache(state) {
      const now = Date.now();
      Object.keys(state.cacheTimestamps).forEach((id) => {
        const playlistId = Number(id);
        const timestamp = state.cacheTimestamps[playlistId];
        if (now - timestamp > CACHE_TTL) {
          delete state.coverImagesCache[playlistId];
          delete state.cacheTimestamps[playlistId];
        }
      });
    },

    clearCache(state) {
      state.coverImagesCache = {};
      state.cacheTimestamps = {};
    },

    invalidatePlaylistCache(state, action: PayloadAction<number>) {
      const playlistId = action.payload;
      delete state.coverImagesCache[playlistId];
      delete state.cacheTimestamps[playlistId];
    },
  },
});

export const {
  setCoverImages,
  setMultipleCoverImages,
  setLoadingIds,
  clearExpiredCache,
  clearCache,
  invalidatePlaylistCache,
} = playlistCoversSlice.actions;

export default playlistCoversSlice.reducer;

// Selectors
export const selectCoverImages = (state: any, playlistId: number) =>
  state.playlistCovers.coverImagesCache[playlistId] || [];

export const selectIsCached = (state: any, playlistId: number) => {
  const timestamp = state.playlistCovers.cacheTimestamps[playlistId];
  if (!timestamp) return false;
  return Date.now() - timestamp < CACHE_TTL;
};

export const selectIsLoading = (state: any, playlistId: number) =>
  state.playlistCovers.loadingIds.includes(playlistId);
