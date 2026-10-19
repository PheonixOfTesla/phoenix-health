/**
 * PHOENIX CACHE SERVICE
 *
 * Simple in-memory cache wrapper for interface orchestration results.
 * Provides <50ms responses for frequently accessed data.
 *
 * Note: This is different from PhoenixCache model (which stores Claude's deep analysis).
 * This is a lightweight cache for interface orchestration results.
 */

// In-memory cache with TTL
const cache = new Map();
const cacheExpiry = new Map();

/**
 * Get cached value
 * @param {string} userId - User ID
 * @param {string} key - Cache key (e.g., 'dashboard_layout')
 * @returns {Promise<any|null>} Cached value or null if not found/expired
 */
async function get(userId, key) {
  const cacheKey = `${userId}:${key}`;

  // Check if cache exists and not expired
  const expiry = cacheExpiry.get(cacheKey);
  if (!expiry || Date.now() > expiry) {
    // Expired or doesn't exist
    cache.delete(cacheKey);
    cacheExpiry.delete(cacheKey);
    return null;
  }

  return cache.get(cacheKey) || null;
}

/**
 * Set cached value with TTL
 * @param {string} userId - User ID
 * @param {string} key - Cache key
 * @param {any} value - Value to cache
 * @param {number} ttlSeconds - Time to live in seconds (default: 300 = 5min)
 * @returns {Promise<void>}
 */
async function set(userId, key, value, ttlSeconds = 300) {
  const cacheKey = `${userId}:${key}`;
  const expiryTime = Date.now() + (ttlSeconds * 1000);

  cache.set(cacheKey, value);
  cacheExpiry.set(cacheKey, expiryTime);
}

/**
 * Invalidate cache for user
 * @param {string} userId - User ID
 * @param {string} key - Optional specific key to invalidate
 * @returns {Promise<void>}
 */
async function invalidate(userId, key = null) {
  if (key) {
    const cacheKey = `${userId}:${key}`;
    cache.delete(cacheKey);
    cacheExpiry.delete(cacheKey);
  } else {
    // Invalidate all keys for user
    const prefix = `${userId}:`;
    for (const [cacheKey] of cache.entries()) {
      if (cacheKey.startsWith(prefix)) {
        cache.delete(cacheKey);
        cacheExpiry.delete(cacheKey);
      }
    }
  }
}

/**
 * Clear all expired entries (cleanup)
 */
function cleanupExpired() {
  const now = Date.now();
  for (const [cacheKey, expiry] of cacheExpiry.entries()) {
    if (now > expiry) {
      cache.delete(cacheKey);
      cacheExpiry.delete(cacheKey);
    }
  }
}

// Run cleanup every 5 minutes
setInterval(cleanupExpired, 5 * 60 * 1000);

module.exports = {
  get,
  set,
  invalidate,
  cleanupExpired
};
