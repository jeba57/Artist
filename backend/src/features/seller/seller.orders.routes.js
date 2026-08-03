import { Router } from "express";
import { body, param } from "express-validator";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/ApiResponse.js";
import { validate } from "../../middlewares/validate.js";
import { requireSellerAuth, requireVerifiedSeller } from "../../middlewares/auth.middleware.js";
import { ApiError } from "../../utils/ApiError.js";
import { query } from "../../config/db.js";
import * as ordersRepo from "../orders/orders.repository.js";
import { getShippingProvider } from "../../integrations/shipping/index.js";

const router = Router();
router.use(requireSellerAuth, requireVerifiedSeller);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const orders = await ordersRepo.listOrdersForSeller(req.seller.id);
    sendSuccess(res, { data: orders });
  })
);

router.get(
  "/:id",
  validate([param("id").notEmpty()]),
  asyncHandler(async (req, res) => {
    const order = await ordersRepo.getOrderWithItems(req.params.id);
    if (!order) throw ApiError.notFound("Order not found.");

    // A seller can only see orders that include at least one of
    // their own products — not the whole order's buyer-facing detail
    // for products belonging to other sellers in the same order.
    const ownsItem = order.items.some((i) => i.artisan_id === req.seller.id);
    if (!ownsItem) throw ApiError.forbidden("This order doesn't belong to you.");

    const events = await ordersRepo.getShipmentEvents(order.id);
    sendSuccess(res, { data: { ...order, shipmentEvents: events } });
  })
);

// The core "Ready for Pickup" action — steps 2-4 of the fulfilment
// workflow in one call: creates the shipment with the provider, gets
// back an AWB + courier + schedules pickup, and persists all of it
// onto the order. From here on, status updates come from the
// courier (via webhook), not manual clicks.
router.post(
  "/:id/ready-for-pickup",
  validate([
    param("id").notEmpty(),
    body("weightKg").isFloat({ min: 0.01, max: 50 }).withMessage("Parcel weight (kg) is required."),
    body("dimensionsCm.lengthCm").isFloat({ min: 1 }).withMessage("Package length (cm) is required."),
    body("dimensionsCm.widthCm").isFloat({ min: 1 }).withMessage("Package width (cm) is required."),
    body("dimensionsCm.heightCm").isFloat({ min: 1 }).withMessage("Package height (cm) is required."),
  ]),
  asyncHandler(async (req, res) => {
    const order = await ordersRepo.getOrderWithItems(req.params.id);
    if (!order) throw ApiError.notFound("Order not found.");

    const sellerItems = order.items.filter((i) => i.artisan_id === req.seller.id);
    if (!sellerItems.length) throw ApiError.forbidden("This order doesn't belong to you.");

    if (order.payment_status !== "PAID") throw ApiError.badRequest("This order hasn't been paid for yet.");
    if (!["PENDING", "CONFIRMED"].includes(order.status)) {
      throw ApiError.badRequest(`This order is already ${order.status.toLowerCase().replace(/_/g, " ")}.`);
    }

    const artisanRes = await query(`SELECT * FROM artisans WHERE id = $1`, [req.seller.id]);
    const artisan = artisanRes.rows[0];
    if (!artisan) throw ApiError.notFound("Seller account not found.");

    const provider = getShippingProvider();
    const pickupLocationCode = await provider.ensurePickupLocation(artisan);

    // Persist the pickup location code the first time it's created,
    // so future orders skip re-registering it.
    if (!artisan.shipping_pickup_location_code) {
      await query(`UPDATE artisans SET shipping_pickup_location_code = $2 WHERE id = $1`, [artisan.id, pickupLocationCode]);
    }

    const shipmentResult = await provider.createShipmentAndSchedulePickup({
      order,
      items: sellerItems,
      pickupLocationCode,
      weightKg: req.body.weightKg,
      dimensionsCm: req.body.dimensionsCm,
      isCod: order.payment_method === "COD",
      codAmount: order.cod_amount,
    });

    const updated = await ordersRepo.markReadyForPickupWithShipment({
      orderId: order.id,
      artisanId: req.seller.id,
      shipment: {
        provider: provider.name,
        providerOrderId: shipmentResult.providerOrderId,
        providerShipmentId: shipmentResult.providerShipmentId,
        awbCode: shipmentResult.awbCode,
        courierName: shipmentResult.courierName,
        labelUrl: shipmentResult.labelUrl,
        manifestUrl: shipmentResult.manifestUrl,
        pickupScheduledAt: shipmentResult.pickupScheduledAt,
        weightKg: req.body.weightKg,
        dimensionsCm: req.body.dimensionsCm,
      },
    });

    if (!updated) throw ApiError.badRequest("Couldn't mark this order ready for pickup — it may have already moved on.");

    sendSuccess(res, {
      message: `Shipment created — AWB ${shipmentResult.awbCode} via ${shipmentResult.courierName}.`,
      data: updated,
    });
  })
);

export default router;
