import axiosClient from "@/lib/axiosClient";
import type { ApiResponse, PageResponse } from "@/types/base/apiResponse";
import type { 
    PlaylistDto, 
    PlaylistDetailDto, 
    CreatePlaylistRequest,
    ReorderPlaylistRequest 
} from "@/types/music/playlist";

export const playlistApi = {
    // Create a new playlist
    createPlaylist: async (data: CreatePlaylistRequest): Promise<PlaylistDto> => {
        const response = await axiosClient.post<ApiResponse<PlaylistDto>>("/music-service/playlists", data);
        return response.data.data;
    },

    // Get all playlists for current user-management
    getPlaylists: async (): Promise<PlaylistDto[]> => {
        const response = await axiosClient.get<ApiResponse<PlaylistDto[]>>("/music-service/playlists");
        const data = response.data.data || response.data;
        return Array.isArray(data) ? data : [];
    },

    // Get playlist details with songs
    getPlaylistDetail: async (id: number): Promise<PlaylistDetailDto> => {
        const response = await axiosClient.get<ApiResponse<PlaylistDetailDto>>(`/music-service/playlists/${id}`);
        return response.data.data;
    },

    // Delete a playlist
    deletePlaylist: async (id: number): Promise<void> => {
        await axiosClient.delete<ApiResponse<void>>(`/music-service/playlists/${id}`);
    },

    // Update playlist (name and/or public status)
    updatePlaylist: async (id: number, data: { name?: string; isPublic?: boolean }): Promise<PlaylistDto> => {
        const response = await axiosClient.put<ApiResponse<PlaylistDto>>(`/music-service/playlists/${id}`, data);
        return response.data.data;
    },  

    // Add a song to playlist
    addSongToPlaylist: async (playlistId: number, songId: number): Promise<{ alreadyExists: boolean }> => {
        const response = await axiosClient.post<ApiResponse<{ alreadyExists: boolean }>>(`/music-service/playlists/${playlistId}/songs/${songId}`);
        return response.data.data;
    },

    // Remove a song from playlist
    removeSongFromPlaylist: async (playlistId: number, songId: number): Promise<void> => {
        await axiosClient.delete<ApiResponse<void>>(`/music-service/playlists/${playlistId}/songs/${songId}`);
    },

    // Reorder songs in playlist
    reorderPlaylist: async (playlistId: number, orderedSongIds: number[]): Promise<void> => {
        const payload: ReorderPlaylistRequest = { orderedSongIds };
        await axiosClient.patch<ApiResponse<void>>(`/music-service/playlists/${playlistId}/songs/reorder`, payload);
    },

    // Get all public playlists (for discover page)
    getPublicPlaylists: async (page: number = 0, size: number = 20): Promise<PageResponse<PlaylistDto>> => {
        const response = await axiosClient.get<ApiResponse<PageResponse<PlaylistDto>>>("/music-service/playlists/public", {
            params: { page, size }
        });
        return response.data.data;
    },
};
