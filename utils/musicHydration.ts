import { songApi } from "@/services/music/songApi";
import type { Song } from "@/types/music/song";
import type { SongResponseWithAllAlbum, TopSongPlayCounter } from "@/types/music";
import { normalizeTopSong } from "@/utils/musicNormalization";

const SONG_CACHE_TTL_MS = 5 * 60 * 1000;

interface CachedSong {
    song: Song;
    fetchedAt: number;
}

const songCache = new Map<number, CachedSong>();

const pendingFetches = new Map<number, Promise<Song | null>>();

function getCachedSong(id: number): Song | null {
    const entry = songCache.get(id);
    if (!entry) return null;
    if (Date.now() - entry.fetchedAt > SONG_CACHE_TTL_MS) {
        songCache.delete(id);
        return null;
    }
    return entry.song;
}

/**
 * Fetch a single song by ID, using:
 * 1. In-memory cache (TTL 5 min) to avoid re-fetching the same song
 * 2. Shared in-flight promise deduplication (no parallel requests for same ID)
 * 3. Centralized rate limiter + retry for actual network calls
 *
 * Exported so other modules (e.g. usePlaylistCovers) can share the same cache.
 */
export async function fetchSongCached(id: number): Promise<Song | null> {
    // Cache hit
    const cached = getCachedSong(id);
    if (cached) return cached;

    // Deduplicate in-flight requests for the same ID
    if (pendingFetches.has(id)) {
        return pendingFetches.get(id)!;
    }

    const fetchPromise = songApi.getSongById(id)
        .then(song => {
            if (song) {
                songCache.set(id, { song, fetchedAt: Date.now() });
            }
            return song ?? null;
        })
        .catch(() => null)
        .finally(() => {
            pendingFetches.delete(id);
        });

    pendingFetches.set(id, fetchPromise);
    return fetchPromise;
}

/** Clear the song cache (e.g. on logout) */
export function clearSongHydrationCache(): void {
    songCache.clear();
    pendingFetches.clear();
}

// ─── Main Hydration Function ──────────────────────────────────────────────────

export const hydrateSongs = async (
    items: (TopSongPlayCounter | SongResponseWithAllAlbum)[]
): Promise<SongResponseWithAllAlbum[]> => {
    try {
        // Use Promise.all to fire requests. 
        // The global axios queue will automatically space them out by 600ms.
        return await Promise.all(
            items.map(async (item) => {
                if ('songId' in item) {
                    const fullSong = await fetchSongCached(item.songId);
                    if (fullSong) {
                        return {
                            ...fullSong,
                            albums: fullSong.album ? [fullSong.album] : [],
                            playCount: Math.max(fullSong.playCount || 0, item.playCount),
                        } as unknown as SongResponseWithAllAlbum;
                    }
                    return normalizeTopSong(item);
                }
                return item;
            })
        );
    } catch (error) {
        console.error("Hydration failed", error);
        return items.map(normalizeTopSong);
    }
};
