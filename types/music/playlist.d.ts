export interface PlaylistDto {
    id: number;
    name: string;
    isPublic: boolean;
}

export interface PlaylistSongDto {
    id: number;
    songId: number;
    position: number;
    title: string;
}

export interface PlaylistDetailDto {
    id: number;
    name: string;
    isPublic: boolean;
    items: PlaylistSongDto[];
}

export interface CreatePlaylistRequest {
    name: string;
    isPublic: boolean;
}

export interface ReorderPlaylistRequest {
    orderedSongIds: number[];
}
