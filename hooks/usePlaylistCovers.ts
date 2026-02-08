import { useEffect, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "@/features/store";
import {
  setMultipleCoverImages,
  setLoadingIds,
  clearExpiredCache,
} from "@/features/slices/playlistCoversSlice";
import { playlistApi } from "@/services/music/playlistApi";
import { songApi } from "@/services/music";

// Helper function separated to reduce nesting depth
const fetchPlaylistCovers = async (
  playlistId: number
): Promise<[number, string[]]> => {
  try {
    const detail = await playlistApi.getPlaylistDetail(playlistId);
    
    // Get up to 4 distinct song IDs
    const songIds = detail.items.slice(0, 4).map((item) => item.songId);

    if (songIds.length === 0) {
      return [playlistId, []];
    }

    // Fetch songs in parallel
    const songs = await Promise.all(
      songIds.map((id) => songApi.getSongById(id).catch(() => null))
    );

    // Extract valid cover URLs
    const covers = songs
      .filter((s) => s?.coverImageUrl)
      .map((s) => s!.coverImageUrl!);

    return [playlistId, covers];
  } catch {
    // Return empty covers on error
    return [playlistId, []];
  }
};

export const usePlaylistCovers = (playlistIds: number[]) => {
  const dispatch = useAppDispatch();
  const coverImagesCache = useAppSelector(
    (state) => state.playlistCovers.coverImagesCache
  );
  const cacheTimestamps = useAppSelector(
    (state) => state.playlistCovers.cacheTimestamps
  );
  const loadingIds = useAppSelector(
    (state) => state.playlistCovers.loadingIds
  );

  // Cache TTL: 5 minutes
  const CACHE_TTL = 5 * 60 * 1000;

  // Identify playlists needing updates (not in cache or expired)
  const playlistsToLoad = useMemo(() => {
    const now = Date.now();
    return playlistIds.filter((id) => {
      const timestamp = cacheTimestamps[id];
      if (!timestamp) return true;
      return now - timestamp > CACHE_TTL;
    });
  }, [playlistIds, cacheTimestamps]);

  // Clear expired cache on mount
  useEffect(() => {
    dispatch(clearExpiredCache());
  }, [dispatch]);

  // Load missing covers
  useEffect(() => {
    if (playlistsToLoad.length === 0) return;

    const loadCovers = async () => {
      dispatch(setLoadingIds(playlistsToLoad));

      const results = await Promise.all(
        playlistsToLoad.map(fetchPlaylistCovers)
      );

      const newCoverMap = Object.fromEntries(results);

      dispatch(setMultipleCoverImages(newCoverMap));
      dispatch(setLoadingIds([]));
    };

    loadCovers();
  }, [playlistsToLoad.join(","), dispatch]);

  // Derived state for easy access
  const coverImagesMap = useMemo(() => {
    const map: Record<number, string[]> = {};
    playlistIds.forEach((id) => {
      map[id] = coverImagesCache[id] || [];
    });
    return map;
  }, [playlistIds, coverImagesCache]);

  const loading = loadingIds.length > 0;

  return { coverImagesMap, loading };
};
