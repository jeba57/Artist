import { query } from "../../config/db.js";

export const listUsers = async () => {
  const { rows } = await query(
    `SELECT u.id, u.name, u.email, u.role, u.created_at,
            COUNT(o.id) FILTER (WHERE o.payment_status = 'PAID')::int AS order_count
     FROM users u
     LEFT JOIN orders o ON o.user_id = u.id
     GROUP BY u.id
     ORDER BY u.created_at DESC`
  );
  return rows;
};

export const getDashboardStats = async () => {
  const { rows } = await query(`
    SELECT
      (SELECT COUNT(*)::int FROM orders WHERE payment_status = 'PAID') AS total_orders,
      (SELECT COUNT(*)::int FROM orders WHERE payment_status = 'PAID' AND status = 'PENDING') AS pending_orders,
      (SELECT COUNT(*)::int FROM orders WHERE payment_status = 'PAID' AND status = 'CONFIRMED') AS confirmed_orders,
      (SELECT COUNT(*)::int FROM orders WHERE payment_status = 'PAID' AND status = 'SHIPPED') AS shipped_orders,
      (SELECT COUNT(*)::int FROM orders WHERE payment_status = 'PAID' AND status = 'DELIVERED') AS delivered_orders,
      (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE payment_status = 'PAID') AS total_revenue,
      (SELECT COALESCE(SUM(seller_amount), 0) FROM order_items WHERE payout_status = 'PENDING') AS payouts_owed,
      (SELECT COUNT(*)::int FROM products) AS total_products,
      (SELECT COUNT(*)::int FROM users) AS total_users,
      (SELECT COUNT(*)::int FROM artisans) AS total_artisans
  `);
  return rows[0];
};
