import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/features/store";
import {
  fetchUserPlaylists,
  fetchPlaylistDetail,
  createPlaylist,
  updatePlaylist,
  deletePlaylist,
  addSongToPlaylist,
  removeSongFromPlaylist,
} from "@/features/slices/playlistSlice";
import { invalidatePlaylistCache } from "@/features/slices/playlistCoversSlice";
import type { PlaylistDto } from "@/types/music/playlist";

/**
 * Hook for managing playlists
 */
export const usePlaylists = () => {
  const dispatch = useAppDispatch();
  const { userPlaylists, playlistDetails, activePlaylistId, loading, error } =
    useAppSelector((state) => state.playlist);

  useEffect(() => {
    if (userPlaylists.length === 0 && !loading) {
      dispatch(fetchUserPlaylists());
    }
  }, [dispatch, userPlaylists.length, loading]);

  const getPlaylistDetail = async (playlistId: number) => {
    if (!playlistDetails[playlistId]) {
      await dispatch(fetchPlaylistDetail(playlistId));
    }
    return playlistDetails[playlistId];
  };

  const create = async (name: string, isPublic: boolean = false) => {
    const result = await dispatch(createPlaylist({ name, isPublic }));
    return result.payload as PlaylistDto;
  };

  const addSong = async (playlistId: number, songId: number) => {
    await dispatch(addSongToPlaylist({ playlistId, songId }));
    // Invalidate cache vì playlist đã thay đổi
    dispatch(invalidatePlaylistCache(playlistId));
  };

  const update = async (
    playlistId: number,
    data: { name?: string; isPublic?: boolean },
  ) => {
    await dispatch(updatePlaylist({ playlistId, data }));
    // Không cần invalidate cache vì chỉ đổi tên/privacy, không đổi songs
  };

  const removeSong = async (playlistId: number, songId: number) => {
    await dispatch(removeSongFromPlaylist({ playlistId, songId }));
    // Invalidate cache vì playlist đã thay đổi
    dispatch(invalidatePlaylistCache(playlistId));
  };

  const deletePlaylistById = async (playlistId: number) => {
    await dispatch(deletePlaylist(playlistId));
    // Invalidate cache vì playlist đã bị xóa
    dispatch(invalidatePlaylistCache(playlistId));
  };

  const refetch = async () => {
    await dispatch(fetchUserPlaylists());
  };

  return {
    playlists: userPlaylists,
    playlistDetails,
    activePlaylistId,
    loading,
    error,
    getPlaylistDetail,
    create,
    update,
    addSong,
    removeSong,
    deletePlaylistById,
    refetch,
  };
};
