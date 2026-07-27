import crypto from "crypto";
import { redis, cacheGetJson, cacheSetJson, CACHE_TTL } from "../../config/redis.js";
import { ApiError } from "../../utils/ApiError.js";
import * as productsRepo from "./products.repository.js";
import { toProductCardDTO, toProductDetailDTO } from "./products.mapper.js";

const RECENTLY_VIEWED_CAP = 20;
const SEARCH_SUGGEST_KEY = "search:suggest"; // sorted set: member=product name, score=popularity
const TRENDING_VIEWS_KEY = "trending:views"; // sorted set: member=product id, score=view count

const hashFilters = (filters) => crypto.createHash("md5").update(JSON.stringify(filters)).digest("hex");

export const getProducts = async (filters) => {
  const cacheKey = `products:list:${hashFilters(filters)}`;
  const cached = await cacheGetJson(cacheKey);
  if (cached) return cached;

  const { items, total } = await productsRepo.listProducts(filters);
  const result = {
    items: items.map(toProductCardDTO),
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total,
      totalPages: Math.max(Math.ceil(total / filters.limit), 1),
    },
  };
  await cacheSetJson(cacheKey, result, CACHE_TTL.PRODUCT_LIST);
  return result;
};

export const getProductBySlug = async (slug, viewerId) => {
  const cacheKey = `product:${slug}`;
  let row = await cacheGetJson(cacheKey);
  if (!row) {
    row = await productsRepo.findProductBySlug(slug);
    if (!row) throw ApiError.notFound("Product not found.");
    await cacheSetJson(cacheKey, row, CACHE_TTL.PRODUCT);
  }

  // Fire-and-forget signals: trending score + search suggestions +
  // recently viewed. None of these should block or fail the request.
  redis.zincrby(TRENDING_VIEWS_KEY, 1, row.id).catch(() => {});
  redis.zincrby(SEARCH_SUGGEST_KEY, 1, row.name).catch(() => {});
  if (viewerId) {
    redis
      .multi()
      .lrem(`recently-viewed:${viewerId}`, 0, row.id)
      .lpush(`recently-viewed:${viewerId}`, row.id)
      .ltrim(`recently-viewed:${viewerId}`, 0, RECENTLY_VIEWED_CAP - 1)
      .expire(`recently-viewed:${viewerId}`, 60 * 60 * 24 * 30)
      .exec()
      .catch(() => {});
  }

  const similar = await productsRepo.listSimilarProducts({ categoryId: row.category_id, excludeProductId: row.id });

  return {
    product: toProductDetailDTO(row),
    similarProducts: similar.map(toProductCardDTO),
  };
};

export const getHomeSections = async () => {
  const cacheKey = "home:sections";
  const cached = await cacheGetJson(cacheKey);
  if (cached) return cached;

  const [editorsPicks, featured, trendingSeed] = await Promise.all([
    productsRepo.listByFlag("is_editors_pick", 8),
    productsRepo.listByFlag("is_featured", 8),
    productsRepo.listByFlag("is_trending", 8),
  ]);

  const result = {
    editorsPicks: editorsPicks.map(toProductCardDTO),
    featuredCollection: featured.map(toProductCardDTO),
    trending: trendingSeed.map(toProductCardDTO),
  };
  await cacheSetJson(cacheKey, result, CACHE_TTL.HOME_SECTIONS);
  return result;
};

/** Live trending, ranked by real view counts in Redis (falls back to seed flag if empty). */
export const getLiveTrending = async (limit = 8) => {
  const topIds = await redis.zrevrange(TRENDING_VIEWS_KEY, 0, limit - 1);
  if (!topIds.length) {
    const seeded = await productsRepo.listByFlag("is_trending", limit);
    return seeded.map(toProductCardDTO);
  }
  const rows = await productsRepo.listByIds(topIds);
  const byId = new Map(rows.map((r) => [r.id, r]));
  return topIds.map((id) => byId.get(id)).filter(Boolean).map(toProductCardDTO);
};

export const getRecentlyViewed = async (userId, limit = 10) => {
  if (!userId) return [];
  const ids = await redis.lrange(`recently-viewed:${userId}`, 0, limit - 1);
  if (!ids.length) return [];
  const rows = await productsRepo.listByIds(ids);
  const byId = new Map(rows.map((r) => [r.id, r]));
  return ids.map((id) => byId.get(id)).filter(Boolean).map(toProductCardDTO);
};

export const getSearchSuggestions = async (prefix, limit = 8) => {
  if (!prefix || prefix.length < 2) return [];
  // Sorted set isn't natively prefix-searchable at scale, but for a
  // demo-data catalog this linear scan over top members is plenty fast.
  // (Production note: swap for RediSearch or a trigram index at scale.)
  const all = await redis.zrevrange(SEARCH_SUGGEST_KEY, 0, 200);
  const lower = prefix.toLowerCase();
  return all.filter((name) => name.toLowerCase().includes(lower)).slice(0, limit);
};
