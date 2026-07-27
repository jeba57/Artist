import { Router } from "express";
import { body, param } from "express-validator";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/ApiResponse.js";
import { validate } from "../../middlewares/validate.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import * as cartService from "./cart.service.js";

const router = Router();
router.use(requireAuth);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    sendSuccess(res, { data: await cartService.getCart(req.user.id) });
  })
);

router.post(
  "/items",
  validate([body("productId").notEmpty(), body("quantity").optional().isInt({ min: 1, max: 20 }).toInt()]),
  asyncHandler(async (req, res) => {
    const data = await cartService.addToCart(req.user.id, req.body.productId, req.body.quantity || 1);
    sendSuccess(res, { statusCode: 201, message: "Added to cart.", data });
  })
);

router.patch(
  "/items/:productId",
  validate([param("productId").notEmpty(), body("quantity").isInt({ min: 0, max: 20 }).toInt()]),
  asyncHandler(async (req, res) => {
    const data = await cartService.updateCartItemQuantity(req.user.id, req.params.productId, req.body.quantity);
    sendSuccess(res, { message: "Cart updated.", data });
  })
);

router.delete(
  "/items/:productId",
  asyncHandler(async (req, res) => {
    const data = await cartService.removeFromCart(req.user.id, req.params.productId);
    sendSuccess(res, { message: "Item removed.", data });
  })
);

router.delete(
  "/",
  asyncHandler(async (req, res) => {
    const data = await cartService.clearCart(req.user.id);
    sendSuccess(res, { message: "Cart cleared.", data });
  })
);

export default router;
