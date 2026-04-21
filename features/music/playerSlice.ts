import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";
import { createAudioPlayer, setAudioModeAsync, type AudioStatus } from "expo-audio";
import type { SongResponseWithAllAlbum } from "@/types/music";
import { logoutThunk } from "@/features/auth/authThunk";
import { getRandomInt } from "@/utils/random";
import { songCrudService } from "@/services/music/songCrudService";

let globalAudioPlayer: any = null;

export type RepeatMode = "off" | "one" | "all";
export type PlaybackState =
  | "playing"
  | "paused"
  | "stopped"
  | "loading"
  | "buffering"
  | "error";

interface PlayerState {
  // Current playback
  currentSong: SongResponseWithAllAlbum | null;

  // Playback status
  playbackState: PlaybackState;
  isPlaying: boolean;
  position: number; // milliseconds
  duration: number; // milliseconds
  buffering: boolean;

  // Queue management
  queue: SongResponseWithAllAlbum[];
  currentIndex: number;
  originalQueue: SongResponseWithAllAlbum[]; // For shuffle restoration

  // Playback settings
  volume: number; // 0.0 to 1.0
  isMuted: boolean;
  repeatMode: RepeatMode;
  isShuffled: boolean;

  // Error handling
  error: string | null;

  // History
  playHistory: number[]; // Song IDs

  // UI state
  isPlayerMinimized: boolean;

  // Auto-play flag
  shouldPlayNext: boolean;

  // Play analytics
  hasCountedPlay: boolean;
}

const initialState: PlayerState = {
  currentSong: null,
  playbackState: "stopped",
  isPlaying: false,
  position: 0,
  duration: 0,
  buffering: false,
  queue: [],
  currentIndex: -1,
  originalQueue: [],
  volume: 1,
  isMuted: false,
  repeatMode: "off",
  isShuffled: false,
  error: null,
  playHistory: [],
  isPlayerMinimized: true,
  shouldPlayNext: false,
  hasCountedPlay: false,
};

// Async Thunks
export const loadAndPlaySong = createAsyncThunk(
  "player/loadAndPlaySong",
  async (song: SongResponseWithAllAlbum, { dispatch, getState }) => {
    try {
      // Get current state to check for existing sound
      if (globalAudioPlayer) {
        if (typeof globalAudioPlayer.pause === "function") {
          globalAudioPlayer.pause();
        }
        if (typeof globalAudioPlayer.remove === "function") {
          globalAudioPlayer.remove();
        }
      }
      globalAudioPlayer = null;

      // Configure audio mode
      await setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: true,
        interruptionMode: 'duckOthers',
      });

      if (!song.songUrl) {
        throw new Error("Cannot play song: Missing audio URL (possibly due to failed hydration)");
      }

      globalAudioPlayer = createAudioPlayer(song.songUrl);
      globalAudioPlayer.play();

      let lastUpdate = 0;
      // @ts-ignore: addListener exists at runtime but may be missing in type definitions
      globalAudioPlayer.addListener('playbackStatusUpdate', (status: AudioStatus) => {
        const now = Date.now();
        const isSignificantChange = status.isLoaded && (status.didJustFinish || status.isBuffering);
        if (now - lastUpdate > 500 || isSignificantChange) {
            dispatch(updatePlaybackStatus(status));
            lastUpdate = now;
        }

        // Check for play count increment (50% progress)
        if (status.isLoaded && status.duration) {
          const progress = status.currentTime / status.duration;
          if (progress >= 0.5) {
            // Wrap in setTimeout to avoid calling getState while reducer is executing
            setTimeout(() => {
              const currentState = getState() as { player: PlayerState };
              // Ensure we only count once per song session
              if (
                !currentState.player.hasCountedPlay &&
                currentState.player.currentSong?.id === song.id
              ) {
                dispatch(markPlayCounted());
                songCrudService.increasePlayCount(song.id).catch((err) => {
                  console.error("Failed to increase play count:", err);
                });
              }
            }, 0);
          }
        }
      });

      return { song };
    } catch (error) {
      throw new Error(`Failed to load song: ${error}`);
    }
  },
);

export const playSong = createAsyncThunk(
  "player/playSong",
  async (_, { getState }) => {
    if (globalAudioPlayer) { globalAudioPlayer.play(); }
  },
);

export const pauseSong = createAsyncThunk(
  "player/pauseSong",
  async (_, { getState }) => {
    if (globalAudioPlayer) { globalAudioPlayer.pause(); }
  },
);

export const seekTo = createAsyncThunk(
  "player/seekTo",
  async (positionMillis: number, { getState }) => {
    if (globalAudioPlayer) { await globalAudioPlayer.seekTo(positionMillis / 1000); }
    return positionMillis;
  },
);

export const setVolume = createAsyncThunk(
  "player/setVolume",
  async (volume: number, { getState }) => {
    if (globalAudioPlayer) { globalAudioPlayer.volume = volume; }
    return volume;
  },
);

// Play next song in queue
export const playNextSong = createAsyncThunk(
  "player/playNextSong",
  async (_, { getState, dispatch }) => {
    const state = getState() as { player: PlayerState };
    const { queue, currentIndex, repeatMode, currentSong } = state.player;

    // Handle repeat one - replay current song
    if (repeatMode === "one" && currentSong) {
      await dispatch(loadAndPlaySong(currentSong));
      return currentIndex;
    }

    let nextIndex: number;

    if (currentIndex < queue.length - 1) {
      nextIndex = currentIndex + 1;
    } else if (repeatMode === "all") {
      nextIndex = 0;
    } else {
      // No next song
      return null;
    }

    const nextSong = queue[nextIndex];
    if (nextSong) {
      await dispatch(loadAndPlaySong(nextSong));
      return nextIndex;
    }
    return null;
  },
);

// Play previous song in queue
export const playPreviousSong = createAsyncThunk(
  "player/playPreviousSong",
  async (_, { getState, dispatch }) => {
    const state = getState() as { player: PlayerState };
    const { queue, currentIndex, repeatMode, position } = state.player;

    // If more than 3 seconds into song, restart current song
    if (position > 3000) {
      await dispatch(seekTo(0));
      return currentIndex;
    }

    let prevIndex: number;

    if (currentIndex > 0) {
      prevIndex = currentIndex - 1;
    } else if (repeatMode === "all") {
      prevIndex = queue.length - 1;
    } else {
      // Restart current song
      await dispatch(seekTo(0));
      return currentIndex;
    }

    const prevSong = queue[prevIndex];
    if (prevSong) {
      await dispatch(loadAndPlaySong(prevSong));
      return prevIndex;
    }
    return null;
  },
);

const playerSlice = createSlice({
  name: "player",
  initialState,
  reducers: {
    // Queue management
    setQueue(
      state,
      action: PayloadAction<{
        songs: SongResponseWithAllAlbum[];
        startIndex?: number;
      }>,
    ) {
      state.queue = action.payload.songs;
      state.currentIndex = action.payload.startIndex ?? 0;
      state.originalQueue = [...action.payload.songs];
    },

    addToQueue(state, action: PayloadAction<SongResponseWithAllAlbum>) {
      state.queue.push(action.payload);
    },

    addToQueueNext(state, action: PayloadAction<SongResponseWithAllAlbum>) {
      state.queue.splice(state.currentIndex + 1, 0, action.payload);
    },

    removeFromQueue(state, action: PayloadAction<number>) {
      const index = action.payload;
      state.queue.splice(index, 1);
      if (state.currentIndex >= index && state.currentIndex > 0) {
        state.currentIndex--;
      }
    },

    clearQueue(state) {
      state.queue = [];
      state.currentIndex = -1;
      state.originalQueue = [];
    },

    // Playback controls
    playNext(state) {
      if (state.currentIndex < state.queue.length - 1) {
        state.currentIndex++;
      } else if (state.repeatMode === "all") {
        state.currentIndex = 0;
      }
    },

    playPrevious(state) {
      if (state.position > 3000) {
        // If more than 3 seconds, restart current song
        // Will be handled by seeking to 0
      } else if (state.currentIndex > 0) {
        state.currentIndex--;
      } else if (state.repeatMode === "all") {
        state.currentIndex = state.queue.length - 1;
      }
    },

    // Playback settings
    toggleRepeat(state) {
      const modes: RepeatMode[] = ["off", "all", "one"];
      const currentModeIndex = modes.indexOf(state.repeatMode);
      state.repeatMode = modes[(currentModeIndex + 1) % modes.length];
    },

    setRepeatMode(state, action: PayloadAction<RepeatMode>) {
      state.repeatMode = action.payload;
    },

    toggleShuffle(state) {
      state.isShuffled = !state.isShuffled;

      if (state.isShuffled) {
        // Save current song
        const currentSong = state.queue[state.currentIndex];

        // Shuffle queue using Fisher-Yates algorithm
        const shuffled = [...state.queue];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = getRandomInt(i + 1);
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }

        // Move current song to front
        if (currentSong) {
          const currentSongIndex = shuffled.findIndex(
            (s) => s.id === currentSong.id,
          );
          if (currentSongIndex > 0) {
            [shuffled[0], shuffled[currentSongIndex]] = [
              shuffled[currentSongIndex],
              shuffled[0],
            ];
          }
        }

        state.queue = shuffled;
        state.currentIndex = 0;
      } else {
        // Restore original queue
        const currentSong = state.queue[state.currentIndex];
        state.queue = [...state.originalQueue];

        // Find current song in original queue
        if (currentSong) {
          const originalIndex = state.queue.findIndex(
            (s) => s.id === currentSong.id,
          );
          state.currentIndex = originalIndex === -1 ? 0 : originalIndex;
        }
      }
    },

    toggleMute(state) {
      state.isMuted = !state.isMuted;
    },

    // UI state
    togglePlayerMinimized(state) {
      state.isPlayerMinimized = !state.isPlayerMinimized;
    },

    setPlayerMinimized(state, action: PayloadAction<boolean>) {
      state.isPlayerMinimized = action.payload;
    },

    clearShouldPlayNext(state) {
      state.shouldPlayNext = false;
    },

    // Playback status update from expo-audio
    updatePlaybackStatus(state, action: PayloadAction<AudioStatus>) {
      const status = action.payload;

      if (status.isLoaded) {
        state.isPlaying = status.playing;
        state.position = status.currentTime * 1000;
        state.duration = status.duration * 1000 || 0;
        state.buffering = status.isBuffering;

        // Handle song end
        if (status.didJustFinish && !status.loop) {
          state.playbackState = "stopped";
          state.shouldPlayNext = true;
        } else if (status.isBuffering) {
          state.playbackState = "buffering";
        } else if (status.playing) {
          state.playbackState = "playing";
        } else {
          state.playbackState = "paused";
        }
      }
    },

    // History
    addToHistory(state, action: PayloadAction<number>) {
      state.playHistory.unshift(action.payload);
      // Keep only last 100 songs
      if (state.playHistory.length > 100) {
        state.playHistory = state.playHistory.slice(0, 100);
      }
    },

    clearHistory(state) {
      state.playHistory = [];
    },

    // Error handling
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
      if (action.payload) {
        state.playbackState = "error";
      }
    },

    clearError(state) {
      state.error = null;
    },

    // Play analytics
    markPlayCounted(state) {
      state.hasCountedPlay = true;
    },

    // Cleanup
    resetPlayer(state) {
        if (globalAudioPlayer) {
          if (typeof globalAudioPlayer.pause === "function") { globalAudioPlayer.pause(); }
          if (typeof globalAudioPlayer.remove === "function") { globalAudioPlayer.remove(); }
          globalAudioPlayer = null; 
        }
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      // Load and play song
      .addCase(loadAndPlaySong.pending, (state) => {
        state.playbackState = "loading";
        state.error = null;
      })
      .addCase(loadAndPlaySong.fulfilled, (state, action) => {
        state.currentSong = action.payload.song;
        state.playbackState = "playing";
        state.isPlaying = true;
        state.position = 0;
        state.error = null;

        // Add to history
        state.playHistory.unshift(action.payload.song.id);
        if (state.playHistory.length > 100) {
          state.playHistory = state.playHistory.slice(0, 100);
        }

        // Reset analytics flag for new song
        state.hasCountedPlay = false;
      })
      .addCase(loadAndPlaySong.rejected, (state, action) => {
        state.error = action.error.message || "Failed to load song";
        state.playbackState = "error";
      })

      // Play
      .addCase(playSong.fulfilled, (state) => {
        state.isPlaying = true;
        state.playbackState = "playing";
      })

      // Pause
      .addCase(pauseSong.fulfilled, (state) => {
        state.isPlaying = false;
        state.playbackState = "paused";
      })

      // Seek
      .addCase(seekTo.fulfilled, (state, action) => {
        state.position = action.payload;
      })

      // Volume
      .addCase(setVolume.fulfilled, (state, action) => {
        state.volume = action.payload;
      })

      // Play next song
      .addCase(playNextSong.fulfilled, (state, action) => {
        if (action.payload !== null) {
          state.currentIndex = action.payload;
        }
      })

      // Play previous song
      .addCase(playPreviousSong.fulfilled, (state, action) => {
        if (action.payload !== null) {
          state.currentIndex = action.payload;
        }
      })

      // Reset player on logout
      .addCase(logoutThunk.fulfilled, (state) => {
        // Unload sound if exists
          if (globalAudioPlayer) {
          if (typeof globalAudioPlayer.pause === "function") { globalAudioPlayer.pause(); }
          if (typeof globalAudioPlayer.remove === "function") { globalAudioPlayer.remove(); }
          globalAudioPlayer = null; 
        }
        // Reset to initial state
        return initialState;
      });
  },
});

export const {
  setQueue,
  addToQueue,
  addToQueueNext,
  removeFromQueue,
  clearQueue,
  playNext,
  playPrevious,
  toggleRepeat,
  setRepeatMode,
  toggleShuffle,
  toggleMute,
  togglePlayerMinimized,
  setPlayerMinimized,
  clearShouldPlayNext,
  updatePlaybackStatus,
  addToHistory,
  clearHistory,
  setError,
  clearError,
  resetPlayer,
  markPlayCounted,
} = playerSlice.actions;

export default playerSlice.reducer;
