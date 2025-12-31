import { redisClient } from './redis';

interface RateLimitOptions {
    windowMs: number; // Time window in milliseconds
    maxRequests: number; // Maximum number of requests allowed in the window
}

/**
 * Rate limiter using Redis to track requests
 * @param key - Unique key for rate limiting (e.g., IP address or user ID)
 * @param options - Rate limit configuration
 * @returns true if request is allowed, false if rate limit exceeded
 */
export async function checkRateLimit(key: string, options: RateLimitOptions): Promise<boolean> {
    const redisKey = `ratelimit:${ key }`;

    try {
        const current = await redisClient.incr(redisKey);

        if (current === 1) {
            // First request, set expiry
            await redisClient.pexpire(redisKey, options.windowMs);
        }

        return current <= options.maxRequests;
    }
    catch (error) {
        console.error('Rate limit check failed:', error);
        // On error, allow the request to prevent blocking users due to Redis issues
        return true;
    }
}

/**
 * Get remaining requests for a key
 */
export async function getRateLimitInfo(key: string, maxRequests: number): Promise<{ remaining: number; ttl: number }> {
    const redisKey = `ratelimit:${ key }`;

    try {
        const current = await redisClient.get(redisKey);
        const ttl = await redisClient.pttl(redisKey);

        const remaining = Math.max(0, maxRequests - (current ? parseInt(current, 10) : 0));

        return { remaining, ttl: ttl > 0 ? ttl : 0 };
    }
    catch (error) {
        console.error('Get rate limit info failed:', error);
        return { remaining: maxRequests, ttl: 0 };
    }
}
