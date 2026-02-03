import axiosClient from "@/lib/axiosClient";
import type { ApiResponse, PageResponse } from "@/types/base/apiResponse";
import type { ArtistResponse, ArtistRequest } from "@/types/music";
import { createFormDataForArtist } from "./helpers/formDataHelper";

const BASE_URL = "";

/**
 * CRUD service for Artist entity
 */
export const artistCrudService = {
  /**
   * Get all artists
   */
  getAll: async (): Promise<ApiResponse<PageResponse<ArtistResponse>>> => {
    const response = await axiosClient.get<
      ApiResponse<PageResponse<ArtistResponse>>
    >(`${BASE_URL}/artists/all`);
    return response.data;
  },

  /**
   * Get artist by ID
   */
  getById: async (id: number): Promise<ArtistResponse> => {
    const response = await axiosClient.get<ApiResponse<ArtistResponse>>(
      `${BASE_URL}/artists/${id}`,
    );
    return response.data.data;
  },

  /**
   * Search artists by name
   */
  search: async (
    name: string,
  ): Promise<ApiResponse<PageResponse<ArtistResponse>>> => {
    const response = await axiosClient.get<
      ApiResponse<PageResponse<ArtistResponse>>
    >(`${BASE_URL}/artists/search`, {
      params: { name },
    });
    return response.data;
  },

  /**
   * Create new artist
   */
  create: async (data: ArtistRequest): Promise<ArtistResponse> => {
    const formData = createFormDataForArtist(data);
    const response = await axiosClient.post<ApiResponse<ArtistResponse>>(
      `${BASE_URL}/artists/save`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
    return response.data.data;
  },

  /**
   * Update existing artist
   */
  update: async (
    id: number,
    data: Partial<ArtistRequest>,
  ): Promise<ArtistResponse> => {
    const formData = createFormDataForArtist(data);
    const response = await axiosClient.put<ApiResponse<ArtistResponse>>(
      `${BASE_URL}/artists/update/${id}`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
    return response.data.data;
  },

  /**
   * Soft delete artist
   */
  softDelete: async (id: number): Promise<void> => {
    await axiosClient.delete<ApiResponse<void>>(
      `${BASE_URL}/artists/soft-delete/${id}`,
    );
  },

  /**
   * Hard delete artist
   */
  hardDelete: async (id: number): Promise<void> => {
    await axiosClient.delete<ApiResponse<void>>(
      `${BASE_URL}/artists/hard-delete/${id}`,
    );
  },

  /**
   * Restore deleted artist
   */
  restore: async (id: number): Promise<void> => {
    await axiosClient.put<ApiResponse<void>>(
      `${BASE_URL}/artists/restore/${id}`,
    );
  },
};
