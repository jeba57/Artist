import { Router } from "express";
import { param } from "express-validator";
import { query } from "../../config/db.js";
import { generateId } from "../../utils/ids.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/ApiResponse.js";
import { validate } from "../../middlewares/validate.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { toProductCardDTO } from "../products/products.mapper.js";
import { ApiError } from "../../utils/ApiError.js";

const router = Router();
router.use(requireAuth);

const PRODUCT_CARD_JOIN = `
  SELECT p.id, p.name, p.slug, p.short_description, p.images, p.price, p.discount_price,
         p.currency, p.stock, p.location, p.rating_avg, p.rating_count,
         p.is_featured, p.is_editors_pick, p.is_trending, p.created_at,
         c.id AS category_id, c.name AS category_name, c.slug AS category_slug,
         a.id AS artisan_id, a.name AS artisan_name, a.slug AS artisan_slug, a.verified AS artisan_verified
  FROM wishlist_items w
  JOIN products p ON p.id = w.product_id
  JOIN categories c ON c.id = p.category_id
  JOIN artisans a ON a.id = p.artisan_id
  WHERE w.user_id = $1
  ORDER BY w.created_at DESC
`;

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { rows } = await query(PRODUCT_CARD_JOIN, [req.user.id]);
    sendSuccess(res, { data: rows.map(toProductCardDTO) });
  })
);

router.post(
  "/:productId",
  validate([param("productId").notEmpty()]),
  asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const product = await query(`SELECT id FROM products WHERE id = $1`, [productId]);
    if (!product.rows[0]) throw ApiError.notFound("Product not found.");

    await query(
      `INSERT INTO wishlist_items (id, user_id, product_id) VALUES ($1, $2, $3)
       ON CONFLICT (user_id, product_id) DO NOTHING`,
      [generateId("wl_"), req.user.id, productId]
    );
    sendSuccess(res, { statusCode: 201, message: "Added to wishlist." });
  })
);

router.delete(
  "/:productId",
  asyncHandler(async (req, res) => {
    await query(`DELETE FROM wishlist_items WHERE user_id = $1 AND product_id = $2`, [req.user.id, req.params.productId]);
    sendSuccess(res, { message: "Removed from wishlist." });
  })
);

export default router;
