import { Router } from "express";
import * as productsController from "./products.controller.js";
import { listProductsValidation, searchSuggestValidation } from "./products.validation.js";
import { validate } from "../../middlewares/validate.js";
import { optionalAuth, requireAuth } from "../../middlewares/auth.middleware.js";

const router = Router();

router.get("/", validate(listProductsValidation), productsController.getProducts);
router.get("/home-sections", productsController.getHomeSections);
router.get("/trending", productsController.getTrending);
router.get("/search/suggestions", validate(searchSuggestValidation), productsController.getSearchSuggestions);
router.get("/recently-viewed", requireAuth, productsController.getRecentlyViewed);
router.get("/:slug", optionalAuth, productsController.getProductBySlug);

export default router;
