import { songApi } from "@/services/music/songApi";
import type { SongResponseWithAllAlbum, TopSongPlayCounter } from "@/types/music";
import { normalizeTopSong } from "@/utils/musicNormalization";

export const hydrateSongs = async (
    items: (TopSongPlayCounter | SongResponseWithAllAlbum)[]
): Promise<SongResponseWithAllAlbum[]> => {
    try {
        const hydrationPromises = items.map(async (item) => {
            // Check if it's a TopSongPlayCounter (has 'songId') or needs hydration
            if ('songId' in item) {
                try {
                    const fullSong = await songApi.getSongById(item.songId);
                    if (fullSong) {
                        // Adapt SongResponse to SongResponseWithAllAlbum structure
                        return {
                            ...fullSong,
                            albums: fullSong.album ? [fullSong.album] : [],
                            // Ensure playCount matches the ranking data if it's higher (e.g. real-time counter vs stored)
                            playCount: Math.max(fullSong.playCount || 0, item.playCount)
                        } as unknown as SongResponseWithAllAlbum;
                    }
                } catch (e) {
                    console.warn(`Failed to hydrate song ${item.songId}:${item.title}`, e);
                }
                // Fallback to normalized version of the input item if hydration fails
                return normalizeTopSong(item);
            }
            // Already a full song object (or close enough)
            return item;
        });
        
        return await Promise.all(hydrationPromises);
    } catch (error) {
        console.error("Hydration failed for batch", error);
        // Fallback: return everything normalized without hydration
        return items.map(normalizeTopSong);
    }
};
