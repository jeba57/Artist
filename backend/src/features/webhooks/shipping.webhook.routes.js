import { Router } from "express";
import * as ordersRepo from "../orders/orders.repository.js";

const router = Router();

/**
 * IMPORTANT — read before relying on this in production:
 *
 * Shiprocket lets you set a webhook URL and a custom "Authorization"
 * header value in Settings > API > Webhooks. We verify that header
 * against SHIPROCKET_WEBHOOK_TOKEN below. What we can't fully verify
 * without a live account is the exact JSON field names Shiprocket
 * sends — their docs and real payloads have historically used
 * slightly different shapes depending on account/API version. This
 * handler reads several plausible field names defensively and logs
 * the raw payload either way, so:
 *   1. Register this URL as your webhook in the Shiprocket panel.
 *   2. Trigger a real test event (or wait for a real order).
 *   3. Check the `shipment_events.raw_payload` column (or server
 *      logs) for the exact shape Shiprocket actually sent you.
 *   4. Adjust the field names in normalizeShiprocketPayload() below
 *      if they don't match — that's the only function that should
 *      need changing.
 */

// Shiprocket's status strings -> our OrderStatus enum. Extend this
// map (not the handler logic) if you find additional status strings
// in your real payloads.
const STATUS_MAP = {
  "PICKED UP": "PICKED_UP",
  PICKED_UP: "PICKED_UP",
  "IN TRANSIT": "IN_TRANSIT",
  IN_TRANSIT: "IN_TRANSIT",
  "OUT FOR DELIVERY": "OUT_FOR_DELIVERY",
  OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY",
  DELIVERED: "DELIVERED",
  RTO: "RETURNED",
  "RTO DELIVERED": "RETURNED",
  CANCELLED: "CANCELLED",
  CANCELED: "CANCELLED",
};

const normalizeShiprocketPayload = (body) => {
  const awbCode = body.awb || body.awb_code || body.current_status?.awb;
  const rawStatus = (body.current_status || body.status || body.shipment_status || "").toString().toUpperCase().trim();
  const normalizedStatus = STATUS_MAP[rawStatus] || null;
  const description = body.status_detail || body.remarks || body.current_status_id || rawStatus;

  return { awbCode, rawStatus, normalizedStatus, description };
};

router.post("/shiprocket", async (req, res) => {
  // Verify the shared secret configured in the Shiprocket panel's
  // webhook settings. Fails closed if the token isn't set up yet, so
  // this endpoint can't silently accept forged status updates.
  const expectedToken = process.env.SHIPROCKET_WEBHOOK_TOKEN;
  const providedToken = req.headers["x-webhook-token"] || req.headers["authorization"];
  if (!expectedToken || providedToken !== expectedToken) {
    return res.status(401).json({ success: false, message: "Invalid webhook token." });
  }

  const { awbCode, rawStatus, normalizedStatus, description } = normalizeShiprocketPayload(req.body);

  if (!awbCode) {
    return res.status(400).json({ success: false, message: "Payload missing an AWB code — can't match it to an order." });
  }

  const order = await ordersRepo.findOrderByAwb(awbCode);
  if (!order) {
    // Not an error from Shiprocket's point of view — just means this
    // AWB doesn't belong to us (or the order lookup raced ahead of
    // the webhook). Acknowledge with 200 so Shiprocket doesn't retry
    // forever.
    return res.status(200).json({ success: true, message: "No matching order — acknowledged." });
  }

  if (!normalizedStatus) {
    // Unrecognized status string — log it for STATUS_MAP tuning, but
    // don't error the webhook (Shiprocket will just retry, and this
    // isn't actually a failure on our end).
    console.warn(`[shipping webhook] Unrecognized status "${rawStatus}" for order ${order.id} (AWB ${awbCode}).`, req.body);
    return res.status(200).json({ success: true, message: "Status not recognized — logged, no update applied." });
  }

  const result = await ordersRepo.applyShipmentStatusUpdate({
    orderId: order.id,
    newStatus: normalizedStatus,
    providerStatus: rawStatus,
    description,
    rawPayload: req.body,
    source: "webhook",
  });

  res.status(200).json({ success: true, statusChanged: result?.statusChanged ?? false });
});

export default router;
