import axiosClient from "@/lib/axiosClient";
import type { ApiResponse, PageResponse } from "@/types/base/apiResponse";
import type { AlbumResponse, AlbumRequest } from "@/types/music";
import { createFormDataForAlbum } from "./helpers/formDataHelper";

const BASE_URL = "";

/**
 * CRUD service for Album entity
 */
export const albumCrudService = {
  /**
   * Get all albums
   */
  getAll: async (): Promise<ApiResponse<PageResponse<AlbumResponse>>> => {
    const response = await axiosClient.get<
      ApiResponse<PageResponse<AlbumResponse>>
    >(`${BASE_URL}/albums/all`);
    return response.data;
  },

  /**
   * Get album by ID
   */
  getById: async (id: number): Promise<AlbumResponse> => {
    const response = await axiosClient.get<ApiResponse<AlbumResponse>>(
      `${BASE_URL}/albums/${id}`,
    );
    return response.data.data;
  },

  /**
   * Search albums by title
   */
  search: async (
    title: string,
  ): Promise<ApiResponse<PageResponse<AlbumResponse>>> => {
    const response = await axiosClient.get<
      ApiResponse<PageResponse<AlbumResponse>>
    >(`${BASE_URL}/albums/search`, {
      params: { title },
    });
    return response.data;
  },

  /**
   * Create new album
   */
  create: async (data: AlbumRequest): Promise<AlbumResponse> => {
    const formData = createFormDataForAlbum(data);
    const response = await axiosClient.post<ApiResponse<AlbumResponse>>(
      `${BASE_URL}/albums/save`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
    return response.data.data;
  },

  /**
   * Update existing album
   */
  update: async (
    id: number,
    data: Partial<AlbumRequest>,
  ): Promise<AlbumResponse> => {
    const formData = createFormDataForAlbum(data);
    const response = await axiosClient.put<ApiResponse<AlbumResponse>>(
      `${BASE_URL}/albums/update/${id}`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
    return response.data.data;
  },

  /**
   * Soft delete album
   */
  softDelete: async (id: number): Promise<void> => {
    await axiosClient.delete<ApiResponse<void>>(
      `${BASE_URL}/albums/soft-delete/${id}`,
    );
  },

  /**
   * Hard delete album
   */
  hardDelete: async (id: number): Promise<void> => {
    await axiosClient.delete<ApiResponse<void>>(
      `${BASE_URL}/albums/hard-delete/${id}`,
    );
  },

  /**
   * Restore deleted album
   */
  restore: async (id: number): Promise<void> => {
    await axiosClient.put<ApiResponse<void>>(
      `${BASE_URL}/albums/restore/${id}`,
    );
  },
};
