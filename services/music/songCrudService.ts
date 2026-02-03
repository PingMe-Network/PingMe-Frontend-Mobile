import axiosClient from "@/lib/axiosClient";
import type { ApiResponse, PageResponse } from "@/types/base/apiResponse";
import type {
  SongResponse,
  SongResponseWithAllAlbum,
  SongRequest,
} from "@/types/music";
import { createFormDataForSong } from "./helpers/formDataHelper";

const BASE_URL = "";

/**
 * CRUD service for Song entity
 */
export const songCrudService = {
  /**
   * Get all songs
   */
  getAll: async (): Promise<
    ApiResponse<PageResponse<SongResponseWithAllAlbum>>
  > => {
    const response = await axiosClient.get<
      ApiResponse<PageResponse<SongResponseWithAllAlbum>>
    >(`${BASE_URL}/songs/all`);
    return response.data;
  },

  /**
   * Get song by ID
   */
  getById: async (
    id: number,
  ): Promise<ApiResponse<SongResponseWithAllAlbum>> => {
    const response = await axiosClient.get<
      ApiResponse<SongResponseWithAllAlbum>
    >(`${BASE_URL}/songs/${id}`);
    return response.data;
  },

  /**
   * Search songs by title
   */
  search: async (
    title: string,
  ): Promise<ApiResponse<PageResponse<SongResponseWithAllAlbum>>> => {
    const response = await axiosClient.get<
      ApiResponse<PageResponse<SongResponseWithAllAlbum>>
    >(`${BASE_URL}/songs/search`, {
      params: { title },
    });
    return response.data;
  },

  /**
   * Filter songs by genre
   */
  filterByGenre: async (
    genreId: number,
  ): Promise<ApiResponse<PageResponse<SongResponseWithAllAlbum>>> => {
    const response = await axiosClient.get<
      ApiResponse<PageResponse<SongResponseWithAllAlbum>>
    >(`${BASE_URL}/songs/genre`, {
      params: { id: genreId },
    });
    return response.data;
  },
  /**
   * Create new song
   */
  create: async (data: SongRequest): Promise<SongResponse> => {
    console.log("[PingMe] Creating song with data:", data);
    const formData = createFormDataForSong(data);
    const response = await axiosClient.post<ApiResponse<SongResponse[]>>(
      `${BASE_URL}/songs/save`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
    console.log("[PingMe] Song create response:", response.data);
    // Backend returns ApiResponse<List>, so unwrap and return first item
    const songs = response.data.data;
    return Array.isArray(songs) ? songs[0] : songs;
  },

  /**
   * Update existing song
   */
  update: async (
    id: number,
    data: Partial<SongRequest>,
  ): Promise<SongResponse> => {
    console.log("[PingMe] Updating song", id, "with data:", data);
    const formData = createFormDataForSong(data);
    const response = await axiosClient.put<ApiResponse<SongResponse[]>>(
      `${BASE_URL}/songs/update/${id}`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
    console.log("[PingMe] Song update response:", response.data);
    // Backend returns ApiResponse<List>, so unwrap and return first item
    const songs = response.data.data;
    return Array.isArray(songs) ? songs[0] : songs;
  },

  /**
   * Soft delete song
   */
  softDelete: async (id: number): Promise<void> => {
    await axiosClient.delete<ApiResponse<void>>(
      `${BASE_URL}/songs/soft-delete/${id}`,
    );
  },

  /**
   * Hard delete song
   */
  hardDelete: async (id: number): Promise<void> => {
    await axiosClient.delete<ApiResponse<void>>(
      `${BASE_URL}/songs/hard-delete/${id}`,
    );
  },

  /**
   * Restore deleted song
   */
  restore: async (id: number): Promise<void> => {
    await axiosClient.put<ApiResponse<void>>(`${BASE_URL}/songs/restore/${id}`);
  },

  /**
   * Increase play count for song
   */
  increasePlayCount: async (id: number): Promise<void> => {
    await axiosClient.post<ApiResponse<void>>(`${BASE_URL}/songs/${id}/play`);
  },
};
