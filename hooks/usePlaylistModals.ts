import { useState } from "react";
import { usePlaylists } from "./usePlaylists";
import { useAlert } from "@/components/ui/AlertProvider";
import type { SongResponseWithAllAlbum } from "@/types/music";

export const usePlaylistModals = () => {
  const { playlists, addSong, create } = usePlaylists();
  const { showAlert } = useAlert();

  const [showAddToPlaylistModal, setShowAddToPlaylistModal] = useState(false);
  const [showCreatePlaylistModal, setShowCreatePlaylistModal] = useState(false);
  const [selectedSong, setSelectedSong] = useState<SongResponseWithAllAlbum | null>(null);

  /**
   * Mở modal "Thêm vào playlist"
   */
  const openAddToPlaylistModal = (song: SongResponseWithAllAlbum) => {
    setSelectedSong(song);
    setShowAddToPlaylistModal(true);
  };

  /**
   * Đóng modal "Thêm vào playlist"
   */
  const closeAddToPlaylistModal = () => {
    setShowAddToPlaylistModal(false);
  };

  /**
   * Mở modal "Tạo playlist mới"
   */
  const openCreatePlaylistModal = () => {
    setShowAddToPlaylistModal(false);
    setShowCreatePlaylistModal(true);
  };

  /**
   * Đóng modal "Tạo playlist mới"
   */
  const closeCreatePlaylistModal = () => {
    setShowCreatePlaylistModal(false);
  };

  /**
   * Thêm bài hát vào playlist có sẵn
   */
  const handleAddToPlaylist = async (playlistId: number) => {
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

  /**
   * Tạo playlist mới và tự động thêm bài hát vào
   */
  const handleCreatePlaylist = async (name: string) => {
    if (!selectedSong) return;

    try {
      // Tạo playlist mới
      const newPlaylist = await create(name, false);

      if (newPlaylist) {
        // Thêm bài hát vào playlist mới
        await addSong(newPlaylist.id, selectedSong.id);

        showAlert({
          type: "success",
          title: "Thành công",
          message: `Đã tạo playlist "${name}" và thêm "${selectedSong.title}"`,
        });
      }

      closeCreatePlaylistModal();
    } catch {
      showAlert({
        type: "error",
        title: "Lỗi",
        message: "Không thể tạo playlist. Vui lòng thử lại.",
      });
    }
  };

  return {
    // State
    playlists,
    selectedSong,
    showAddToPlaylistModal,
    showCreatePlaylistModal,

    // Actions
    openAddToPlaylistModal,
    closeAddToPlaylistModal,
    openCreatePlaylistModal,
    closeCreatePlaylistModal,
    handleAddToPlaylist,
    handleCreatePlaylist,
  };
};
