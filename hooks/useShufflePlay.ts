import { useAppDispatch } from "@/features/store";
import {
  loadAndPlaySong,
  setQueue,
  setPlayerMinimized,
} from "@/features/slices/playerSlice";
import { getRandomInt } from "@/utils/random";
import type { SongResponseWithAllAlbum } from "@/types/music";

/**
 * Custom hook for shuffle play functionality
 * Shuffles songs array and starts playing from first shuffled song
 */
export const useShufflePlay = () => {
  const dispatch = useAppDispatch();

  const shuffleAndPlay = (songs: SongResponseWithAllAlbum[]) => {
    if (!songs || songs.length === 0) return;

    // Create shuffled copy using Fisher-Yates algorithm
    const shuffled = [...songs];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = getRandomInt(i + 1);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Set queue and play first song
    dispatch(setQueue({ songs: shuffled, startIndex: 0 }));
    dispatch(loadAndPlaySong(shuffled[0]));
    dispatch(setPlayerMinimized(true));
  };

  return { shuffleAndPlay };
};
