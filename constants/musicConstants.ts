// Cache configuration
export const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

// Cache size limits (for LRU strategy)
export const MAX_CACHED_GENRES = 20;
export const MAX_CACHED_ALBUMS = 20;
export const MAX_CACHED_ARTISTS = 20;

// Data fetching limits
export const DEFAULT_TOP_SONGS_LIMIT = 5;
export const DEFAULT_ARTISTS_LIMIT = 20;
export const DEFAULT_ALBUMS_LIMIT = 20;
export const TOP_ARTISTS_FOR_PREVIEW = 10;

// Pagination defaults
export const DEFAULT_ITEMS_PER_PAGE = 5;
export const ITEMS_PER_PAGE_OPTIONS = [5, 10, 15, 20];
