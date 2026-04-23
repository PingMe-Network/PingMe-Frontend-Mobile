import type { ArtistSummaryDto, GenreDto, AlbumSummaryDto } from "./index";

export interface FavoriteDto {
    id: number;
    songId: number;
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
