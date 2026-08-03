import { query, withTransaction } from "../../config/db.js";
import { generateId } from "../../utils/ids.js";

export const getCartForCheckout = async (userId) => {
  const { rows } = await query(
    `SELECT ci.product_id, ci.quantity, p.name, p.price, p.discount_price, p.stock,
            p.artisan_id, a.name AS artisan_name
     FROM cart_items ci
     JOIN products p ON p.id = ci.product_id
     JOIN artisans a ON a.id = p.artisan_id
     WHERE ci.user_id = $1`,
    [userId]
  );
  return rows;
};

export const createPendingOrder = async ({ userId, totalAmount, shippingAddress, razorpayOrderId, lineItems, paymentMethod = "ONLINE", codAmount = null }) => {
  return withTransaction(async (client) => {
    const orderId = generateId("order_");
    await client.query(
      `INSERT INTO orders (id, user_id, total_amount, shipping_address, razorpay_order_id, payment_status, status, payment_method, cod_amount)
       VALUES ($1, $2, $3, $4, $5, 'PENDING', 'PENDING', $6, $7)`,
      [orderId, userId, totalAmount, JSON.stringify(shippingAddress), razorpayOrderId, paymentMethod, codAmount]
    );

    for (const item of lineItems) {
      await client.query(
        `INSERT INTO order_items (id, order_id, product_id, artisan_id, quantity, price_each, platform_fee, seller_amount)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          generateId("oi_"),
          orderId,
          item.productId,
          item.artisanId,
          item.quantity,
          item.priceEach,
          item.platformFee,
          item.sellerAmount,
        ]
      );
    }

    return orderId;
  });
};

export const markOrderPaid = async ({ orderId, razorpayPaymentId }) => {
  const { rows } = await query(
    `UPDATE orders SET payment_status = 'PAID', razorpay_payment_id = $2, updated_at = now()
     WHERE id = $1 AND payment_status = 'PENDING'
     RETURNING *`,
    [orderId, razorpayPaymentId]
  );
  return rows[0] || null;
};

export const findOrderByRazorpayOrderId = async (razorpayOrderId) => {
  const { rows } = await query(`SELECT * FROM orders WHERE razorpay_order_id = $1`, [razorpayOrderId]);
  return rows[0] || null;
};

export const getOrderWithItems = async (orderId) => {
  const orderRes = await query(
    `SELECT o.*, u.name AS buyer_name, u.email AS buyer_email
     FROM orders o JOIN users u ON u.id = o.user_id
     WHERE o.id = $1`,
    [orderId]
  );
  const order = orderRes.rows[0];
  if (!order) return null;

  const itemsRes = await query(
    `SELECT oi.*, p.name AS product_name, p.images, a.name AS artisan_name
     FROM order_items oi
     JOIN products p ON p.id = oi.product_id
     LEFT JOIN artisans a ON a.id = oi.artisan_id
     WHERE oi.order_id = $1`,
    [orderId]
  );

  return { ...order, items: itemsRes.rows };
};

export const listOrdersForBuyer = async (userId) => {
  const { rows } = await query(
    `SELECT id, status, payment_status, total_amount, created_at, admin_confirmed_at
     FROM orders WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  );
  return rows;
};



export const listOrdersForAdmin = async ({ statusFilter } = {}) => {
  const params = [];
  let where = `WHERE o.payment_status = 'PAID'`;
  if (statusFilter) {
    params.push(statusFilter);
    where += ` AND o.status = $${params.length}`;
  }

  const { rows } = await query(
    `SELECT o.id, o.status, o.payment_status, o.total_amount, o.shipping_address,
            o.created_at, o.admin_confirmed_at,
            u.name AS buyer_name, u.email AS buyer_email,
            string_agg(DISTINCT a.name, ', ') AS artisan_names,
            string_agg(DISTINCT p.name || ' x' || oi.quantity, ', ') AS product_summary,
            SUM(oi.quantity)::int AS total_quantity
     FROM orders o
     JOIN users u ON u.id = o.user_id
     JOIN order_items oi ON oi.order_id = o.id
     JOIN products p ON p.id = oi.product_id
     LEFT JOIN artisans a ON a.id = oi.artisan_id
     ${where}
     GROUP BY o.id, u.name, u.email
     ORDER BY o.created_at DESC`,
    params
  );
  return rows;
};

// The order lifecycle, in the order a real shipment progresses
// through. Used to reject a webhook trying to move a status
// backwards (couriers occasionally resend stale events).
const STATUS_ORDER = [
  "PENDING", "CONFIRMED", "READY_FOR_PICKUP", "PICKED_UP",
  "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED",
];

// Admin's manual-only transition — just PENDING -> CONFIRMED now.
// Everything from READY_FOR_PICKUP onward is either seller-triggered
// (markReadyForPickupWithShipment) or webhook-driven
// (applyShipmentStatusUpdate), since once a real shipment exists the
// dashboard shouldn't be able to manually contradict the courier.
const ADMIN_ALLOWED_TRANSITIONS = {
  CONFIRMED: "PENDING",
};

export const advanceOrderStatus = async ({ orderId, newStatus, adminUserId }) => {
  const fromStatus = ADMIN_ALLOWED_TRANSITIONS[newStatus];
  if (!fromStatus) throw new Error(`"${newStatus}" isn't a valid manual admin transition.`);

  const { rows } = await query(
    `UPDATE orders SET status = $3, updated_at = now()
     WHERE id = $1 AND payment_status = 'PAID' AND status = $2
     RETURNING *`,
    [orderId, fromStatus, newStatus]
  );
  if (!rows[0]) return null;

  await query(
    `INSERT INTO shipment_events (id, order_id, status, description, source)
     VALUES ($1, $2, $3, $4, 'admin')`,
    [generateId("evt_"), orderId, newStatus, `Marked ${newStatus.toLowerCase()} by admin`]
  );

  return rows[0];
};

// Seller marks an order "Ready for Pickup" — this is the action that
// actually creates the real shipment with the provider. Valid from
// PENDING or CONFIRMED (a seller can skip the optional manual
// confirm step and go straight to packing).
export const markReadyForPickupWithShipment = async ({ orderId, artisanId, shipment }) => {
  return withTransaction(async (client) => {
    const { rows } = await client.query(
      `UPDATE orders SET
         status = 'READY_FOR_PICKUP',
         shipping_provider = $2, provider_order_id = $3, provider_shipment_id = $4,
         awb_code = $5, courier_name = $6, label_url = $7, manifest_url = $8,
         pickup_scheduled_at = $9, package_weight_kg = $10, package_dimensions_cm = $11,
         updated_at = now()
       WHERE id = $1 AND status IN ('PENDING', 'CONFIRMED')
       RETURNING *`,
      [
        orderId, shipment.provider, shipment.providerOrderId, shipment.providerShipmentId,
        shipment.awbCode, shipment.courierName, shipment.labelUrl, shipment.manifestUrl,
        shipment.pickupScheduledAt, shipment.weightKg, JSON.stringify(shipment.dimensionsCm),
      ]
    );
    if (!rows[0]) return null;

    const belongs = await client.query(
      `SELECT 1 FROM order_items WHERE order_id = $1 AND artisan_id = $2 LIMIT 1`,
      [orderId, artisanId]
    );
    if (!belongs.rows[0]) throw new Error("This order doesn't belong to you.");

    await client.query(
      `INSERT INTO shipment_events (id, order_id, status, description, source, raw_payload)
       VALUES ($1, $2, 'READY_FOR_PICKUP', $3, 'seller', $4)`,
      [
        generateId("evt_"), orderId,
        `Shipment created — AWB ${shipment.awbCode} via ${shipment.courierName}`,
        JSON.stringify(shipment),
      ]
    );

    return rows[0];
  });
};

/**
 * The webhook-driven (or admin "refresh tracking") status sync.
 * Deliberately more lenient than advanceOrderStatus — couriers don't
 * always report every intermediate stage, so this accepts any
 * forward move in STATUS_ORDER, not just the immediate next one. It
 * silently no-ops on a same-or-backward status (protects against
 * duplicate/out-of-order webhook deliveries).
 *
 * Reaching DELIVERED for the first time is what actually matters
 * financially: it flips every line item's payout to PENDING (same
 * trigger the old admin-confirm flow used), and if this was a COD
 * order, marks it PAID too — the courier collecting cash at the
 * door *is* the payment event for COD.
 */
export const applyShipmentStatusUpdate = async ({ orderId, newStatus, providerStatus, description, rawPayload, source = "webhook" }) => {
  if (!STATUS_ORDER.includes(newStatus)) {
    throw new Error(`"${newStatus}" isn't a recognized shipment status.`);
  }

  return withTransaction(async (client) => {
    const current = await client.query(`SELECT status, payment_method, payment_status FROM orders WHERE id = $1`, [orderId]);
    const order = current.rows[0];
    if (!order) return null;

    const currentIndex = STATUS_ORDER.indexOf(order.status);
    const newIndex = STATUS_ORDER.indexOf(newStatus);
    if (newIndex === -1 || newIndex <= currentIndex) {
      await client.query(
        `INSERT INTO shipment_events (id, order_id, status, provider_status, description, source, raw_payload)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [generateId("evt_"), orderId, order.status, providerStatus, description, source, JSON.stringify(rawPayload)]
      );
      return { ...order, id: orderId, statusChanged: false };
    }

    const isFirstDelivery = newStatus === "DELIVERED" && order.status !== "DELIVERED";
    const markCodPaid = isFirstDelivery && order.payment_method === "COD" && order.payment_status !== "PAID";

    const { rows } = await client.query(
      `UPDATE orders SET
         status = $2,
         last_tracking_sync_at = now(),
         updated_at = now()
         ${isFirstDelivery ? ", admin_confirmed_at = COALESCE(admin_confirmed_at, now())" : ""}
         ${markCodPaid ? ", payment_status = 'PAID'" : ""}
       WHERE id = $1
       RETURNING *`,
      [orderId, newStatus]
    );

    if (isFirstDelivery) {
      await client.query(
        `UPDATE order_items SET payout_status = 'PENDING'
         WHERE order_id = $1 AND payout_status = 'NOT_APPLICABLE'`,
        [orderId]
      );
    }

    await client.query(
      `INSERT INTO shipment_events (id, order_id, status, provider_status, description, source, raw_payload)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [generateId("evt_"), orderId, newStatus, providerStatus, description, source, JSON.stringify(rawPayload)]
    );

    return { ...rows[0], statusChanged: true };
  });
};

export const getShipmentEvents = async (orderId) => {
  const { rows } = await query(
    `SELECT id, status, provider_status, description, occurred_at, source
     FROM shipment_events WHERE order_id = $1 ORDER BY occurred_at ASC`,
    [orderId]
  );
  return rows;
};

export const findOrderByAwb = async (awbCode) => {
  const { rows } = await query(`SELECT * FROM orders WHERE awb_code = $1`, [awbCode]);
  return rows[0] || null;
};

// ------------------------------------------------------------
// RETURNS
// ------------------------------------------------------------

export const requestOrderReturn = async ({ orderId, userId, reason }) => {
  const { rows } = await query(
    `UPDATE orders SET return_status = 'REQUESTED', return_reason = $3, return_requested_at = now(), updated_at = now()
     WHERE id = $1 AND user_id = $2 AND status = 'DELIVERED' AND return_status = 'NONE'
     RETURNING *`,
    [orderId, userId, reason]
  );
  if (!rows[0]) return null;

  await query(
    `INSERT INTO shipment_events (id, order_id, status, description, source)
     VALUES ($1, $2, 'RETURNED', $3, 'system')`,
    [generateId("evt_"), orderId, `Return requested: ${reason}`]
  );

  return rows[0];
};

export const setReturnAwb = async (orderId, returnAwbCode) => {
  await query(`UPDATE orders SET return_awb_code = $2, updated_at = now() WHERE id = $1`, [orderId, returnAwbCode]);
};

export const decideReturn = async ({ orderId, approve, adminUserId }) => {
  const { rows } = await query(
    `UPDATE orders SET return_status = $2, updated_at = now()
     WHERE id = $1 AND return_status = 'REQUESTED'
     RETURNING *`,
    [orderId, approve ? "APPROVED" : "REJECTED"]
  );
  if (!rows[0]) return null;

  await query(
    `INSERT INTO shipment_events (id, order_id, status, description, source)
     VALUES ($1, $2, $3, $4, 'admin')`,
    [generateId("evt_"), orderId, rows[0].status, approve ? "Return approved by admin" : "Return rejected by admin"]
  );

  return rows[0];
};

export const listOrdersForSeller = async (artisanId) => {
  const { rows } = await query(
    `SELECT DISTINCT o.id, o.status, o.payment_status, o.payment_method, o.total_amount,
            o.awb_code, o.courier_name, o.created_at, o.shipping_address,
            u.name AS buyer_name
     FROM orders o
     JOIN order_items oi ON oi.order_id = o.id
     JOIN users u ON u.id = o.user_id
     WHERE oi.artisan_id = $1 AND o.payment_status = 'PAID'
     ORDER BY o.created_at DESC`,
    [artisanId]
  );
  return rows;
};

export const listPendingPayouts = async () => {
  const { rows } = await query(
    `SELECT oi.id AS order_item_id, oi.order_id, oi.quantity, oi.price_each, oi.seller_amount, oi.platform_fee,
            p.name AS product_name, a.id AS artisan_id, a.name AS artisan_name, a.location AS artisan_location,
            o.admin_confirmed_at, o.created_at AS order_created_at
     FROM order_items oi
     JOIN products p ON p.id = oi.product_id
     LEFT JOIN artisans a ON a.id = oi.artisan_id
     JOIN orders o ON o.id = oi.order_id
     WHERE oi.payout_status = 'PENDING'
     ORDER BY o.admin_confirmed_at ASC`
  );
  return rows;
};

export const markPayoutPaid = async (orderItemId) => {
  const { rows } = await query(
    `UPDATE order_items SET payout_status = 'PAID', payout_marked_at = now()
     WHERE id = $1 AND payout_status = 'PENDING'
     RETURNING *`,
    [orderItemId]
  );
  return rows[0] || null;
};
