import { Router } from "express";
import { param, body } from "express-validator";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/ApiResponse.js";
import { validate } from "../../middlewares/validate.js";
import { requireAuth, requireAdmin } from "../../middlewares/auth.middleware.js";
import { ApiError } from "../../utils/ApiError.js";
import * as ordersRepo from "../orders/orders.repository.js";
import * as adminRepo from "./admin.repository.js";
import { sendBuyerOrderConfirmedEmail } from "../../utils/email.js";

const router = Router();
router.use(requireAuth, requireAdmin);

const VALID_STATUSES = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED"];

router.get(
  "/orders",
  asyncHandler(async (req, res) => {
    const statusFilter = VALID_STATUSES.includes(req.query.status) ? req.query.status : undefined;
    const orders = await ordersRepo.listOrdersForAdmin({ statusFilter });
    sendSuccess(res, { data: orders });
  })
);

router.get(
  "/orders/:id",
  validate([param("id").notEmpty()]),
  asyncHandler(async (req, res) => {
    const order = await ordersRepo.getOrderWithItems(req.params.id);
    if (!order) throw ApiError.notFound("Order not found.");
    const shipmentEvents = await ordersRepo.getShipmentEvents(req.params.id);
    sendSuccess(res, { data: { ...order, shipmentEvents } });
  })
);

// Admin's one remaining manual transition: PENDING -> CONFIRMED.
// Everything from READY_FOR_PICKUP onward is seller-triggered (real
// shipment creation) or webhook-driven (courier status updates) —
// see seller.orders.routes.js and shipping.webhook.routes.js.
router.post(
  "/orders/:id/status",
  validate([param("id").notEmpty(), body("status").isIn(["CONFIRMED"])]),
  asyncHandler(async (req, res) => {
    const order = await ordersRepo.advanceOrderStatus({
      orderId: req.params.id,
      newStatus: req.body.status,
      adminUserId: req.user.id,
    });
    if (!order) {
      throw ApiError.badRequest("This order isn't in the right state for that action (it may have already moved on).");
    }

    if (order.status === "DELIVERED") {
      const fullOrder = await ordersRepo.getOrderWithItems(order.id);
      sendBuyerOrderConfirmedEmail(fullOrder).catch((err) => console.error("[email] buyer notify failed:", err.message));
    }

    sendSuccess(res, { message: `Order marked as ${order.status.toLowerCase()}.`, data: order });
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

router.get(
  "/users",
  asyncHandler(async (req, res) => {
    const users = await adminRepo.listUsers();
    sendSuccess(res, { data: users });
  })
);

router.get(
  "/stats",
  asyncHandler(async (req, res) => {
    const stats = await adminRepo.getDashboardStats();
    sendSuccess(res, { data: stats });
  })
);

// ------------------------------------------------------------
// SELLER APPLICATION REVIEW
// ------------------------------------------------------------

router.get(
  "/sellers",
  asyncHandler(async (req, res) => {
    const validStatuses = ["PENDING", "APPROVED", "REJECTED"];
    const statusFilter = validStatuses.includes(req.query.status) ? req.query.status : undefined;
    const sellers = await adminRepo.listSellerApplications({ statusFilter });
    sendSuccess(res, { data: sellers });
  })
);

router.get(
  "/sellers/:id",
  validate([param("id").notEmpty()]),
  asyncHandler(async (req, res) => {
    const seller = await adminRepo.getSellerApplication(req.params.id);
    if (!seller) throw ApiError.notFound("Seller application not found.");
    sendSuccess(res, { data: seller });
  })
);

router.post(
  "/sellers/:id/approve",
  validate([param("id").notEmpty()]),
  asyncHandler(async (req, res) => {
    const seller = await adminRepo.approveSellerApplication(req.params.id, req.user.id);
    if (!seller) throw ApiError.badRequest("This seller is already approved, or doesn't exist.");
    sendSuccess(res, { message: `${seller.name} is now a verified seller.`, data: seller });
  })
);

router.post(
  "/sellers/:id/reject",
  validate([param("id").notEmpty(), body("reason").trim().isLength({ min: 5, max: 500 }).withMessage("Please give a reason (5-500 characters) so the seller knows what to fix.")]),
  asyncHandler(async (req, res) => {
    const seller = await adminRepo.rejectSellerApplication(req.params.id, req.user.id, req.body.reason);
    if (!seller) throw ApiError.badRequest("This seller is already approved, so it can't be rejected.");
    sendSuccess(res, { message: `${seller.name}'s application was rejected.`, data: seller });
  })
);

// ------------------------------------------------------------
// RETURNS
// ------------------------------------------------------------

router.get(
  "/returns",
  asyncHandler(async (req, res) => {
    const returns = await adminRepo.listReturnRequests();
    sendSuccess(res, { data: returns });
  })
);

router.post(
  "/orders/:id/return/approve",
  validate([param("id").notEmpty()]),
  asyncHandler(async (req, res) => {
    const order = await ordersRepo.decideReturn({ orderId: req.params.id, approve: true, adminUserId: req.user.id });
    if (!order) throw ApiError.badRequest("No pending return request for this order.");
    sendSuccess(res, { message: "Return approved.", data: order });
  })
);

router.post(
  "/orders/:id/return/reject",
  validate([param("id").notEmpty()]),
  asyncHandler(async (req, res) => {
    const order = await ordersRepo.decideReturn({ orderId: req.params.id, approve: false, adminUserId: req.user.id });
    if (!order) throw ApiError.badRequest("No pending return request for this order.");
    sendSuccess(res, { message: "Return rejected.", data: order });
  })
);

export default router;
