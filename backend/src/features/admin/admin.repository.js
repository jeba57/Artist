import { query, withTransaction } from "../../config/db.js";

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




const SELLER_APPLICATION_FIELDS = `
  id, name, slug, bio, avatar_url, location, craft_specialty, years_of_experience,
  email, owner_name, phone, gstin, pan, pan_card_url, gst_certificate_url,
  gov_id_url, bank_proof_url, bank_details_json, pickup_address,
  verification_status, verification_submitted_at, verified_at, verified_by,
  rejection_reason, created_at
`;

export const listSellerApplications = async ({ statusFilter } = {}) => {
  const params = [];
  let where = "";
  if (statusFilter) {
    params.push(statusFilter);
    where = `WHERE verification_status = $1`;
  }
  const { rows } = await query(
    `SELECT ${SELLER_APPLICATION_FIELDS} FROM artisans
     ${where}
     ORDER BY
       CASE verification_status WHEN 'PENDING' THEN 0 ELSE 1 END,
       verification_submitted_at DESC NULLS LAST, created_at DESC`,
    params
  );
  return rows;
};

export const getSellerApplication = async (artisanId) => {
  const { rows } = await query(`SELECT ${SELLER_APPLICATION_FIELDS} FROM artisans WHERE id = $1`, [artisanId]);
  return rows[0] || null;
};

export const approveSellerApplication = async (artisanId, adminUserId) => {
  return withTransaction(async (client) => {
    const { rows } = await client.query(
      `UPDATE artisans
       SET verification_status = 'APPROVED', verified = true,
           verified_at = now(), verified_by = $2, rejection_reason = NULL, updated_at = now()
       WHERE id = $1 AND verification_status != 'APPROVED'
       RETURNING ${SELLER_APPLICATION_FIELDS}`,
      [artisanId, adminUserId]
    );
    return rows[0] || null;
  });
};

export const rejectSellerApplication = async (artisanId, adminUserId, reason) => {
  const { rows } = await query(
    `UPDATE artisans
     SET verification_status = 'REJECTED', verified = false,
         verified_at = now(), verified_by = $2, rejection_reason = $3, updated_at = now()
     WHERE id = $1 AND verification_status != 'APPROVED'
     RETURNING ${SELLER_APPLICATION_FIELDS}`,
    [artisanId, adminUserId, reason]
  );
  return rows[0] || null;
};
