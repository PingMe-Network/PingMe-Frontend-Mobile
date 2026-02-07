import { SongOptionsModal, AddToPlaylistModal } from "@/components/music";
import { useSongActions } from "@/hooks/useSongActions";

interface SongModalsProps {
    isDark: boolean;
    optionsVariant?: "default" | "favorites";
    optionsFilter?: (option: any) => boolean;
    customOptionMap?: (option: any) => any;
}

export function useSongModals({
    isDark,
    optionsVariant = "default",
    optionsFilter,
    customOptionMap,
}: SongModalsProps) {
    const {
        selectedSong,
        showOptionsModal,
        showAddToPlaylistModal,
        setShowOptionsModal,
        setShowAddToPlaylistModal,
        handleMorePress,
        handleAddSongToPlaylist,
        playlists,
        getSongOptions,
    } = useSongActions();

    let options = getSongOptions(optionsVariant);

    if (optionsFilter) {
        options = options.filter(optionsFilter);
    }

    if (customOptionMap) {
        options = options.map(customOptionMap);
    }

    const modalsJSX = (
        <>
            <SongOptionsModal
                visible={showOptionsModal}
                isDark={isDark}
                song={selectedSong}
                onClose={() => setShowOptionsModal(false)}
                options={options}
            />

            {selectedSong && (
                <AddToPlaylistModal
                    visible={showAddToPlaylistModal}
                    isDark={isDark}
                    songId={selectedSong.id}
                    songTitle={selectedSong.title}
                    playlists={playlists}
                    onClose={() => setShowAddToPlaylistModal(false)}
                    onAddToPlaylist={handleAddSongToPlaylist}
                />
            )}
        </>
    );

    return {
        handleMorePress,
        modalsJSX,
        selectedSong,
    };
}
