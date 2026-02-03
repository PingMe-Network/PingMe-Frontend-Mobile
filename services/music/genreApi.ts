import axiosClient from "@/lib/axiosClient";
import type { Genre } from "@/types/music/genre";
import type { ApiResponse, PageResponse } from "@/types/base/apiResponse";

export const genreApi = {
  /**
   * Get all genres
   * @returns Array of genres (unwrapped from ApiResponse<PageResponse>)
   */
  getAllGenres: async (): Promise<Genre[]> => {
    const response =
      await axiosClient.get<ApiResponse<PageResponse<Genre>>>("/genres/all");
    return response.data?.data?.content || response.data?.data || [];
  },
};
