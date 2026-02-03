import type { ArtistSummaryDto } from ".";
import type { AlbumSummary } from "./albumSummary";
import type { ArtistSummary } from "./artistSummary";
import type { Genre } from "./genre";

export type SongWithAllAlbum = {
  id: number;
  title: string;
  duration: number;
  songUrl: string;
  coverImageUrl: string;
  playCount: number;
  mainArtist: ArtistSummary;
  featuredArtists: ArtistSummaryDto[];
  genre: Genre[];
  album: AlbumSummary[];
};
