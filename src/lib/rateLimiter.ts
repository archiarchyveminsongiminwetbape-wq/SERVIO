// Simple rate limiter for client-side API calls
// For production, use server-side rate limiting

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig = { maxRequests: 100, windowMs: 60000 }) {
    this.config = config;
  }

  canMakeRequest(identifier: string): boolean {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    
    let timestamps = this.requests.get(identifier) || [];
    
    // Remove old timestamps outside the window
    timestamps = timestamps.filter(timestamp => timestamp > windowStart);
    
    if (timestamps.length >= this.config.maxRequests) {
      return false;
    }
    
    timestamps.push(now);
    this.requests.set(identifier, timestamps);
    
    return true;
  }

  getRemainingRequests(identifier: string): number {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    
    const timestamps = this.requests.get(identifier) || [];
    const validTimestamps = timestamps.filter(timestamp => timestamp > windowStart);
    
    return Math.max(0, this.config.maxRequests - validTimestamps.length);
  }

  reset(identifier: string): void {
    this.requests.delete(identifier);
  }

  cleanup(): void {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    
    for (const [identifier, timestamps] of this.requests.entries()) {
      const validTimestamps = timestamps.filter(timestamp => timestamp > windowStart);
      if (validTimestamps.length === 0) {
        this.requests.delete(identifier);
      } else {
        this.requests.set(identifier, validTimestamps);
      }
    }
  }
}

// Create instances for different use cases
export const apiRateLimiter = new RateLimiter({ maxRequests: 100, windowMs: 60000 }); // 100 requests per minute
export const searchRateLimiter = new RateLimiter({ maxRequests: 30, windowMs: 60000 }); // 30 searches per minute
export const authRateLimiter = new RateLimiter({ maxRequests: 5, windowMs: 60000 }); // 5 auth attempts per minute

// Cleanup old entries every 5 minutes
setInterval(() => {
  apiRateLimiter.cleanup();
  searchRateLimiter.cleanup();
  authRateLimiter.cleanup();
}, 300000);

export function withRateLimit<T extends (...args: any[]) => any>(
  fn: T,
  rateLimiter: RateLimiter,
  identifier: string
): T {
  return ((...args: Parameters<T>) => {
    if (!rateLimiter.canMakeRequest(identifier)) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }
    return fn(...args);
  }) as T;
}
