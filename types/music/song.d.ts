import type { AlbumSummary } from "./albumSummary";
import type { ArtistSummary } from "./artistSummary";
import type { Genre } from "./genre";

export type Song = {
  id: number;
  title: string;
  duration: number;
  songUrl: string;
  coverImageUrl?: string | null;
  playCount: number;
  mainArtist?: ArtistSummary | null;
  featuredArtists?: ArtistSummary[] | null;
  genre?: Genre[] | null;
  album?: AlbumSummary[] | null;
};
