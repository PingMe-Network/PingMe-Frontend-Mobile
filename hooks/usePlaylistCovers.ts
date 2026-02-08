import { useEffect, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "@/features/store";
import {
  setMultipleCoverImages,
  setLoadingIds,
  clearExpiredCache,
} from "@/features/slices/playlistCoversSlice";
import { playlistApi } from "@/services/music/playlistApi";
import { songApi } from "@/services/music";

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

  // Cache TTL: 5 phút
  const CACHE_TTL = 5 * 60 * 1000;

  // Tìm playlists cần load (chưa có trong cache hoặc đã hết hạn)
  const playlistsToLoad = useMemo(() => {
    const now = Date.now();
    return playlistIds.filter((id) => {
      const timestamp = cacheTimestamps[id];
      if (!timestamp) return true; // Chưa có trong cache
      return now - timestamp > CACHE_TTL; // Đã hết hạn
    });
  }, [playlistIds, cacheTimestamps]);

  useEffect(() => {
    // Clear expired cache khi component mount
    dispatch(clearExpiredCache());
  }, [dispatch]);

  useEffect(() => {
    if (playlistsToLoad.length === 0) return;

    const loadCovers = async () => {
      // Set loading state
      dispatch(setLoadingIds(playlistsToLoad));

      const newCoverMap: Record<number, string[]> = {};

      // Load playlist details parallel
      const promises = playlistsToLoad.map(async (playlistId) => {
        try {
          // Load playlist detail
          const detail = await playlistApi.getPlaylistDetail(playlistId);

          // Lấy tối đa 4 songIds đầu tiên
          const songIds = detail.items.slice(0, 4).map((item) => item.songId);

          if (songIds.length === 0) {
            newCoverMap[playlistId] = [];
            return;
          }

          // Load songs để lấy coverImageUrl
          const songPromises = songIds.map((songId) =>
            songApi.getSongById(songId).catch(() => null)
          );

          const songs = await Promise.all(songPromises);

          // Extract cover images
          const covers = songs
            .filter((song) => song !== null)
            .map((song) => song!.coverImageUrl)
            .filter((url): url is string => !!url);

          newCoverMap[playlistId] = covers;
        } catch (error) {
          console.error(
            `Failed to load covers for playlist ${playlistId}:`,
            error
          );
          newCoverMap[playlistId] = [];
        }
      });

      await Promise.all(promises);

      // Save to Redux cache
      dispatch(setMultipleCoverImages(newCoverMap));
      dispatch(setLoadingIds([]));
    };

    loadCovers();
  }, [playlistsToLoad.join(","), dispatch]);

  // Tạo coverImagesMap từ cache
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

