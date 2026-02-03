import axiosClient from "@/lib/axiosClient";
import type { ArtistResponse } from "@/types/music";
import type { ApiResponse, PageResponse } from "@/types/base/apiResponse";

export const artistApi = {
  getAllArtists: async (): Promise<
    ApiResponse<PageResponse<ArtistResponse>>
  > => {
    const response =
      await axiosClient.get<ApiResponse<PageResponse<ArtistResponse>>>(
        "/artists/all",
      );
    return response.data;
  },

  getPopularArtists: async (limit?: number): Promise<ArtistResponse[]> => {
    const response =
      await axiosClient.get<ApiResponse<PageResponse<ArtistResponse>>>(
        "/artists/all",
      );
    const artists = response.data?.data?.content || [];
    return limit ? artists.slice(0, limit) : artists;
  },
};
