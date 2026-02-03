import axiosClient from "@/lib/axiosClient";
import type { ApiResponse, PageResponse } from "@/types/base/apiResponse";
import type { GenreResponse, GenreRequest } from "@/types/music";
import { createFormDataForGenre } from "./helpers/formDataHelper";

const BASE_URL = "";

/**
 * CRUD service for Genre entity
 */
export const genreCrudService = {
  /**
   * Get all genres
   */
  getAll: async (): Promise<ApiResponse<PageResponse<GenreResponse>>> => {
    const response = await axiosClient.get<
      ApiResponse<PageResponse<GenreResponse>>
    >(`${BASE_URL}/genres/all`);
    return response.data;
  },

  /**
   * Get genre by ID
   */
  getById: async (id: number): Promise<GenreResponse> => {
    const response = await axiosClient.get<ApiResponse<GenreResponse>>(
      `${BASE_URL}/genres/${id}`,
    );
    return response.data.data;
  },

  /**
   * Search genres by name
   */
  search: async (
    name: string,
  ): Promise<ApiResponse<PageResponse<GenreResponse>>> => {
    const response = await axiosClient.get<
      ApiResponse<PageResponse<GenreResponse>>
    >(`${BASE_URL}/genres/search`, {
      params: { name },
    });
    return response.data;
  },

  /**
   * Create new genre
   */
  create: async (data: GenreRequest): Promise<GenreResponse> => {
    const formData = createFormDataForGenre(data);
    const response = await axiosClient.post<ApiResponse<GenreResponse>>(
      `${BASE_URL}/genres/save`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
    return response.data.data;
  },

  /**
   * Update existing genre
   */
  update: async (
    id: number,
    data: Partial<GenreRequest>,
  ): Promise<GenreResponse> => {
    const formData = createFormDataForGenre(data);
    const response = await axiosClient.put<ApiResponse<GenreResponse>>(
      `${BASE_URL}/genres/update/${id}`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
    return response.data.data;
  },

  /**
   * Soft delete genre
   */
  softDelete: async (id: number): Promise<void> => {
    await axiosClient.delete<ApiResponse<void>>(
      `${BASE_URL}/genres/soft-delete/${id}`,
    );
  },

  /**
   * Hard delete genre
   */
  hardDelete: async (id: number): Promise<void> => {
    await axiosClient.delete<ApiResponse<void>>(
      `${BASE_URL}/genres/hard-delete/${id}`,
    );
  },

  /**
   * Restore deleted genre
   */
  restore: async (id: number): Promise<void> => {
    await axiosClient.put<ApiResponse<void>>(
      `${BASE_URL}/genres/restore/${id}`,
    );
  },
};
