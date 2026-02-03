import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/features/store";
import { fetchMusicData } from "@/features/slices/musicSlice";
import { CACHE_DURATION } from "@/constants/musicConstants";

/**
 * Hook to fetch and cache music data
 * Automatically fetches if cache is expired or empty
 */
export const useMusicData = (
  limit: number = 10,
  forceRefresh: boolean = false,
) => {
  const dispatch = useAppDispatch();
  const {
    topSongs,
    popularAlbums,
    popularArtists,
    allGenres,
    loading,
    error,
    lastFetched,
  } = useAppSelector((state) => state.music);

  useEffect(() => {
    const isCacheExpired = lastFetched
      ? Date.now() - lastFetched > CACHE_DURATION
      : true;

    const shouldFetch = forceRefresh || isCacheExpired || topSongs.length === 0;

    if (shouldFetch && !loading) {
      dispatch(fetchMusicData(limit));
    }
  }, [forceRefresh]);

  return {
    topSongs,
    popularAlbums,
    popularArtists,
    allGenres,
    loading,
    error,
    isCacheValid: lastFetched
      ? Date.now() - lastFetched < CACHE_DURATION
      : false,
    refetch: () => dispatch(fetchMusicData(limit)),
  };
};
