import type {
  SongRequest,
  AlbumRequest,
  ArtistRequest,
  GenreRequest,
} from "@/types/music";

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

  console.log("[PingMe] FormData for artist:", formData);
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

  console.log("[PingMe] Creating FormData for album with data:", data);
  console.log("[PingMe] Request data (without file):", requestData);

  const jsonBlob = new Blob([JSON.stringify(requestData)], {
    type: "application/json",
  });
  formData.append("albumRequest", jsonBlob);

  if (imgFile) {
    console.log("[PingMe] Adding album cover image file:", imgFile.name);
    formData.append("albumCoverImg", imgFile);
  } else {
    console.log("[PingMe] No album cover image provided");
  }

  console.log("[PingMe] Final FormData entries:");
  for (const pair of formData.entries()) {
    console.log("[PingMe]", pair[0], ":", pair[1]);
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

  console.log("[PingMe] Creating FormData for song with data:", data);
  console.log("[PingMe] Request data (without files):", requestData);

  const jsonBlob = new Blob([JSON.stringify(requestData)], {
    type: "application/json",
  });
  formData.append("songRequest", jsonBlob);

  if (musicFile) {
    console.log("[PingMe] Adding music file:", musicFile.name);
    formData.append("musicFile", musicFile);
  } else {
    console.log("[PingMe] No music file provided");
  }

  if (imgFile) {
    console.log("[PingMe] Adding cover image file:", imgFile.name);
    formData.append("imgFile", imgFile);
  } else {
    console.log("[PingMe] No cover image provided");
  }

  console.log("[PingMe] Final FormData entries for song:");
  for (const pair of formData.entries()) {
    console.log("[PingMe]", pair[0], ":", pair[1]);
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
