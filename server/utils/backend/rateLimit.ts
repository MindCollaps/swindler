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
            console.log(`[RateLimit] New rate limit window started for key: ${ key }`);
        }

        const isAllowed = current <= options.maxRequests;

        if (!isAllowed) {
            console.warn(`[RateLimit] Rate limit exceeded for key: ${ key } (attempt ${ current }/${ options.maxRequests })`);
        }
        else if (current > 1) {
            console.log(`[RateLimit] Request ${ current }/${ options.maxRequests } for key: ${ key }`);
        }

        return isAllowed;
    }
    catch (error) {
        console.error('[RateLimit] Rate limit check failed:', error);
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

        console.log(`[RateLimit] Info for key: ${ key.split(':')[0] } - Remaining: ${ remaining }/${ maxRequests }, TTL: ${ ttl }ms`);

        return { remaining, ttl: ttl > 0 ? ttl : 0 };
    }
    catch (error) {
        console.error('[RateLimit] Get rate limit info failed:', error);
        return { remaining: maxRequests, ttl: 0 };
    }
}
