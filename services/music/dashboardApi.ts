import axiosClient from "@/lib/axiosClient";
import type { ApiResponse } from "@/types/base/apiResponse";
import type { MusicDashboardResponse } from "@/types/music";

export interface DashboardParams {
  topSongsLimit?: number;
  albumLimit?: number;
  artistLimit?: number;
  genreLimit?: number;
  rankingLimit?: number;
}

export const dashboardApi = {
  /**
   * Fetch all home page data in a single request.
   * Replaces the 7 separate API calls with one aggregated call.
   */
  getHomeDashboard: async (
    params?: DashboardParams,
  ): Promise<MusicDashboardResponse> => {
    const response = await axiosClient.get<
      ApiResponse<MusicDashboardResponse>
    >("/music-service/dashboard", {
      params: {
        topSongsLimit: params?.topSongsLimit ?? 10,
        albumLimit: params?.albumLimit ?? 5,
        artistLimit: params?.artistLimit ?? 10,
        genreLimit: params?.genreLimit ?? 10,
        rankingLimit: params?.rankingLimit ?? 10,
      },
    });
    return response.data.data;
  },
};
