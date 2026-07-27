import { query } from "express-validator";

export const listProductsValidation = [
  query("search").optional().trim().isLength({ max: 100 }),
  query("category").optional().trim().isLength({ max: 60 }),
  query("minPrice").optional().isFloat({ min: 0 }).toFloat(),
  query("maxPrice").optional().isFloat({ min: 0 }).toFloat(),
  query("sort").optional().isIn(["newest", "price_low", "price_high", "rating", "popular"]),
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 48 }).toInt(),
];

export const searchSuggestValidation = [query("q").trim().isLength({ min: 2, max: 60 })];
