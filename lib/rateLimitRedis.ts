import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';
import { NextRequest } from 'next/server';

/**
 * PRODUCTION REDIS RATE LIMITER
 * 
 * Uses Upstash Redis for distributed rate limiting across multiple servers
 * 
 * Setup:
 * 1. Create free Upstash Redis database: https://upstash.com/
 * 2. Add to .env.local:
 *    UPSTASH_REDIS_REST_URL=https://your-db.upstash.io
 *    UPSTASH_REDIS_REST_TOKEN=your-token
 * 
 * Fallback:
 * - If Redis not configured, falls back to in-memory (single server only)
 */

// Initialize Upstash Redis client
let redis: Redis | null = null;
let rateLimiters: { [key: string]: Ratelimit } = {};

try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    
    console.log('[Rate Limit] ✅ Upstash Redis configured');
  } else {
    console.warn('[Rate Limit] ⚠️  Upstash Redis not configured, using in-memory fallback');
    console.warn('[Rate Limit] ⚠️  Add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to .env.local');
  }
} catch (error) {
  console.error('[Rate Limit] ❌ Failed to initialize Redis:', error);
}

// In-memory fallback store (for development or single-server deployments)
interface InMemoryStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const memoryStore: InMemoryStore = {};

// Cleanup expired entries every 5 minutes
if (!redis) {
  setInterval(() => {
    const now = Date.now();
    Object.keys(memoryStore).forEach((key) => {
      if (memoryStore[key].resetTime < now) {
        delete memoryStore[key];
      }
    });
  }, 5 * 60 * 1000);
}

export interface RateLimitConfig {
  limit: number; // Max requests
  windowMs: number; // Time window in milliseconds
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetIn: number; // ms until reset
  limit: number;
}

/**
 * Get or create rate limiter for specific config
 */
function getRateLimiter(config: RateLimitConfig, prefix: string = 'default'): Ratelimit | null {
  if (!redis) return null;

  const key = `${prefix}_${config.limit}_${config.windowMs}`;
  
  if (!rateLimiters[key]) {
    rateLimiters[key] = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(config.limit, `${config.windowMs}ms`),
      prefix: `ratelimit:${prefix}`,
      analytics: true, // Enable analytics in Upstash console
    });
  }

  return rateLimiters[key];
}

/**
 * Check rate limit using Redis or in-memory fallback
 */
export async function checkRateLimit(
  request: NextRequest,
  identifier: string,
  config: RateLimitConfig,
  prefix: string = 'default'
): Promise<RateLimitResult> {
  const now = Date.now();

  // Try Redis first
  if (redis) {
    try {
      const rateLimiter = getRateLimiter(config, prefix);
      
      if (rateLimiter) {
        const result = await rateLimiter.limit(identifier);
        
        return {
          allowed: result.success,
          remaining: result.remaining,
          resetIn: result.reset - now,
          limit: result.limit
        };
      }
    } catch (error) {
      console.error('[Rate Limit] Redis error, falling back to memory:', error);
      // Fall through to in-memory
    }
  }

  // In-memory fallback
  const key = `${prefix}:${identifier}`;

  // Get or create entry
  if (!memoryStore[key] || memoryStore[key].resetTime < now) {
    memoryStore[key] = {
      count: 0,
      resetTime: now + config.windowMs
    };
  }

  const entry = memoryStore[key];

  // Increment count
  entry.count += 1;

  const allowed = entry.count <= config.limit;
  const remaining = Math.max(0, config.limit - entry.count);
  const resetIn = entry.resetTime - now;

  return {
    allowed,
    remaining,
    resetIn,
    limit: config.limit
  };
}

/**
 * Get identifier from request (userId or IP)
 */
export function getIdentifier(request: NextRequest, userId?: string): string {
  if (userId) return userId;

  // Fallback to IP address
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded
    ? forwarded.split(',')[0].trim()
    : request.headers.get('x-real-ip') || 'unknown';

  return ip;
}

/**
 * Preset rate limit configurations
 */
export const RateLimitPresets = {
  // AI endpoints: 10 requests per minute per user
  AI_ENDPOINT: {
    limit: 10,
    windowMs: 60 * 1000 // 1 minute
  },

  // Attendance submit: 5 requests per hour per user (prevent spam)
  ATTENDANCE_SUBMIT: {
    limit: 5,
    windowMs: 60 * 60 * 1000 // 1 hour
  },

  // Biometric setup: 3 attempts per day per user (prevent abuse)
  BIOMETRIC_SETUP: {
    limit: 3,
    windowMs: 24 * 60 * 60 * 1000 // 24 hours
  },

  // General API: 100 requests per minute per IP
  GENERAL_API: {
    limit: 100,
    windowMs: 60 * 1000 // 1 minute
  },

  // Auth endpoints: 5 attempts per 15 minutes per IP (prevent brute force)
  AUTH_ENDPOINT: {
    limit: 5,
    windowMs: 15 * 60 * 1000 // 15 minutes
  },

  // Photo upload: 10 uploads per hour per user
  PHOTO_UPLOAD: {
    limit: 10,
    windowMs: 60 * 60 * 1000 // 1 hour
  }
} as const;

/**
 * Health check for Redis connection
 */
export async function checkRedisHealth(): Promise<{ healthy: boolean; provider: string }> {
  if (!redis) {
    return { healthy: true, provider: 'in-memory' };
  }

  try {
    await redis.ping();
    return { healthy: true, provider: 'upstash-redis' };
  } catch (error) {
    console.error('[Rate Limit] Redis health check failed:', error);
    return { healthy: false, provider: 'upstash-redis' };
  }
}
