import { LRUCache } from "lru-cache";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// ─── Upstash Redis rate limiter (persistent across serverless cold starts) ───
// Falls back to in-memory LRU when UPSTASH env vars are not configured.
// To enable: set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in env.

function createUpstashClient(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

const redisClient = createUpstashClient();

type UpstashLimiter = { check: (limit: number, token: string) => Promise<void> };

function createUpstashLimiter(requests: number, windowSeconds: number): UpstashLimiter {
  if (!redisClient) return createInMemoryLimiter(windowSeconds * 1000, 1000);

  const limiter = new Ratelimit({
    redis: redisClient,
    limiter: Ratelimit.slidingWindow(requests, `${windowSeconds} s`),
    analytics: false,
  });

  return {
    check: async (_limit: number, token: string) => {
      const { success } = await limiter.limit(token);
      if (!success) throw new Error("Rate limit exceeded");
    },
  };
}

// ─── In-memory LRU fallback (resets on cold starts — best-effort only) ───────

type RateLimitOptions = {
  interval: number;
  uniqueTokenPerInterval: number;
};

function createInMemoryLimiter(interval: number, uniqueTokenPerInterval: number): UpstashLimiter {
  const tokenCache = new LRUCache<string, number[]>({
    max: uniqueTokenPerInterval,
    ttl: interval,
  });

  return {
    check: (limit: number, token: string) =>
      new Promise<void>((resolve, reject) => {
        const tokenCount = tokenCache.get(token) ?? [0];
        if (tokenCount[0] === 0) tokenCache.set(token, tokenCount);
        tokenCount[0] += 1;
        tokenCount[0] >= limit
          ? reject(new Error("Rate limit exceeded"))
          : resolve();
      }),
  };
}

// ─── Named limiters ───────────────────────────────────────────────────────────

// Checkout: 5 requests per 60 s per IP
export const checkoutLimiter = createUpstashLimiter(5, 60);

// Availability checks: 20 requests per 10 s per IP
export const availabilityLimiter = createUpstashLimiter(20, 10);

// General public endpoints: 30 requests per 60 s per IP
export const publicLimiter = createUpstashLimiter(30, 60);

// ─── IP extraction ────────────────────────────────────────────────────────────
// Deployed on Vercel. Priority:
//   1. x-real-ip                 — Vercel proxy-injected client IP, reliable
//   2. x-vercel-forwarded-for    — Vercel-injected, cannot be spoofed by client
//   3. x-forwarded-for (first)   — can be spoofed; last resort only
export function getClientIp(req: Request): string {
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  const vercelForwarded = req.headers.get("x-vercel-forwarded-for");
  if (vercelForwarded) return vercelForwarded.split(",")[0].trim();

  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();

  return "unknown";
}
