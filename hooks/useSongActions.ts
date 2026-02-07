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
    if (!selectedSong) return;

    const songData = selectedSong as any;
    const albumId = songData.album?.id || songData.albums?.id;

    if (!albumId) {
      showAlert({
        type: "info",
        title: "Thông báo",
        message: "Bài hát này không có album",
      });
      return;
    }

    setShowOptionsModal(false);
    router.push(`/(app)/music/screens/AlbumDetail?id=${albumId}`);
  };

  const handleGoToArtist = () => {
    if (!selectedSong) return;

    if (!selectedSong.mainArtist?.id) {
      showAlert({
        type: "info",
        title: "Thông báo",
        message: "Bài hát này không có thông tin nghệ sĩ",
      });
      return;
    }

    setShowOptionsModal(false);
    router.push(
      `/(app)/music/screens/ArtistDetail?id=${selectedSong.mainArtist.id}`,
    );
  };

  // Standard song options
  const getSongOptions = (variant: "default" | "favorites" = "default") => {
    if (variant === "favorites") {
      return [
        {
          id: "share",
          label: "Chia sẻ",
          icon: "share-outline" as const,
          action: handleShare,
        },
        {
          id: "add-to-playlist",
          label: "Thêm vào playlist",
          icon: "add-circle-outline" as const,
          action: handleAddToPlaylist,
        },
        {
          id: "remove-favorite",
          label: "Xóa khỏi yêu thích",
          icon: "heart-dislike-outline" as const,
          action: handleToggleFavorite,
        },
        {
          id: "go-to-album",
          label: "Chuyển đến album",
          icon: "disc-outline" as const,
          action: handleGoToAlbum,
        },
        {
          id: "go-to-artist",
          label: "Chuyển đến nghệ sĩ",
          icon: "person-outline" as const,
          action: handleGoToArtist,
        },
      ];
    }

    // Default variant
    return [
      {
        id: "share",
        label: "Chia sẻ",
        icon: "share-outline" as const,
        action: handleShare,
      },
      {
        id: "add-to-playlist",
        label: "Thêm vào playlist",
        icon: "add-circle-outline" as const,
        action: handleAddToPlaylist,
      },
      {
        id: "favorite",
        label: isFavorite(selectedSong?.id || 0)
          ? "Xóa khỏi yêu thích"
          : "Thêm vào yêu thích",
        icon: isFavorite(selectedSong?.id || 0)
          ? ("heart-dislike-outline" as const)
          : ("heart-outline" as const),
        action: handleToggleFavorite,
      },
      {
        id: "go-to-album",
        label: "Chuyển đến album",
        icon: "disc-outline" as const,
        action: handleGoToAlbum,
      },
      {
        id: "go-to-artist",
        label: "Chuyển đến nghệ sĩ",
        icon: "person-outline" as const,
        action: handleGoToArtist,
      },
    ];
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
    getSongOptions,
  };
}
