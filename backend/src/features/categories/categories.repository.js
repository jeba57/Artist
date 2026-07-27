import { query } from "../../config/db.js";

export const listCategories = async () => {
  const { rows } = await query(
    `SELECT id, name, slug, description, image_url, display_order
     FROM categories ORDER BY display_order ASC, name ASC`
  );
  return rows;
};

export const findCategoryBySlug = async (slug) => {
  const { rows } = await query(`SELECT * FROM categories WHERE slug = $1`, [slug]);
  return rows[0] || null;
};
