import { query } from "../../config/db.js";

const PRODUCT_CARD_FIELDS = `
  p.id, p.name, p.slug, p.short_description, p.images, p.price, p.discount_price,
  p.currency, p.stock, p.location, p.rating_avg, p.rating_count,
  p.is_featured, p.is_editors_pick, p.is_trending, p.created_at,
  c.id AS category_id, c.name AS category_name, c.slug AS category_slug,
  a.id AS artisan_id, a.name AS artisan_name, a.slug AS artisan_slug, a.verified AS artisan_verified
`;

const BASE_JOIN = `
  FROM products p
  JOIN categories c ON c.id = p.category_id
  JOIN artisans a ON a.id = p.artisan_id
`;

/**
 * Flexible product listing: search, category, price range,
 * sort, and cursor-free page/limit pagination. Built to match
 * the filters a "Discover" page realistically needs.
 */
export const listProducts = async ({
  search,
  categorySlug,
  minPrice,
  maxPrice,
  sort = "newest",
  page = 1,
  limit = 12,
}) => {
  const conditions = [];
  const params = [];

  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(p.name ILIKE $${params.length} OR p.short_description ILIKE $${params.length})`);
  }
  if (categorySlug) {
    params.push(categorySlug);
    conditions.push(`c.slug = $${params.length}`);
  }
  if (minPrice != null) {
    params.push(minPrice);
    conditions.push(`p.price >= $${params.length}`);
  }
  if (maxPrice != null) {
    params.push(maxPrice);
    conditions.push(`p.price <= $${params.length}`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const sortMap = {
    newest: "p.created_at DESC",
    price_low: "p.price ASC",
    price_high: "p.price DESC",
    rating: "p.rating_avg DESC, p.rating_count DESC",
    popular: "p.rating_count DESC",
  };
  const orderBy = sortMap[sort] || sortMap.newest;

  const offset = (page - 1) * limit;
  params.push(limit, offset);

  const listSql = `
    SELECT ${PRODUCT_CARD_FIELDS}
    ${BASE_JOIN}
    ${whereClause}
    ORDER BY ${orderBy}
    LIMIT $${params.length - 1} OFFSET $${params.length}
  `;
  const countSql = `SELECT COUNT(*)::int AS total ${BASE_JOIN} ${whereClause}`;

  const [{ rows: items }, { rows: countRows }] = await Promise.all([
    query(listSql, params),
    query(countSql, params.slice(0, params.length - 2)),
  ]);

  return { items, total: countRows[0].total };
};

export const findProductBySlug = async (slug) => {
  const { rows } = await query(
    `SELECT
       p.*, 
       c.id AS category_id, c.name AS category_name, c.slug AS category_slug,
       a.id AS artisan_id, a.name AS artisan_name, a.slug AS artisan_slug,
       a.bio AS artisan_bio, a.story AS artisan_story, a.avatar_url AS artisan_avatar_url,
       a.location AS artisan_location, a.craft_specialty AS artisan_craft_specialty,
       a.verified AS artisan_verified, a.rating_avg AS artisan_rating_avg
     FROM products p
     JOIN categories c ON c.id = p.category_id
     JOIN artisans a ON a.id = p.artisan_id
     WHERE p.slug = $1`,
    [slug]
  );
  return rows[0] || null;
};

export const findProductById = async (id) => {
  const { rows } = await query(`SELECT * FROM products WHERE id = $1`, [id]);
  return rows[0] || null;
};

export const listSimilarProducts = async ({ categoryId, excludeProductId, limit = 4 }) => {
  const { rows } = await query(
    `SELECT ${PRODUCT_CARD_FIELDS}
     ${BASE_JOIN}
     WHERE p.category_id = $1 AND p.id != $2
     ORDER BY p.rating_avg DESC
     LIMIT $3`,
    [categoryId, excludeProductId, limit]
  );
  return rows;
};

export const listByFlag = async (flagColumn, limit = 8) => {
  const allowed = new Set(["is_featured", "is_editors_pick", "is_trending"]);
  if (!allowed.has(flagColumn)) throw new Error(`Invalid flag column: ${flagColumn}`);

  const { rows } = await query(
    `SELECT ${PRODUCT_CARD_FIELDS}
     ${BASE_JOIN}
     WHERE p.${flagColumn} = true
     ORDER BY p.created_at DESC
     LIMIT $1`,
    [limit]
  );
  return rows;
};

export const listByIds = async (ids) => {
  if (!ids.length) return [];
  const { rows } = await query(
    `SELECT ${PRODUCT_CARD_FIELDS} ${BASE_JOIN} WHERE p.id = ANY($1::text[])`,
    [ids]
  );
  return rows;
};

export const recalculateProductRating = async (productId, client = { query: query }) => {
  await client.query(
    `UPDATE products SET
       rating_avg = COALESCE((SELECT AVG(rating)::float FROM reviews WHERE product_id = $1), 0),
       rating_count = (SELECT COUNT(*)::int FROM reviews WHERE product_id = $1)
     WHERE id = $1`,
    [productId]
  );
};


export const createProductForArtisan = async ({
  artisanId, categoryId, name, slug, shortDescription, story, craftProcess,
  materials, images, price, discountPrice, stock, location,
}) => {
  const id = generateId("prod_");
  const { rows } = await query(
    `INSERT INTO products (
       id, name, slug, short_description, story, craft_process, materials, images,
       price, discount_price, stock, location, category_id, artisan_id
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
     RETURNING *`,
    [id, name, slug, shortDescription, story, craftProcess, materials, images,
     price, discountPrice || null, stock, location, categoryId, artisanId]
  );
  return rows[0];
};

export const listProductsForArtisan = async (artisanId) => {
  const { rows } = await query(
    `SELECT p.*, c.name AS category_name
     FROM products p JOIN categories c ON c.id = p.category_id
     WHERE p.artisan_id = $1
     ORDER BY p.created_at DESC`,
    [artisanId]
  );
  return rows;
};

