import { useState } from "react";
import { router } from "expo-router";
import { useAlert } from "@/components/ui/AlertProvider";
import { useFavorites } from "./useFavorites";
import { usePlaylists } from "./usePlaylists";
import type { SongResponseWithAllAlbum } from "@/types/music";

export function useSongActions() {
  const { isFavorite, toggle: toggleFavorite } = useFavorites();
  const { playlists, addSong } = usePlaylists();
  const { showAlert } = useAlert();

  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [showAddToPlaylistModal, setShowAddToPlaylistModal] = useState(false);
  const [selectedSong, setSelectedSong] =
    useState<SongResponseWithAllAlbum | null>(null);

  const handleMorePress = (song: SongResponseWithAllAlbum) => {
    setSelectedSong(song);
    setShowOptionsModal(true);
  };

  const handleShare = () => {
    if (!selectedSong) return;
    showAlert({
      type: "info",
      title: "Chia sẻ",
      message: `Chia sẻ "${selectedSong.title}" đang phát triển!`,
    });
  };

  const handleAddToPlaylist = () => {
    setShowAddToPlaylistModal(true);
  };

  const handleAddSongToPlaylist = async (playlistId: number) => {
    if (!selectedSong) return;
    try {
      await addSong(playlistId, selectedSong.id);
      showAlert({
        type: "success",
        title: "Thành công",
        message: `Đã thêm "${selectedSong.title}" vào playlist`,
      });
    } catch {
      showAlert({
        type: "error",
        title: "Lỗi",
        message: "Không thể thêm bài hát vào playlist",
      });
    }
  };

  const handleToggleFavorite = async () => {
    if (!selectedSong) return;
    try {
      await toggleFavorite(selectedSong.id);
      const action = isFavorite(selectedSong.id)
        ? "Đã xóa khỏi"
        : "Đã thêm vào";
      showAlert({
        type: "success",
        title: "Thành công",
        message: `${action} yêu thích "${selectedSong.title}"`,
      });
    } catch {
      showAlert({
        type: "error",
        title: "Lỗi",
        message: "Không thể cập nhật yêu thích",
      });
    }
  };

  const handleGoToAlbum = () => {
    if (!selectedSong?.albums?.[0]?.id) return;
    router.push(
      `/(app)/music/screens/AlbumDetail?id=${selectedSong.albums[0].id}`,
    );
  };

  const handleGoToArtist = () => {
    if (!selectedSong?.mainArtist?.id) return;
    router.push(
      `/(app)/music/screens/ArtistDetail?id=${selectedSong.mainArtist.id}`,
    );
  };

  return {
    selectedSong,
    showOptionsModal,
    showAddToPlaylistModal,
    setShowOptionsModal,
    setShowAddToPlaylistModal,
    handleMorePress,
    handleShare,
    handleAddToPlaylist,
    handleAddSongToPlaylist,
    handleToggleFavorite,
    handleGoToAlbum,
    handleGoToArtist,
    isFavorite,
    playlists,
  };
}
