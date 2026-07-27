import Redis from "ioredis";
import "dotenv/config";

export const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: 2,
  lazyConnect: false,
});

redis.on("error", (err) => {
  // eslint-disable-next-line no-console
  console.error("[redis] connection error", err.message);
});

redis.on("connect", () => {
  // eslint-disable-next-line no-console
  console.log("[redis] connected");
});

// ------------------------------------------------------------
// Key namespaces used across the app (documented in one place
// so cache keys never collide by accident):
//
//   product:{id}                 -> cached single product JSON
//   products:list:{hash}         -> cached paginated/filtered list
//   category:list                -> cached category list
//   home:featured | home:trending | home:editors-picks
//   cart:{userId}                -> cached cart summary
//   search:suggest:{prefix}      -> sorted set of suggestions
//   trending:views                -> sorted set, product views (for live trending)
//   recently-viewed:{userId}     -> list, capped
//   session:{refreshTokenJti}    -> refresh token allow-list
//   otp:{email}                  -> OTP storage, short TTL
//   ratelimit:{ip}:{route}       -> sliding window counters
// ------------------------------------------------------------

export const CACHE_TTL = {
  PRODUCT: 60 * 10, // 10 min
  PRODUCT_LIST: 60 * 3, // 3 min
  CATEGORY_LIST: 60 * 60, // 1 hr
  HOME_SECTIONS: 60 * 5, // 5 min
};

export const cacheGetJson = async (key) => {
  const raw = await redis.get(key);
  return raw ? JSON.parse(raw) : null;
};

export const cacheSetJson = async (key, value, ttlSeconds) => {
  await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
};

export const cacheDelByPattern = async (pattern) => {
  const stream = redis.scanStream({ match: pattern, count: 100 });
  const keysToDelete = [];
  for await (const keys of stream) {
    keysToDelete.push(...keys);
  }
  if (keysToDelete.length) await redis.del(keysToDelete);
};
