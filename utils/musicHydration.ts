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

async function fetchSongsCached(ids: number[]): Promise<Map<number, Song>> {
    const songsById = new Map<number, Song>();
    const missingIds: number[] = [];

    ids.forEach((id) => {
        const cached = getCachedSong(id);
        if (cached) {
            songsById.set(id, cached);
            return;
        }
        missingIds.push(id);
    });

    const uniqueMissingIds = [...new Set(missingIds)];
    if (uniqueMissingIds.length === 0) {
        return songsById;
    }

    try {
        const fetchedSongs = await songApi.getSongsByIds(uniqueMissingIds);
        fetchedSongs.forEach((song) => {
            songCache.set(song.id, { song, fetchedAt: Date.now() });
            songsById.set(song.id, song);
        });
    } catch {
        const fallbackSongs = await Promise.all(uniqueMissingIds.map(fetchSongCached));
        fallbackSongs.forEach((song) => {
            if (song) songsById.set(song.id, song);
        });
    }

    return songsById;
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
        const songIds = items
            .filter((item): item is TopSongPlayCounter => 'songId' in item)
            .map((item) => item.songId);
        const songsById = await fetchSongsCached(songIds);

        return items.map((item) => {
            if ('songId' in item) {
                const fullSong = songsById.get(item.songId);
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
        });
    } catch (error) {
        console.error("Hydration failed", error);
        return items.map(normalizeTopSong);
    }
};
