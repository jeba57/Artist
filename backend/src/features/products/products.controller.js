import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/ApiResponse.js";
import * as productsService from "./products.service.js";

export const getProducts = asyncHandler(async (req, res) => {
  const filters = {
    search: req.query.search,
    categorySlug: req.query.category,
    minPrice: req.query.minPrice,
    maxPrice: req.query.maxPrice,
    sort: req.query.sort || "newest",
    page: req.query.page || 1,
    limit: req.query.limit || 12,
  };
  const result = await productsService.getProducts(filters);
  sendSuccess(res, { data: result.items, meta: result.pagination });
});

export const getProductBySlug = asyncHandler(async (req, res) => {
  const result = await productsService.getProductBySlug(req.params.slug, req.user?.id);
  sendSuccess(res, { data: result });
});

export const getHomeSections = asyncHandler(async (req, res) => {
  const sections = await productsService.getHomeSections();
  sendSuccess(res, { data: sections });
});

export const getTrending = asyncHandler(async (req, res) => {
  const trending = await productsService.getLiveTrending(Number(req.query.limit) || 8);
  sendSuccess(res, { data: trending });
});

export const getRecentlyViewed = asyncHandler(async (req, res) => {
  const items = await productsService.getRecentlyViewed(req.user?.id, Number(req.query.limit) || 10);
  sendSuccess(res, { data: items });
});

export const getSearchSuggestions = asyncHandler(async (req, res) => {
  const suggestions = await productsService.getSearchSuggestions(req.query.q);
  sendSuccess(res, { data: suggestions });
});
