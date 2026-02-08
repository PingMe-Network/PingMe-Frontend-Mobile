import { AddToPlaylistModal } from "./playlist/AddToPlaylistModal";
import CreatePlaylistModal from "./playlist/CreatePlaylistModal";

type PlaylistModalsWrapperProps = {
    isDark: boolean;
    selectedSong: { id: number; title: string } | null;
    playlists: any[];
    showAddToPlaylistModal: boolean;
    showCreatePlaylistModal: boolean;
    onCloseAddToPlaylist: () => void;
    onCloseCreatePlaylist: () => void;
    onAddToPlaylist: (playlistId: number) => Promise<void>;
    onCreatePlaylist: (name: string) => Promise<void>;
    onOpenCreatePlaylist: () => void;
};

/**
 * Wrapper component để render cả AddToPlaylistModal và CreatePlaylistModal
 * Giúp giảm duplicate code ở các screens
 */
export function PlaylistModalsWrapper({
    isDark,
    selectedSong,
    playlists,
    showAddToPlaylistModal,
    showCreatePlaylistModal,
    onCloseAddToPlaylist,
    onCloseCreatePlaylist,
    onAddToPlaylist,
    onCreatePlaylist,
    onOpenCreatePlaylist,
}: Readonly<PlaylistModalsWrapperProps>) {
    if (!selectedSong) return null;

    return (
        <>
            {/* Add to Playlist Modal */}
            <AddToPlaylistModal
                visible={showAddToPlaylistModal}
                isDark={isDark}
                songId={selectedSong.id}
                songTitle={selectedSong.title}
                playlists={playlists}
                onClose={onCloseAddToPlaylist}
                onAddToPlaylist={onAddToPlaylist}
                onCreatePlaylist={onOpenCreatePlaylist}
            />

            {/* Create Playlist Modal */}
            <CreatePlaylistModal
                visible={showCreatePlaylistModal}
                onClose={onCloseCreatePlaylist}
                onCreate={onCreatePlaylist}
            />
        </>
    );
}
