import { query } from "../../config/db.js";
import { generateId } from "../../utils/ids.js";

export const getCartItems = async (userId) => {
  const { rows } = await query(
    `SELECT ci.id, ci.quantity, ci.created_at,
            p.id AS product_id, p.name, p.slug, p.images, p.price, p.discount_price,
            p.currency, p.stock,
            a.name AS artisan_name
     FROM cart_items ci
     JOIN products p ON p.id = ci.product_id
     JOIN artisans a ON a.id = p.artisan_id
     WHERE ci.user_id = $1
     ORDER BY ci.created_at DESC`,
    [userId]
  );
  return rows;
};

export const upsertCartItem = async (userId, productId, quantity) => {
  const id = generateId("cart_");
  const { rows } = await query(
    `INSERT INTO cart_items (id, user_id, product_id, quantity)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id, product_id)
     DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity, updated_at = now()
     RETURNING *`,
    [id, userId, productId, quantity]
  );
  return rows[0];
};

export const setCartItemQuantity = async (userId, productId, quantity) => {
  const { rows } = await query(
    `UPDATE cart_items SET quantity = $3, updated_at = now()
     WHERE user_id = $1 AND product_id = $2
     RETURNING *`,
    [userId, productId, quantity]
  );
  return rows[0] || null;
};

export const removeCartItem = async (userId, productId) => {
  await query(`DELETE FROM cart_items WHERE user_id = $1 AND product_id = $2`, [userId, productId]);
};

export const clearCart = async (userId) => {
  await query(`DELETE FROM cart_items WHERE user_id = $1`, [userId]);
};
