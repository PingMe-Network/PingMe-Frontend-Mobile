import axiosClient from "@/lib/axiosClient";
import type { ApiResponse, PageResponse } from "@/types/base/apiResponse";
import type {
  SongResponseWithAllAlbum,
  AlbumResponse,
  ArtistResponse,
} from "@/types/music";

const BASE_URL = "";

/**
 * Search service for music-related search operations
 * All methods unwrap ApiResponse and PageResponse to return clean data arrays
 */
export const searchService = {
  /**
   * Search all music entities by query
   */
  searchAll: async (query: string) => {
    const response = await axiosClient.get(`${BASE_URL}/search`, {
      params: { q: query },
    });
    return response.data;
  },

  /**
   * Get songs by album ID
   * @returns Array of songs (unwrapped from ApiResponse<PageResponse>)
   */
  getSongsByAlbum: async (
    albumId: number,
  ): Promise<SongResponseWithAllAlbum[]> => {
    const response = await axiosClient.get<
      ApiResponse<PageResponse<SongResponseWithAllAlbum>>
    >(`${BASE_URL}/songs/search-by-album`, {
      params: { id: albumId },
    });
    return response.data?.data?.content || response.data?.data || [];
  },

  /**
   * Get songs by artist ID
   * @returns Array of songs (unwrapped from ApiResponse<PageResponse>)
   */
  getSongsByArtist: async (
    artistId: number,
  ): Promise<SongResponseWithAllAlbum[]> => {
    const response = await axiosClient.get<
      ApiResponse<PageResponse<SongResponseWithAllAlbum>>
    >(`${BASE_URL}/songs/search-by-artist`, {
      params: { id: artistId },
    });
    return response.data?.data?.content || response.data?.data || [];
  },

  /**
   * Get songs by genre ID
   * @returns Array of songs (unwrapped from ApiResponse<PageResponse>)
   */
  getSongsByGenre: async (
    genreId: number,
  ): Promise<SongResponseWithAllAlbum[]> => {
    const response = await axiosClient.get<
      ApiResponse<PageResponse<SongResponseWithAllAlbum>>
    >(`${BASE_URL}/songs/genre`, {
      params: { id: genreId },
    });
    return response.data?.data?.content || response.data?.data || [];
  },

  /**
   * Search songs by title
   * @returns Array of songs (unwrapped from ApiResponse<PageResponse>)
   */
  searchSongs: async (
    query: string,
  ): Promise<SongResponseWithAllAlbum[]> => {
    const response = await axiosClient.get<
      ApiResponse<PageResponse<SongResponseWithAllAlbum>>
    >(`${BASE_URL}/songs/search`, {
      params: { title: query },
    });
    return response.data?.data?.content || response.data?.data || [];
  },

  /**
   * Search albums by name
   * @returns Array of albums (unwrapped from ApiResponse<PageResponse>)
   */
  searchAlbums: async (
    query: string,
  ): Promise<AlbumResponse[]> => {
    const response = await axiosClient.get<
      ApiResponse<PageResponse<AlbumResponse>>
    >(`${BASE_URL}/albums/search`, {
      params: { title: query },
    });
    return response.data?.data?.content || response.data?.data || [];
  },

  /**
   * Search artists by name
   * @returns Array of artists (unwrapped from ApiResponse<PageResponse>)
   */
  searchArtists: async (
    query: string,
  ): Promise<ArtistResponse[]> => {
    const response = await axiosClient.get<
      ApiResponse<PageResponse<ArtistResponse>>
    >(`${BASE_URL}/artists/search`, {
      params: { name: query },
    });
    return response.data?.data?.content || response.data?.data || [];
  },
};
