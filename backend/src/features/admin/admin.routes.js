import { Router } from "express";
import { param } from "express-validator";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/ApiResponse.js";
import { validate } from "../../middlewares/validate.js";
import { requireAuth, requireAdmin } from "../../middlewares/auth.middleware.js";
import { ApiError } from "../../utils/ApiError.js";
import * as ordersRepo from "../orders/orders.repository.js";
import { sendBuyerOrderConfirmedEmail } from "../../utils/email.js";

const router = Router();
router.use(requireAuth, requireAdmin);

router.get(
  "/orders",
  asyncHandler(async (req, res) => {
    const needsConfirmation = req.query.status === "needs_confirmation";
    const orders = await ordersRepo.listOrdersForAdmin({ needsConfirmation });
    sendSuccess(res, { data: orders });
  })
);

router.get(
  "/orders/:id",
  validate([param("id").notEmpty()]),
  asyncHandler(async (req, res) => {
    const order = await ordersRepo.getOrderWithItems(req.params.id);
    if (!order) throw ApiError.notFound("Order not found.");
    sendSuccess(res, { data: order });
  })
);

// The core "I verified this arrived" action. Flips the order to
// DELIVERED and moves every line item's payout from NOT_APPLICABLE
// to PENDING — i.e. "sellers are now owed this money."
router.post(
  "/orders/:id/confirm",
  validate([param("id").notEmpty()]),
  asyncHandler(async (req, res) => {
    const order = await ordersRepo.confirmOrderDelivered({ orderId: req.params.id, adminUserId: req.user.id });
    if (!order) throw ApiError.badRequest("Order is already confirmed, or hasn't been paid yet.");

    const fullOrder = await ordersRepo.getOrderWithItems(order.id);
    sendBuyerOrderConfirmedEmail(fullOrder).catch((err) => console.error("[email] buyer notify failed:", err.message));

    sendSuccess(res, { message: "Order confirmed. Seller payouts are now marked pending.", data: order });
  })
);

// Payouts you (the admin) owe to sellers — real money movement (UPI /
// bank transfer) still happens outside this app for now; this is
// where you log that it happened.
router.get(
  "/payouts",
  asyncHandler(async (req, res) => {
    const payouts = await ordersRepo.listPendingPayouts();
    const totalOwed = payouts.reduce((sum, p) => sum + Number(p.seller_amount), 0);
    sendSuccess(res, { data: payouts, meta: { totalOwed: Number(totalOwed.toFixed(2)), count: payouts.length } });
  })
);

router.post(
  "/payouts/:orderItemId/mark-paid",
  validate([param("orderItemId").notEmpty()]),
  asyncHandler(async (req, res) => {
    const updated = await ordersRepo.markPayoutPaid(req.params.orderItemId);
    if (!updated) throw ApiError.badRequest("This payout was already marked paid, or doesn't exist.");
    sendSuccess(res, { message: "Payout marked as paid.", data: updated });
  })
);

export default router;
