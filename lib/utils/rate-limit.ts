/**
 * Rate limiting utility for SMS and other API endpoints
 * Uses in-memory cache for MVP (can be upgraded to Redis/database later)
 */

interface RateLimitEntry {
  count: number;
  windowStart: Date;
}

// In-memory cache for rate limiting
// Key: phone number or identifier, Value: rate limit entry
const rateLimitCache = new Map<string, RateLimitEntry>();

// Clean up old entries every 10 minutes
setInterval(() => {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  
  for (const [key, entry] of rateLimitCache.entries()) {
    if (entry.windowStart < oneHourAgo) {
      rateLimitCache.delete(key);
    }
  }
}, 10 * 60 * 1000); // Run every 10 minutes

/**
 * Check if a phone number has exceeded rate limit
 * @param phoneNumber - Phone number to check
 * @param maxRequests - Maximum requests allowed (default: 5)
 * @param windowMs - Time window in milliseconds (default: 1 hour)
 * @returns Object with allowed status and remaining requests
 */
export function checkRateLimit(
  phoneNumber: string,
  maxRequests: number = 5,
  windowMs: number = 60 * 60 * 1000 // 1 hour
): { allowed: boolean; remaining: number; resetAt: Date } {
  const now = new Date();
  const entry = rateLimitCache.get(phoneNumber);

  if (!entry) {
    // First request - create entry
    rateLimitCache.set(phoneNumber, {
      count: 1,
      windowStart: now,
    });
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetAt: new Date(now.getTime() + windowMs),
    };
  }

  // Check if window has expired
  const windowEnd = new Date(entry.windowStart.getTime() + windowMs);
  if (now >= windowEnd) {
    // Window expired - reset
    const newEntry = {
      count: 1,
      windowStart: now,
    };
    rateLimitCache.set(phoneNumber, newEntry);
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetAt: new Date(now.getTime() + windowMs),
    };
  }

  // Check if limit exceeded
  if (entry.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: windowEnd,
    };
  }

  // Increment count
  entry.count++;
  rateLimitCache.set(phoneNumber, entry);

  return {
    allowed: true,
    remaining: maxRequests - entry.count,
    resetAt: windowEnd,
  };
}

/**
 * Reset rate limit for a phone number (useful for testing or manual override)
 */
export function resetRateLimit(phoneNumber: string): void {
  rateLimitCache.delete(phoneNumber);
}

/**
 * Get current rate limit status for a phone number
 */
export function getRateLimitStatus(phoneNumber: string): {
  count: number;
  windowStart: Date;
  remaining: number;
} | null {
  const entry = rateLimitCache.get(phoneNumber);
  if (!entry) {
    return null;
  }

  const now = new Date();
  const windowEnd = new Date(entry.windowStart.getTime() + 60 * 60 * 1000);
  
  if (now >= windowEnd) {
    return null; // Window expired
  }

  return {
    count: entry.count,
    windowStart: entry.windowStart,
    remaining: Math.max(0, 5 - entry.count),
  };
}
