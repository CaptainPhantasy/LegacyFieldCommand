/**
 * Cache header utilities
 * Provides HTTP cache control headers for API responses
 */

/**
 * Get cache headers for API responses
 * @param maxAge Maximum age in seconds (default: 300 = 5 minutes)
 * @param staleWhileRevalidate Stale-while-revalidate time in seconds (default: 2x maxAge)
 */
export function getCacheHeaders(
  maxAge: number = 300,
  staleWhileRevalidate?: number
): Record<string, string> {
  const swr = staleWhileRevalidate || maxAge * 2;

  return {
    'Cache-Control': `public, s-maxage=${maxAge}, stale-while-revalidate=${swr}`,
  };
}

/**
 * Get cache headers for private/user-specific data
 */
export function getPrivateCacheHeaders(maxAge: number = 60): Record<string, string> {
  return {
    'Cache-Control': `private, max-age=${maxAge}`,
  };
}

/**
 * Get no-cache headers
 */
export function getNoCacheHeaders(): Record<string, string> {
  return {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  };
}

/**
 * Get ETag header (for conditional requests)
 */
export function getETagHeader(value: string): Record<string, string> {
  return {
    'ETag': `"${value}"`,
  };
}

