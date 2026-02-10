import type {
  SongRequest,
  AlbumRequest,
  ArtistRequest,
  GenreRequest,
} from "@/types/music";

/**
 * Helper to create FormData for artist multipart requests
 */
/**
 * Helper to create FormData for artist multipart requests
 */
export function createFormDataForArtist(
  data: ArtistRequest | Partial<ArtistRequest>,
): FormData {
  const formData = new FormData();

  // Separate file from request data
  const { imgFile, ...requestData } = data;

  // Add JSON request data as blob with proper content type
  const jsonBlob = new Blob([JSON.stringify(requestData)], {
    type: "application/json",
  });
  formData.append("artistRequest", jsonBlob);

  // Add file if present
  if (imgFile) {
    formData.append("imgFile", imgFile);
  }

  return formData;
}

/**
 * Helper to create FormData for album multipart requests
 */
export function createFormDataForAlbum(
  data: AlbumRequest | Partial<AlbumRequest>,
): FormData {
  const formData = new FormData();

  const { imgFile, ...requestData } = data;

  const jsonBlob = new Blob([JSON.stringify(requestData)], {
    type: "application/json",
  });
  formData.append("albumRequest", jsonBlob);

  if (imgFile) {
    formData.append("albumCoverImg", imgFile);
  }

  return formData;
}

/**
 * Helper to create FormData for song multipart requests
 */
export function createFormDataForSong(
  data: SongRequest | Partial<SongRequest>,
): FormData {
  const formData = new FormData();

  const { musicFile, imgFile, ...requestData } = data;

  const jsonBlob = new Blob([JSON.stringify(requestData)], {
    type: "application/json",
  });
  formData.append("songRequest", jsonBlob);

  if (musicFile) {
    formData.append("musicFile", musicFile);
  }

  if (imgFile) {
    formData.append("imgFile", imgFile);
  }

  return formData;
}

/**
 * Helper to create FormData for genre requests
 */
export function createFormDataForGenre(
  data: GenreRequest | Partial<GenreRequest>,
): FormData {
  const formData = new FormData();
  const jsonBlob = new Blob([JSON.stringify(data)], {
    type: "application/json",
  });
  formData.append("genreRequest", jsonBlob);
  return formData;
}
