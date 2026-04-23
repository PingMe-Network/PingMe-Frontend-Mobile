import type { ArtistSummaryDto, GenreDto, AlbumSummaryDto } from "./index";

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
    // Extended fields from backend (full song data)
    songUrl: string;
    duration: number;
    coverImageUrl: string;
    playCount: number;
    mainArtist: ArtistSummaryDto;
    otherArtists: ArtistSummaryDto[];
    genres: GenreDto[];
    albums: AlbumSummaryDto[];
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
