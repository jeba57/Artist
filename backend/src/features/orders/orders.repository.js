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

export const createPendingOrder = async ({ userId, totalAmount, shippingAddress, razorpayOrderId, lineItems }) => {
  return withTransaction(async (client) => {
    const orderId = generateId("order_");
    await client.query(
      `INSERT INTO orders (id, user_id, total_amount, shipping_address, razorpay_order_id, payment_status, status)
       VALUES ($1, $2, $3, $4, $5, 'PENDING', 'PENDING')`,
      [orderId, userId, totalAmount, JSON.stringify(shippingAddress), razorpayOrderId]
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

// The 3-stage workflow an admin walks each paid order through.
// Each stage only accepts the one valid predecessor status, so a
// stale/double-clicked button can't skip or rewind a stage.
const ALLOWED_TRANSITIONS = {
  CONFIRMED: "PENDING",
  SHIPPED: "CONFIRMED",
  DELIVERED: "SHIPPED",
};












export const advanceOrderStatus = async ({ orderId, newStatus, adminUserId }) => {
  const fromStatus = ALLOWED_TRANSITIONS[newStatus];
  if (!fromStatus) throw new Error(`Unsupported order status transition to "${newStatus}".`);

  return withTransaction(async (client) => {
    const isDelivering = newStatus === "DELIVERED";

    const { rows } = await client.query(
      `UPDATE orders
       SET status = $3,
           updated_at = now()
           ${isDelivering ? ", admin_confirmed_at = now(), admin_confirmed_by = $4" : ""}
       WHERE id = $1 AND payment_status = 'PAID' AND status = $2
       RETURNING *`,
      isDelivering ? [orderId, fromStatus, newStatus, adminUserId] : [orderId, fromStatus, newStatus]
    );
    if (!rows[0]) return null;

    // Delivery is the moment a maker's payout becomes collectible —
    // matches the existing payout-tracking behaviour exactly.
    if (isDelivering) {
      await client.query(
        `UPDATE order_items SET payout_status = 'PENDING'
         WHERE order_id = $1 AND payout_status = 'NOT_APPLICABLE'`,
        [orderId]
      );
    }

    return rows[0];
  });
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
