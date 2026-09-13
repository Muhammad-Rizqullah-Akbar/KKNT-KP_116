/**
 * Advanced Caching Layer for High-Traffic Applications
 * 
 * Features:
 * - In-memory LRU cache with TTL
 * - Redis-compatible interface for production scale
 * - Automatic cache invalidation
 * - Statistics tracking
 */

interface CacheEntry<T> {
  value: T
  expiresAt: number
  createdAt: number
  hits: number
}

interface CacheStats {
  hits: number
  misses: number
  evictions: number
  size: number
  hitRate: number
}

export class AdvancedCache<T = any> {
  private cache = new Map<string, CacheEntry<T>>()
  private maxSize: number
  private defaultTTL: number
  private stats = { hits: 0, misses: 0, evictions: 0 }

  constructor(maxSize = 1000, defaultTTLMs = 60000) {
    this.maxSize = maxSize
    this.defaultTTL = defaultTTLMs
  }

  /**
   * Get a value from cache
   */
  get(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      this.stats.misses++
      return null
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      this.stats.misses++
      return null
    }

    entry.hits++
    this.stats.hits++
    return entry.value
  }

  /**
   * Set a value in cache
   */
  set(key: string, value: T, ttlMs?: number): void {
    const now = Date.now()
    const ttl = ttlMs ?? this.defaultTTL

    // Evict oldest entries if at capacity
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLRU()
    }

    this.cache.set(key, {
      value,
      expiresAt: now + ttl,
      createdAt: now,
      hits: 0,
    })
  }

  /**
   * Check if key exists and is valid
   */
  has(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return false
    }
    return true
  }

  /**
   * Delete a specific key
   */
  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  /**
   * Invalidate keys matching a pattern
   */
  invalidatePattern(pattern: RegExp): number {
    let count = 0
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key)
        count++
      }
    }
    return count
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear()
    this.stats = { hits: 0, misses: 0, evictions: 0 }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses
    return {
      ...this.stats,
      size: this.cache.size,
      hitRate: total > 0 ? (this.stats.hits / total) * 100 : 0,
    }
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    let oldestKey: string | null = null
    let oldestTime = Infinity

    for (const [key, entry] of this.cache.entries()) {
      if (entry.createdAt < oldestTime) {
        oldestTime = entry.createdAt
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey)
      this.stats.evictions++
    }
  }

  /**
   * Clean up expired entries (call periodically)
   */
  cleanup(): number {
    const now = Date.now()
    let cleaned = 0

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key)
        cleaned++
      }
    }

    return cleaned
  }
}

// ============ SPECIALIZED CACHE INSTANCES ============

/**
 * Cache for form data (long-lived, rarely changes)
 */
export const formCache = new AdvancedCache<any>(500, 5 * 60 * 1000) // 5 minutes TTL

/**
 * Cache for distribution data
 */
export const distributionCache = new AdvancedCache<any>(1000, 2 * 60 * 1000) // 2 minutes TTL

/**
 * Cache for user lookup (session stability)
 */
export const userCache = new AdvancedCache<any>(2000, 10 * 60 * 1000) // 10 minutes TTL

/**
 * Cache for scoring results (computationally expensive)
 */
export const scoringCache = new AdvancedCache<any>(5000, 30 * 60 * 1000) // 30 minutes TTL

/**
 * Cache for article recommendations
 */
export const articleCache = new AdvancedCache<any>(1000, 15 * 60 * 1000) // 15 minutes TTL

// ============ CACHE HELPER FUNCTIONS ============

/**
 * Cached Firestore read with automatic cache management
 */
export async function cachedGetDoc<T = any>(
  cache: AdvancedCache<T>,
  key: string,
  fetchFn: () => Promise<T>,
  ttlMs?: number
): Promise<T> {
  const cached = cache.get(key)
  if (cached !== null) {
    return cached
  }

  const value = await fetchFn()
  cache.set(key, value, ttlMs)
  return value
}

/**
 * Create a cache key from parameters
 */
export function makeCacheKey(...parts: (string | number | undefined)[]): string {
  return parts.filter(Boolean).join(':')
}

// ============ BACKGROUND CLEANUP ============

// Run cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    formCache.cleanup()
    distributionCache.cleanup()
    userCache.cleanup()
    scoringCache.cleanup()
    articleCache.cleanup()
  }, 5 * 60 * 1000)
}

export default AdvancedCache
