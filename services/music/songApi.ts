import axiosClient from "@/lib/axiosClient";
import type { Song } from "@/types/music/song";
import type {
  TopSongPlayCounter,
  SongResponseWithAllAlbum,
} from "@/types/music";
import type { ApiResponse, PageResponse } from "@/types/base/apiResponse";

export const songApi = {
  /**
   * Get top songs
   * @returns Array of songs (unwrapped from ApiResponse)
   */
  getTopSongs: async (
    number = 10,
  ): Promise<SongResponseWithAllAlbum[]> => {
    const response = await axiosClient.get<
      ApiResponse<SongResponseWithAllAlbum[]>
    >(`/songs/getTopSong/${number}`);
    return response.data?.data || [];
  },

  /**
   * Get song by ID
   * @returns Single song object (unwrapped from ApiResponse)
   */
  getSongById: async (id: number): Promise<Song> => {
    const response = await axiosClient.get<ApiResponse<Song>>(`/songs/${id}`);
    return response.data?.data as Song;
  },

  /**
   * Search songs by title
   * @returns Array of songs (unwrapped from ApiResponse<PageResponse>)
   */
  searchSongByTitle: async (
    title: string,
  ): Promise<SongResponseWithAllAlbum[]> => {
    const response = await axiosClient.get<
      ApiResponse<PageResponse<SongResponseWithAllAlbum>>
    >(`/songs/search`, {
      params: { title },
    });
    return response.data?.data?.content || response.data?.data || [];
  },

  /**
   * Get top songs today
   * @returns Array of top song counters (unwrapped)
   */
  getTopSongsToday: async (limit = 50): Promise<TopSongPlayCounter[]> => {
    const response = await axiosClient.get<ApiResponse<TopSongPlayCounter[]>>(
      `/top-songs/today?limit=${limit}`,
    );
    const data = response.data.data || response.data;
    return Array.isArray(data) ? data : [];
  },

  /**
   * Get top songs this week
   * @returns Array of top song counters (unwrapped)
   */
  getTopSongsThisWeek: async (limit = 50): Promise<TopSongPlayCounter[]> => {
    const response = await axiosClient.get<ApiResponse<TopSongPlayCounter[]>>(
      `/top-songs/week?limit=${limit}`,
    );
    const data = response.data.data || response.data;
    return Array.isArray(data) ? data : [];
  },

  /**
   * Get top songs this month
   * @returns Array of top song counters (unwrapped)
   */
  getTopSongsThisMonth: async (limit = 50): Promise<TopSongPlayCounter[]> => {
    const response = await axiosClient.get<ApiResponse<TopSongPlayCounter[]>>(
      `/top-songs/month?limit=${limit}`,
    );
    const data = response.data.data || response.data;
    return Array.isArray(data) ? data : [];
  },
};
