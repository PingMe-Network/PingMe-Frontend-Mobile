import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/features/store";
import {
  fetchFavorites,
  toggleFavorite,
} from "@/features/slices/favoriteSlice";

/**
 * Hook for managing favorite songs
 */
export const useFavorites = () => {
  const dispatch = useAppDispatch();
  const { favorites, favoriteSongIds, loading, error } = useAppSelector(
    (state) => state.favorite,
  );

  useEffect(() => {
    if (favorites.length === 0 && !loading) {
      dispatch(fetchFavorites());
    }
  }, []);

  const isFavorite = (songId: number): boolean => {
    return favoriteSongIds.has(songId);
  };

  const toggle = async (songId: number) => {
    await dispatch(toggleFavorite(songId));
  };

  const refetch = async () => {
    await dispatch(fetchFavorites());
  };

  return {
    favorites,
    loading,
    error,
    isFavorite,
    toggle,
    refetch,
  };
};
