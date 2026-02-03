import { useAppDispatch, useAppSelector } from "@/features/store";
import {
  loadAndPlaySong,
  playSong,
  pauseSong,
  playNext as playNextAction,
  playPrevious as playPreviousAction,
  seekTo,
  setQueue,
  toggleRepeat,
  toggleShuffle,
  setPlayerMinimized,
} from "@/features/slices/playerSlice";
import type { SongResponseWithAllAlbum } from "@/types/music";

/**
 * Hook for controlling music player
 */
export const useMusicPlayer = () => {
  const dispatch = useAppDispatch();
  const playerState = useAppSelector((state) => state.player);

  const play = async (
    song: SongResponseWithAllAlbum,
    queue?: SongResponseWithAllAlbum[],
  ) => {
    if (queue) {
      const startIndex = queue.findIndex((s) => s.id === song.id);
      dispatch(
        setQueue({
          songs: queue,
          startIndex: startIndex >= 0 ? startIndex : 0,
        }),
      );
    }
    await dispatch(loadAndPlaySong(song));
  };

  const resume = async () => {
    await dispatch(playSong());
  };

  const pause = async () => {
    await dispatch(pauseSong());
  };

  const playNext = () => {
    dispatch(playNextAction());
    const nextSong = playerState.queue[playerState.currentIndex + 1];
    if (nextSong) {
      dispatch(loadAndPlaySong(nextSong));
    }
  };

  const playPrevious = () => {
    dispatch(playPreviousAction());
    const prevSong = playerState.queue[playerState.currentIndex - 1];
    if (prevSong) {
      dispatch(loadAndPlaySong(prevSong));
    }
  };

  const seek = async (positionMillis: number) => {
    await dispatch(seekTo(positionMillis));
  };

  const toggleRepeatMode = () => {
    dispatch(toggleRepeat());
  };

  const toggleShuffleMode = () => {
    dispatch(toggleShuffle());
  };

  const minimize = () => {
    dispatch(setPlayerMinimized(true));
  };

  const expand = () => {
    dispatch(setPlayerMinimized(false));
  };

  return {
    // State
    ...playerState,

    // Actions
    play,
    resume,
    pause,
    playNext,
    playPrevious,
    seek,
    toggleRepeat: toggleRepeatMode,
    toggleShuffle: toggleShuffleMode,
    minimize,
    expand,
  };
};
