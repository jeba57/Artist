import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/ApiResponse.js";
import { cacheGetJson, cacheSetJson, CACHE_TTL } from "../../config/redis.js";
import * as categoriesRepo from "./categories.repository.js";

const router = Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const cacheKey = "category:list";
    const cached = await cacheGetJson(cacheKey);
    if (cached) return sendSuccess(res, { data: cached });

    const categories = await categoriesRepo.listCategories();
    await cacheSetJson(cacheKey, categories, CACHE_TTL.CATEGORY_LIST);
    sendSuccess(res, { data: categories });
  })
);

export default router;
