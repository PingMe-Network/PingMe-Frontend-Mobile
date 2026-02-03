import axiosClient from "@/lib/axiosClient";
import type { ApiResponse, PageResponse } from "@/types/base/apiResponse";

export interface AlbumResponse {
  id: number;
  title: string;
  coverImgUrl: string;
  playCount: number;
}

export const albumApi = {
  getAllAlbums: async (): Promise<ApiResponse<PageResponse<AlbumResponse>>> => {
    const response =
      await axiosClient.get<ApiResponse<PageResponse<AlbumResponse>>>(
        "/albums/all",
      );
    return response.data;
  },

  getPopularAlbums: async (limit?: number): Promise<AlbumResponse[]> => {
    const response =
      await axiosClient.get<ApiResponse<PageResponse<AlbumResponse>>>(
        "/albums/all",
      );
    const albums = response.data?.data?.content || [];
    const sortedAlbums = [...albums].sort((a, b) => b.playCount - a.playCount);
    return limit ? sortedAlbums.slice(0, limit) : sortedAlbums;
  },
};
