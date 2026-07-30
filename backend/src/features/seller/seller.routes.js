import { Router } from "express";
import { upload, isCloudinaryConfigured } from "../../config/cloudinary.js";
import { validate } from "../../middlewares/validate.js";
import { requireSellerAuth } from "../../middlewares/auth.middleware.js";
import { rateLimit } from "../../middlewares/rateLimiter.js";
import { ApiError } from "../../utils/ApiError.js";
import { sellerRegisterValidation, sellerLoginValidation } from "./seller.validation.js";
import * as sellerController from "./seller.controller.js";

const router = Router();

// Must run BEFORE the multer/Cloudinary upload middleware below —
// otherwise a missing Cloudinary config surfaces as a raw SDK error
// from inside multer, not a clean ApiError from our own code.
const requireUploadsConfigured = (req, res, next) => {
  if (!isCloudinaryConfigured()) {
    return next(
      ApiError.badRequest(
        "Document uploads aren't set up yet — add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to backend/.env (see README)."
      )
    );
  }
  next();
};

// Five optional document fields — reuses the exact same Cloudinary
// upload middleware already used for product images, just fielded
// differently for a registration form instead of a single image.
const documentUploads = upload.fields([
  { name: "logo", maxCount: 1 },
  { name: "govId", maxCount: 1 },
  { name: "panCard", maxCount: 1 },
  { name: "gstCertificate", maxCount: 1 },
  { name: "bankProof", maxCount: 1 },
]);

const authRateLimit = rateLimit({ windowSeconds: 60 * 15, max: 10, routeKey: "seller-auth" });

router.post(
  "/register",
  authRateLimit,
  requireUploadsConfigured,
  documentUploads,
  validate(sellerRegisterValidation),
  sellerController.register
);
router.post("/login", authRateLimit, validate(sellerLoginValidation), sellerController.login);
router.get("/me", requireSellerAuth, sellerController.me);
router.post("/resubmit", requireSellerAuth, requireUploadsConfigured, documentUploads, sellerController.resubmit);
router.post("/logout", requireSellerAuth, sellerController.logout);

export default router;
