import { revalidateTag, unstable_cache } from 'next/cache'

// Cache tags for different data types
export const CACHE_TAGS = {
  USERS: 'users',
  POSTS: 'posts',
  ANNOUNCEMENTS: 'announcements',
  ALLOWLIST: 'allowlist',
  PROFILE: 'profile',
  COMMENTS: 'comments',
  REACTIONS: 'reactions'
}

// Cache durations in seconds
export const CACHE_DURATIONS = {
  SHORT: 30,    // 30 seconds
  MEDIUM: 300,  // 5 minutes  
  LONG: 3600    // 1 hour
}

/**
 * Invalidate cache by tags (server-side only)
 * @param {string[]} tags - Tags to invalidate
 */
export async function invalidateCache(tags) {
  if (Array.isArray(tags)) {
    for (const tag of tags) {
      revalidateTag(tag)
    }
  } else {
    revalidateTag(tags)
  }
}

/**
 * Create a cached function for database operations
 * @param {Function} fn - The function to cache
 * @param {string[]} tags - Cache tags for invalidation
 * @param {number} revalidate - Cache duration in seconds
 * @param {string} keyParts - Additional key parts for cache key
 */
export function createCachedFunction(fn, tags, revalidate = CACHE_DURATIONS.MEDIUM, keyParts = []) {
  return unstable_cache(
    fn,
    keyParts,
    {
      tags,
      revalidate
    }
  )
}

// Helper to generate user-specific cache tags
export function getUserCacheTag(userId) {
  return `user-${userId}`
}

// Helper to generate post-specific cache tags
export function getPostCacheTag(postId) {
  return `post-${postId}`
}

// Helper to generate announcement-specific cache tags
export function getAnnouncementCacheTag(announcementId) {
  return `announcement-${announcementId}`
}
