import { Router } from "express";
import { body, param } from "express-validator";
import { withTransaction, query } from "../../config/db.js";
import { generateId } from "../../utils/ids.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/ApiResponse.js";
import { validate } from "../../middlewares/validate.js";
import { requireAuth, optionalAuth } from "../../middlewares/auth.middleware.js";
import { ApiError } from "../../utils/ApiError.js";
import { recalculateProductRating } from "../products/products.repository.js";
import { redis, cacheDelByPattern } from "../../config/redis.js";

const router = Router();

router.get(
  "/product/:productId",
  optionalAuth,
  validate([param("productId").notEmpty()]),
  asyncHandler(async (req, res) => {
    const { rows } = await query(
      `SELECT r.id, r.rating, r.comment, r.created_at, u.name AS reviewer_name, u.avatar_url AS reviewer_avatar
       FROM reviews r JOIN users u ON u.id = r.user_id
       WHERE r.product_id = $1
       ORDER BY r.created_at DESC`,
      [req.params.productId]
    );
    sendSuccess(res, { data: rows });
  })
);

router.post(
  "/product/:productId",
  requireAuth,
  validate([
    param("productId").notEmpty(),
    body("rating").isInt({ min: 1, max: 5 }),
    body("comment").optional().trim().isLength({ max: 1000 }),
  ]),
  asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const { rating, comment } = req.body;

    const productExists = await query(`SELECT id, slug FROM products WHERE id = $1`, [productId]);
    if (!productExists.rows[0]) throw ApiError.notFound("Product not found.");
    const { slug } = productExists.rows[0];

    const review = await withTransaction(async (client) => {
      const { rows } = await client.query(
        `INSERT INTO reviews (id, user_id, product_id, rating, comment)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (user_id, product_id)
         DO UPDATE SET rating = EXCLUDED.rating, comment = EXCLUDED.comment
         RETURNING *`,
        [generateId("rev_"), req.user.id, productId, rating, comment || null]
      );
      await recalculateProductRating(productId, client);
      return rows[0];
    });

    // Product detail is cached by slug (see products.service.js) — that's
    // the actual key we must clear so the updated rating shows up
    // immediately rather than waiting out the TTL.
    await redis.del(`product:${slug}`).catch(() => {});
    // Cached list/home-section pages also embed rating_avg/count, so
    // clear those too rather than serving stale numbers for ~3-5 min.
    await cacheDelByPattern("products:list:*").catch(() => {});
    await redis.del("home:sections").catch(() => {});

    sendSuccess(res, { statusCode: 201, message: "Review submitted.", data: review });
  })
);

export default router;
