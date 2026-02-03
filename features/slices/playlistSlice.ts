import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";
import { playlistApi } from "@/services/music/playlistApi";
import type {
  PlaylistDto,
  PlaylistDetailDto,
  CreatePlaylistRequest,
} from "@/types/music/playlist";

interface PlaylistState {
  // User's playlists
  userPlaylists: PlaylistDto[];

  // Playlist details cache (keyed by playlist ID)
  playlistDetails: Record<number, PlaylistDetailDto>;

  // Active playlist for UI state
  activePlaylistId: number | null;

  // Loading states
  loading: boolean;
  loadingDetail: Record<number, boolean>;

  // Error handling
  error: string | null;
}

const initialState: PlaylistState = {
  userPlaylists: [],
  playlistDetails: {},
  activePlaylistId: null,
  loading: false,
  loadingDetail: {},
  error: null,
};

// Async Thunks
export const fetchUserPlaylists = createAsyncThunk(
  "playlist/fetchUserPlaylists",
  async () => {
    const playlists = await playlistApi.getPlaylists();
    return playlists;
  },
);

export const fetchPlaylistDetail = createAsyncThunk(
  "playlist/fetchPlaylistDetail",
  async (playlistId: number) => {
    const detail = await playlistApi.getPlaylistDetail(playlistId);
    return detail;
  },
);

export const createPlaylist = createAsyncThunk(
  "playlist/createPlaylist",
  async (data: CreatePlaylistRequest) => {
    const playlist = await playlistApi.createPlaylist(data);
    return playlist;
  },
);

export const deletePlaylist = createAsyncThunk(
  "playlist/deletePlaylist",
  async (playlistId: number) => {
    await playlistApi.deletePlaylist(playlistId);
    return playlistId;
  },
);

export const updatePlaylist = createAsyncThunk(
  "playlist/updatePlaylist",
  async ({
    playlistId,
    data,
  }: {
    playlistId: number;
    data: { name?: string; isPublic?: boolean };
  }) => {
    const playlist = await playlistApi.updatePlaylist(playlistId, data);
    return playlist;
  },
);

export const addSongToPlaylist = createAsyncThunk(
  "playlist/addSongToPlaylist",
  async (
    { playlistId, songId }: { playlistId: number; songId: number },
    { rejectWithValue },
  ) => {
    try {
      const result = await playlistApi.addSongToPlaylist(playlistId, songId);
      return { playlistId, songId, alreadyExists: result.alreadyExists };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to add song to playlist",
      );
    }
  },
);

export const removeSongFromPlaylist = createAsyncThunk(
  "playlist/removeSongFromPlaylist",
  async ({ playlistId, songId }: { playlistId: number; songId: number }) => {
    await playlistApi.removeSongFromPlaylist(playlistId, songId);
    return { playlistId, songId };
  },
);

export const reorderPlaylist = createAsyncThunk(
  "playlist/reorderPlaylist",
  async ({
    playlistId,
    orderedSongIds,
  }: {
    playlistId: number;
    orderedSongIds: number[];
  }) => {
    await playlistApi.reorderPlaylist(playlistId, orderedSongIds);
    return { playlistId, orderedSongIds };
  },
);

const playlistSlice = createSlice({
  name: "playlist",
  initialState,
  reducers: {
    setActivePlaylist(state, action: PayloadAction<number | null>) {
      state.activePlaylistId = action.payload;
    },

    clearPlaylistError(state) {
      state.error = null;
    },

    clearPlaylistDetails(state) {
      state.playlistDetails = {};
    },

    resetPlaylistState(state) {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch user playlists
      .addCase(fetchUserPlaylists.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserPlaylists.fulfilled, (state, action) => {
        state.loading = false;
        state.userPlaylists = action.payload;
      })
      .addCase(fetchUserPlaylists.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch playlists";
      })

      // Fetch playlist detail
      .addCase(fetchPlaylistDetail.pending, (state, action) => {
        state.loadingDetail[action.meta.arg] = true;
        state.error = null;
      })
      .addCase(fetchPlaylistDetail.fulfilled, (state, action) => {
        state.loadingDetail[action.payload.id] = false;
        state.playlistDetails[action.payload.id] = action.payload;
      })
      .addCase(fetchPlaylistDetail.rejected, (state, action) => {
        state.loadingDetail[action.meta.arg] = false;
        state.error = action.error.message || "Failed to fetch playlist detail";
      })

      // Create playlist
      .addCase(createPlaylist.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPlaylist.fulfilled, (state, action) => {
        state.loading = false;
        state.userPlaylists.push(action.payload);
      })
      .addCase(createPlaylist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to create playlist";
      })

      // Delete playlist
      .addCase(deletePlaylist.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deletePlaylist.fulfilled, (state, action) => {
        state.loading = false;
        const playlistId = action.payload;
        state.userPlaylists = state.userPlaylists.filter(
          (p) => p.id !== playlistId,
        );
        delete state.playlistDetails[playlistId];
        if (state.activePlaylistId === playlistId) {
          state.activePlaylistId = null;
        }
      })
      .addCase(deletePlaylist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to delete playlist";
      })

      // Update playlist
      .addCase(updatePlaylist.fulfilled, (state, action) => {
        const updatedPlaylist = action.payload;
        const index = state.userPlaylists.findIndex(
          (p) => p.id === updatedPlaylist.id,
        );
        if (index !== -1) {
          state.userPlaylists[index] = updatedPlaylist;
        }

        // Update in details cache if exists
        if (state.playlistDetails[updatedPlaylist.id]) {
          state.playlistDetails[updatedPlaylist.id] = {
            ...state.playlistDetails[updatedPlaylist.id],
            name: updatedPlaylist.name,
            isPublic: updatedPlaylist.isPublic,
          };
        }
      })

      // Add song to playlist
      .addCase(addSongToPlaylist.fulfilled, (state, action) => {
        const { playlistId } = action.payload;

        // Invalidate playlist detail to force refresh
        if (state.playlistDetails[playlistId]) {
          delete state.playlistDetails[playlistId];
        }
      })
      .addCase(addSongToPlaylist.rejected, (state, action) => {
        state.error =
          (action.payload as string) || "Failed to add song to playlist";
      })

      // Remove song from playlist
      .addCase(removeSongFromPlaylist.fulfilled, (state, action) => {
        const { playlistId, songId } = action.payload;

        // Update playlist detail cache if exists
        if (state.playlistDetails[playlistId]) {
          state.playlistDetails[playlistId].items = state.playlistDetails[
            playlistId
          ].items.filter((item) => item.songId !== songId);
        }
      })
      .addCase(removeSongFromPlaylist.rejected, (state, action) => {
        state.error =
          action.error.message || "Failed to remove song from playlist";
      })

      // Reorder playlist
      .addCase(reorderPlaylist.fulfilled, (state, action) => {
        const { playlistId, orderedSongIds } = action.payload;

        // Update playlist detail cache if exists
        if (state.playlistDetails[playlistId]) {
          const itemsMap = new Map(
            state.playlistDetails[playlistId].items.map((item) => [
              item.songId,
              item,
            ]),
          );

          state.playlistDetails[playlistId].items = orderedSongIds
            .map((songId, index) => {
              const item = itemsMap.get(songId);
              return item ? { ...item, position: index } : null;
            })
            .filter((item): item is NonNullable<typeof item> => item !== null);
        }
      })
      .addCase(reorderPlaylist.rejected, (state, action) => {
        state.error = action.error.message || "Failed to reorder playlist";
      });
  },
});

export const {
  setActivePlaylist,
  clearPlaylistError,
  clearPlaylistDetails,
  resetPlaylistState,
} = playlistSlice.actions;

export default playlistSlice.reducer;
