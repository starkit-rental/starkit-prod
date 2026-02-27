import { LRUCache } from "lru-cache";

type RateLimitOptions = {
  interval: number; // milliseconds
  uniqueTokenPerInterval: number;
};

export function rateLimit(options: RateLimitOptions) {
  const tokenCache = new LRUCache({
    max: options.uniqueTokenPerInterval,
    ttl: options.interval,
  });

  return {
    check: (limit: number, token: string) =>
      new Promise<void>((resolve, reject) => {
        const tokenCount = (tokenCache.get(token) as number[]) || [0];
        if (tokenCount[0] === 0) {
          tokenCache.set(token, tokenCount);
        }
        tokenCount[0] += 1;

        const currentUsage = tokenCount[0];
        const isRateLimited = currentUsage >= limit;

        return isRateLimited
          ? reject(new Error("Rate limit exceeded"))
          : resolve();
      }),
  };
}

// Rate limiter for checkout - 5 requests per 60 seconds per IP
export const checkoutLimiter = rateLimit({
  interval: 60 * 1000, // 60 seconds
  uniqueTokenPerInterval: 500, // Max 500 unique IPs tracked
});

// Rate limiter for availability checks - 20 requests per 10 seconds per IP
export const availabilityLimiter = rateLimit({
  interval: 10 * 1000, // 10 seconds
  uniqueTokenPerInterval: 1000,
});

// Rate limiter for general public endpoints - 30 requests per 60 seconds per IP
export const publicLimiter = rateLimit({
  interval: 60 * 1000,
  uniqueTokenPerInterval: 1000,
});

// Helper to get client IP from request
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  
  if (realIp) {
    return realIp;
  }
  
  return "unknown";
}
