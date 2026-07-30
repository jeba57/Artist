import { Router } from "express";
import { body } from "express-validator";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/ApiResponse.js";
import { validate } from "../../middlewares/validate.js";
import { requireSellerAuth, requireVerifiedSeller } from "../../middlewares/auth.middleware.js";
import { ApiError } from "../../utils/ApiError.js";
import { makeSlug } from "../../utils/ids.js";
import * as productsRepo from "../products/products.repository.js";
import { query } from "../../config/db.js";

const router = Router();

// Every route here requires BOTH a valid seller session AND an
// APPROVED verification status — this is the actual enforcement of
// "only verified sellers can list products," not just documentation.
router.use(requireSellerAuth, requireVerifiedSeller);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const products = await productsRepo.listProductsForArtisan(req.seller.id);
    sendSuccess(res, { data: products });
  })
);

router.post(
  "/",
  validate([
    body("categorySlug").notEmpty().withMessage("Category is required."),
    body("name").trim().isLength({ min: 3, max: 150 }).withMessage("Product name is required."),
    body("shortDescription").trim().isLength({ min: 10, max: 300 }).withMessage("Short description is required."),
    body("story").trim().isLength({ min: 20 }).withMessage("Tell the story behind this piece (at least 20 characters)."),
    body("price").isFloat({ min: 1 }).withMessage("Price must be a positive number."),
    body("stock").isInt({ min: 0 }).withMessage("Stock must be 0 or more."),
    body("images").isArray({ min: 1 }).withMessage("At least one product image is required."),
  ]),
  asyncHandler(async (req, res) => {
    const category = await query(`SELECT id FROM categories WHERE slug = $1`, [req.body.categorySlug]);
    if (!category.rows[0]) throw ApiError.badRequest("Unknown category.");

    const artisan = await query(`SELECT location FROM artisans WHERE id = $1`, [req.seller.id]);

    const product = await productsRepo.createProductForArtisan({
      artisanId: req.seller.id,
      categoryId: category.rows[0].id,
      name: req.body.name,
      slug: `${makeSlug(req.body.name)}-${Date.now().toString(36)}`, // seller-authored names can collide; keep it simple + unique
      shortDescription: req.body.shortDescription,
      story: req.body.story,
      craftProcess: req.body.craftProcess || [],
      materials: req.body.materials || [],
      images: req.body.images,
      price: req.body.price,
      discountPrice: req.body.discountPrice || null,
      stock: req.body.stock,
      location: req.body.location || artisan.rows[0].location,
    });

    sendSuccess(res, { statusCode: 201, message: "Product listed.", data: product });
  })
);

export default router;
