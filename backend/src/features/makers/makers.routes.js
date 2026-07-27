import { Router } from "express";
import { param } from "express-validator";
import { query } from "../../config/db.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/ApiResponse.js";
import { validate } from "../../middlewares/validate.js";
import { cacheGetJson, cacheSetJson, CACHE_TTL } from "../../config/redis.js";
import { ApiError } from "../../utils/ApiError.js";
import { toProductCardDTO } from "../products/products.mapper.js";

const router = Router();

router.get(
  "/featured",
  asyncHandler(async (req, res) => {
    const cacheKey = "makers:featured";
    const cached = await cacheGetJson(cacheKey);
    if (cached) return sendSuccess(res, { data: cached });

    const { rows } = await query(
      `SELECT id, name, slug, bio, avatar_url, cover_image_url, location, craft_specialty,
              years_of_experience, verified, rating_avg, rating_count
       FROM artisans WHERE is_featured_maker = true
       ORDER BY rating_avg DESC LIMIT 8`
    );
    await cacheSetJson(cacheKey, rows, CACHE_TTL.HOME_SECTIONS);
    sendSuccess(res, { data: rows });
  })
);

router.get(
  "/:slug",
  validate([param("slug").notEmpty()]),
  asyncHandler(async (req, res) => {
    const { rows } = await query(`SELECT * FROM artisans WHERE slug = $1`, [req.params.slug]);
    const artisan = rows[0];
    if (!artisan) throw ApiError.notFound("Artisan not found.");

    const productsResult = await query(
      `SELECT p.id, p.name, p.slug, p.short_description, p.images, p.price, p.discount_price,
              p.currency, p.stock, p.location, p.rating_avg, p.rating_count,
              p.is_featured, p.is_editors_pick, p.is_trending, p.created_at,
              c.id AS category_id, c.name AS category_name, c.slug AS category_slug,
              $2::text AS artisan_id, $3::text AS artisan_name, $4::text AS artisan_slug, $5::boolean AS artisan_verified
       FROM products p JOIN categories c ON c.id = p.category_id
       WHERE p.artisan_id = $1
       ORDER BY p.created_at DESC`,
      [artisan.id, artisan.id, artisan.name, artisan.slug, artisan.verified]
    );

    sendSuccess(res, {
      data: {
        artisan: {
          id: artisan.id,
          name: artisan.name,
          slug: artisan.slug,
          bio: artisan.bio,
          story: artisan.story,
          avatarUrl: artisan.avatar_url,
          coverImageUrl: artisan.cover_image_url,
          location: artisan.location,
          craftSpecialty: artisan.craft_specialty,
          yearsOfExperience: artisan.years_of_experience,
          verified: artisan.verified,
          rating: { avg: artisan.rating_avg, count: artisan.rating_count },
        },
        products: productsResult.rows.map(toProductCardDTO),
      },
    });
  })
);

export default router;
