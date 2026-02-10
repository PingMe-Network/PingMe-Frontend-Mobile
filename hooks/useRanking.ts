import { useState, useEffect, useCallback } from "react";
import { songApi } from "@/services/music/songApi";
import type { TopSongPlayCounter, SongResponseWithAllAlbum } from "@/types/music";
import { hydrateSongs } from "@/utils/musicHydration";
import { useAppSelector } from "@/features/store";

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
            const results = await Promise.allSettled([
                songApi.getTopSongsToday(),
                songApi.getTopSongsThisWeek(),
                songApi.getTopSongsThisMonth(),
            ]);

            if (results[0].status === 'fulfilled') {
                const rawToday = results[0].value;
                const hydratedToday = await hydrateSongs(rawToday.slice(0, 5));
                // Merge hydrated data back into the full list (preserving order/count)
                const mergedToday = rawToday.map((item, index) => {
                    if (index < 5 && hydratedToday[index]) return hydratedToday[index];
                    return item;
                });
                setTopSongToday(mergedToday);
            }
            else console.error("Failed to fetch today's ranking:", results[0].reason);

            if (results[1].status === 'fulfilled') {
                const rawWeekly = results[1].value;
                const hydratedWeekly = await hydrateSongs(rawWeekly.slice(0, 5));
                const mergedWeekly = rawWeekly.map((item, index) => {
                    if (index < 5 && hydratedWeekly[index]) return hydratedWeekly[index];
                    return item;
                });
                setTopSongWeekly(mergedWeekly);
            }
            else console.error("Failed to fetch weekly ranking:", results[1].reason);

            if (results[2].status === 'fulfilled') {
                const rawMonthly = results[2].value;
                const hydratedMonthly = await hydrateSongs(rawMonthly.slice(0, 5));
                const mergedMonthly = rawMonthly.map((item, index) => {
                    if (index < 5 && hydratedMonthly[index]) return hydratedMonthly[index];
                    return item;
                });
                setTopSongMonthly(mergedMonthly);
            }
            else console.error("Failed to fetch monthly ranking:", results[2].reason);
        } catch (err) {
            console.error("Failed to fetch rankings:", err);
            setError(err);
        } finally {
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
