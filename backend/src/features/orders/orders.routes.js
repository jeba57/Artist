import { Router } from "express";
import { body, param } from "express-validator";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/ApiResponse.js";
import { validate } from "../../middlewares/validate.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { rateLimit } from "../../middlewares/rateLimiter.js";
import * as ordersService from "./orders.service.js";

const router = Router();
router.use(requireAuth);

const checkoutRateLimit = rateLimit({ windowSeconds: 60, max: 10, routeKey: "checkout" });

router.post(
  "/checkout",
  checkoutRateLimit,
  validate([
    body("shippingAddress.fullName").notEmpty().withMessage("Full name is required."),
    body("shippingAddress.line1").notEmpty().withMessage("Address line is required."),
    body("shippingAddress.city").notEmpty().withMessage("City is required."),
    body("shippingAddress.pincode").notEmpty().withMessage("Pincode is required."),
    body("shippingAddress.phone").notEmpty().withMessage("Phone number is required."),
    body("paymentMethod").optional().isIn(["ONLINE", "COD"]),
  ]),
  asyncHandler(async (req, res) => {
    const data = await ordersService.startCheckout(req.user.id, req.body.shippingAddress, req.body.paymentMethod || "ONLINE");
    sendSuccess(res, { statusCode: 201, message: "Checkout started.", data });
  })
);

router.post(
  "/verify-payment",
  validate([
    body("razorpayOrderId").notEmpty(),
    body("razorpayPaymentId").notEmpty(),
    body("razorpaySignature").notEmpty(),
  ]),
  asyncHandler(async (req, res) => {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
    const result = await ordersService.verifyAndCapturePayment({ razorpayOrderId, razorpayPaymentId, razorpaySignature });
    sendSuccess(res, { message: "Payment verified. Your order is placed!", data: result });
  })
);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const orders = await ordersService.getBuyerOrders(req.user.id);
    sendSuccess(res, { data: orders });
  })
);

router.get(
  "/:id",
  validate([param("id").notEmpty()]),
  asyncHandler(async (req, res) => {
    const order = await ordersService.getOrderDetailForBuyer(req.user.id, req.params.id);
    sendSuccess(res, { data: order });
  })
);

router.post(
  "/:id/request-return",
  validate([param("id").notEmpty(), body("reason").trim().notEmpty().withMessage("A reason is required.")]),
  asyncHandler(async (req, res) => {
    const order = await ordersService.requestReturn(req.user.id, req.params.id, req.body.reason);
    sendSuccess(res, { message: "Return requested — we'll arrange a pickup.", data: order });
  })
);

export default router;
