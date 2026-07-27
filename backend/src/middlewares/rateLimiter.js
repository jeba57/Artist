import { redis } from "../config/redis.js";
import { ApiError } from "../utils/ApiError.js";

/**
 * Fixed-window rate limiter backed by Redis (INCR + EXPIRE).
 * Namespaced per-route so e.g. login attempts and OTP requests
 * don't share a budget.
 */
export const rateLimit = ({ windowSeconds, max, routeKey }) =>
  async (req, res, next) => {
    try {
      const identifier = req.user?.id || req.ip;
      const key = `ratelimit:${routeKey}:${identifier}`;
      const count = await redis.incr(key);
      if (count === 1) await redis.expire(key, windowSeconds);

      res.setHeader("X-RateLimit-Limit", max);
      res.setHeader("X-RateLimit-Remaining", Math.max(max - count, 0));

      if (count > max) {
        const ttl = await redis.ttl(key);
        res.setHeader("Retry-After", ttl > 0 ? ttl : windowSeconds);
        return next(ApiError.tooManyRequests("Too many requests. Please try again shortly.", { retryAfterSeconds: ttl }));
      }
      next();
    } catch (err) {
      // Fail-open: if Redis is down, don't block the whole API on it.
      next();
    }
  };
