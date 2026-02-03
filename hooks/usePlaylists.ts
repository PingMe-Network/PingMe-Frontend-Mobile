import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/features/store";
import {
  fetchUserPlaylists,
  fetchPlaylistDetail,
  createPlaylist,
  addSongToPlaylist,
  removeSongFromPlaylist,
} from "@/features/slices/playlistSlice";

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
  }, []);

  const getPlaylistDetail = async (playlistId: number) => {
    if (!playlistDetails[playlistId]) {
      await dispatch(fetchPlaylistDetail(playlistId));
    }
    return playlistDetails[playlistId];
  };

  const create = async (name: string, isPublic: boolean = false) => {
    await dispatch(createPlaylist({ name, isPublic }));
  };

  const addSong = async (playlistId: number, songId: number) => {
    await dispatch(addSongToPlaylist({ playlistId, songId }));
  };

  const removeSong = async (playlistId: number, songId: number) => {
    await dispatch(removeSongFromPlaylist({ playlistId, songId }));
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
    addSong,
    removeSong,
    refetch,
  };
};
