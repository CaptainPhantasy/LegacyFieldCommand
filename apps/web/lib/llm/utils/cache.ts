/**
 * Caching Utilities
 * 
 * Simple in-memory cache for LLM responses
 * Can be extended to use Redis or other caching solutions
 */

interface CacheEntry<T> {
  value: T
  expiresAt: number
}

export class LLMCache {
  private cache: Map<string, CacheEntry<unknown>> = new Map()
  private defaultTTL: number = 60 * 60 * 1000 // 1 hour

  /**
   * Get value from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)

    if (!entry) {
      return null
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }

    return entry.value as T
  }

  /**
   * Set value in cache
   */
  set<T>(key: string, value: T, ttl?: number): void {
    const expiresAt = Date.now() + (ttl || this.defaultTTL)
    this.cache.set(key, {
      value,
      expiresAt,
    })
  }

  /**
   * Delete value from cache
   */
  delete(key: string): void {
    this.cache.delete(key)
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Generate cache key from request
   */
  generateKey(prefix: string, ...parts: (string | number | undefined)[]): string {
    const cleanParts = parts
      .filter((p) => p !== undefined && p !== null)
      .map((p) => String(p))
      .join(':')
    return `${prefix}:${cleanParts}`
  }
}

// Singleton instance
let cacheInstance: LLMCache | null = null

/**
 * Get cache instance (singleton)
 */
export function getCache(): LLMCache {
  if (!cacheInstance) {
    cacheInstance = new LLMCache()
    // Cleanup expired entries every 5 minutes
    setInterval(() => {
      cacheInstance?.cleanup()
    }, 5 * 60 * 1000)
  }
  return cacheInstance
}

/**
 * Cache LLM response
 */
export async function withCache<T>(
  key: string,
  fn: () => Promise<T>,
  ttl?: number
): Promise<T> {
  const cache = getCache()
  const cached = cache.get<T>(key)

  if (cached !== null) {
    return cached
  }

  const result = await fn()
  cache.set(key, result, ttl)
  return result
}

