import { useState, useEffect, useCallback } from "react";
import { songApi } from "@/services/music/songApi";
import type { TopSongPlayCounter, SongResponseWithAllAlbum } from "@/types/music";
import { hydrateSongs } from "@/utils/musicHydration";
import { useAppSelector } from "@/features/store";

const PREVIEW_HYDRATE_LIMIT = 3;

type RankingItem = TopSongPlayCounter | SongResponseWithAllAlbum;

/**
 * Helper to hydrate a ranking list sequentially to avoid 429 errors.
 */
const handleRankingHydration = async (
    result: PromiseSettledResult<RankingItem[]>,
    setter: React.Dispatch<React.SetStateAction<RankingItem[]>>,
    label: string
) => {
    if (result.status === 'fulfilled') {
        try {
            const hydrated = await hydrateSongs(result.value.slice(0, PREVIEW_HYDRATE_LIMIT));
            setter(prev => {
                const merged = [...prev];
                hydrated.forEach((song, idx) => {
                    if (merged[idx]) merged[idx] = song;
                });
                return merged;
            });
        } catch (e) {
            console.error(`Failed to hydrate ${label} ranking:`, e);
        }
    } else {
        console.error(`Failed to fetch ${label} ranking:`, result.reason);
    }
};

export const useRanking = () => {
    const [topSongToday, setTopSongToday] = useState<RankingItem[]>([]);
    const [topSongWeekly, setTopSongWeekly] = useState<RankingItem[]>([]);
    const [topSongMonthly, setTopSongMonthly] = useState<RankingItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<unknown>(null);

    const { hasCountedPlay } = useAppSelector(state => state.player);

    const fetchRankings = useCallback(async () => {
        setLoading(true);
        try {
            // ─── Step 1: fetch the raw ranking lists (3 requests total) ───
            // Run these 3 concurrently — they are lightweight list calls, not
            // per-song fetches, so they won't cause 429s.
            const [todayResult, weeklyResult, monthlyResult] = await Promise.allSettled([
                songApi.getTopSongsToday(),
                songApi.getTopSongsThisWeek(),
                songApi.getTopSongsThisMonth(),
            ]);

            // ─── Step 2: Set raw (un-hydrated) data immediately for fast paint ───
            if (todayResult.status === 'fulfilled') setTopSongToday(todayResult.value);
            if (weeklyResult.status === 'fulfilled') setTopSongWeekly(weeklyResult.value);
            if (monthlyResult.status === 'fulfilled') setTopSongMonthly(monthlyResult.value);

            setLoading(false); // unblock UI immediately with raw data

            // ─── Step 3: Hydrate SEQUENTIALLY (one list at a time) ───
            // This is the key fix: previously all 3 hydrations ran in parallel,
            // causing up to 15 concurrent getSongById requests → 429.
            // Now they run one after the other through the shared rate limiter.

            await handleRankingHydration(todayResult, setTopSongToday, "today's");
            await handleRankingHydration(weeklyResult, setTopSongWeekly, "weekly");
            await handleRankingHydration(monthlyResult, setTopSongMonthly, "monthly");
        } catch (err) {
            console.error("Failed to fetch rankings:", err);
            setError(err);
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRankings();
    }, [fetchRankings]);

    // Auto-refresh when a new song play is counted
    useEffect(() => {
        if (hasCountedPlay) {
            // Delay 3s to allow backend to update DB
            const timer = setTimeout(() => {
                fetchRankings();
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [hasCountedPlay, fetchRankings]);

    return {
        topSongToday,
        topSongWeekly,
        topSongMonthly,
        loading,
        error,
        refetch: fetchRankings
    };
};
