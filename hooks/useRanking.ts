import { useState, useEffect, useCallback } from "react";
import { songApi } from "@/services/music/songApi";
import type { TopSongPlayCounter, SongResponseWithAllAlbum } from "@/types/music";
import { hydrateSongs } from "@/utils/musicHydration";
import { useAppSelector } from "@/features/store";

const PREVIEW_HYDRATE_LIMIT = 3;

export const useRanking = () => {
    const [topSongToday, setTopSongToday] = useState<(TopSongPlayCounter | SongResponseWithAllAlbum)[]>([]);
    const [topSongWeekly, setTopSongWeekly] = useState<(TopSongPlayCounter | SongResponseWithAllAlbum)[]>([]);
    const [topSongMonthly, setTopSongMonthly] = useState<(TopSongPlayCounter | SongResponseWithAllAlbum)[]>([]);
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

            if (todayResult.status === 'fulfilled') {
                const rawToday = todayResult.value;
                try {
                    const hydratedToday = await hydrateSongs(rawToday.slice(0, PREVIEW_HYDRATE_LIMIT));
                    setTopSongToday(prev => {
                        const merged = [...prev];
                        hydratedToday.forEach((song, idx) => {
                            if (merged[idx]) merged[idx] = song;
                        });
                        return merged;
                    });
                } catch (e) {
                    console.error("Failed to hydrate today's ranking:", e);
                }
            } else {
                console.error("Failed to fetch today's ranking:", todayResult.reason);
            }

            if (weeklyResult.status === 'fulfilled') {
                const rawWeekly = weeklyResult.value;
                try {
                    const hydratedWeekly = await hydrateSongs(rawWeekly.slice(0, PREVIEW_HYDRATE_LIMIT));
                    setTopSongWeekly(prev => {
                        const merged = [...prev];
                        hydratedWeekly.forEach((song, idx) => {
                            if (merged[idx]) merged[idx] = song;
                        });
                        return merged;
                    });
                } catch (e) {
                    console.error("Failed to hydrate weekly ranking:", e);
                }
            } else {
                console.error("Failed to fetch weekly ranking:", weeklyResult.reason);
            }

            if (monthlyResult.status === 'fulfilled') {
                const rawMonthly = monthlyResult.value;
                try {
                    const hydratedMonthly = await hydrateSongs(rawMonthly.slice(0, PREVIEW_HYDRATE_LIMIT));
                    setTopSongMonthly(prev => {
                        const merged = [...prev];
                        hydratedMonthly.forEach((song, idx) => {
                            if (merged[idx]) merged[idx] = song;
                        });
                        return merged;
                    });
                } catch (e) {
                    console.error("Failed to hydrate monthly ranking:", e);
                }
            } else {
                console.error("Failed to fetch monthly ranking:", monthlyResult.reason);
            }
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
