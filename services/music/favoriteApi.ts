import axiosClient from "@/lib/axiosClient";
import type { ApiResponse } from "@/types/base/apiResponse";
import type { FavoriteDto } from "@/types/music/favorite";

export const favoriteApi = {
    // Get all favorite songs for current user
    getFavorites: async (): Promise<FavoriteDto[]> => {
        const response = await axiosClient.get<ApiResponse<FavoriteDto[]>>("/favorites");
        const data = response.data.data || response.data;
        return Array.isArray(data) ? data : [];
    },

    // Add a song to favorites
    addFavorite: async (songId: number): Promise<void> => {
        await axiosClient.post<ApiResponse<void>>(`/favorites/${songId}`);
    },

    // Remove a song from favorites
    removeFavorite: async (songId: number): Promise<void> => {
        await axiosClient.delete<ApiResponse<void>>(`/favorites/${songId}`);
    },

    // Check if a song is in favorites
    isFavorite: async (songId: number): Promise<boolean> => {
        const response = await axiosClient.get<ApiResponse<boolean>>(`/favorites/is/${songId}`);
        return response.data.data;
    },
};