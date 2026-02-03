/**
 * Central type definitions for Music module
 * All music-related types should be exported from this file
 */

// ============================================================================
// ENUMS & TYPES
// ============================================================================

export type ArtistRole =
  | "MAIN_ARTIST"
  | "FEATURED_ARTIST"
  | "COMPOSER"
  | "PRODUCER"
  | "VOCALIST";

// ============================================================================
// BASE DTOs (Data Transfer Objects)
// ============================================================================

export interface GenreDto {
  id: number;
  name: string;
}

export interface ArtistSummaryDto {
  id: number;
  name: string;
  role: ArtistRole;
  imgUrl: string;
}

export interface AlbumSummaryDto {
  id: number;
  title: string;
  playCount: number;
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

export interface GenreResponse {
  id: number;
  name: string;
}

export interface ArtistResponse {
  id: number;
  name: string;
  bio: string;
  imgUrl: string;
}

export interface AlbumResponse {
  id: number;
  title: string;
  coverImgUrl: string;
  playCount: number;
  albumOwnerId?: number;
}

export interface SongResponse {
  id: number;
  title: string;
  duration: number;
  playCount: number;
  songUrl: string;
  coverImageUrl: string;
  mainArtist: ArtistSummaryDto;
  otherArtists: ArtistSummaryDto[];
  genres: GenreDto[];
  album: AlbumSummaryDto;
}

export interface SongResponseWithAllAlbum {
  id: number;
  title: string;
  duration: number;
  playCount: number;
  songUrl: string;
  coverImageUrl: string;
  mainArtist: ArtistSummaryDto;
  otherArtists: ArtistSummaryDto[];
  genres: GenreDto[];
  albums: AlbumSummaryDto[];
}

export interface TopSongPlayCounter {
  songId: number;
  title: string;
  imgUrl: string;
  playCount: number;
}

// ============================================================================
// REQUEST TYPES
// ============================================================================

export interface SongArtistRequest {
  artistId: number;
  role: ArtistRole;
}

export interface SongRequest {
  title: string;
  duration: number;
  mainArtistId: number;
  otherArtists: SongArtistRequest[];
  genreIds: number[];
  albumIds: number[];
  musicFile?: File;
  imgFile?: File;
}

export interface AlbumRequest {
  title: string;
  albumOwnerId: number;
  imgFile?: File;
}

export interface ArtistRequest {
  name: string;
  bio: string;
  imgFile?: File;
}

export interface GenreRequest {
  name: string;
}

// ============================================================================
// RE-EXPORTS FROM SPECIALIZED FILES
// ============================================================================

// Export all types from separate domain files
export * from "./favorite";
export * from "./playlist";
export * from "./genre.d";
export * from "./song.d";
export type { Genre } from "./genre.d";
export type { Song } from "./song.d";
