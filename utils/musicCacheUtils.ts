/**
 * Cache validation utility with enhanced error handling
 * @param lastFetched - Timestamp when data was last fetched
 * @param cacheExpiry - Cache duration in milliseconds
 * @returns true if cache is still valid, false otherwise
 */
export const isCacheValid = (
  lastFetched: number | null | undefined,
  cacheExpiry: number
): boolean => {
  // Validate lastFetched
  if (!lastFetched || lastFetched <= 0) return false;
  
  // Validate cacheExpiry
  if (cacheExpiry <= 0) {
    console.warn('[MusicCache] Invalid cacheExpiry value:', cacheExpiry);
    return false;
  }
  
  // Calculate cache age
  const now = Date.now();
  const age = now - lastFetched;
  
  // Check for future timestamps (system clock issues)
  if (age < 0) {
    console.warn('[MusicCache] Invalid timestamp detected, lastFetched is in the future:', {
      lastFetched,
      now,
      difference: age
    });
    return false;
  }
  
  return age < cacheExpiry;
};

/**
 * Generic cache data structure with access tracking
 */
export interface CacheData<T> {
  data: T;
  lastFetched: number | null;
  lastAccessed?: number; // For LRU cache strategy
}

/**
 * Check if cached data exists and is valid
 * @param cache - Cache object with data and lastFetched
 * @param cacheExpiry - Cache duration in milliseconds
 * @returns cached data if valid, undefined otherwise
 */
export const getCachedData = <T>(
  cache: CacheData<T> | undefined,
  cacheExpiry: number
): T | undefined => {
  if (!cache) return undefined;
  
  // Validate cache structure
  if (!cache.data) {
    console.warn('[MusicCache] Cache exists but data is missing');
    return undefined;
  }
  
  return isCacheValid(cache.lastFetched, cacheExpiry) ? cache.data : undefined;
};

/**
 * Update last accessed time for LRU cache
 * @param cache - Cache object to update
 * @returns Updated cache object
 */
export const touchCache = <T>(cache: CacheData<T>): CacheData<T> => {
  return {
    ...cache,
    lastAccessed: Date.now()
  };
};
