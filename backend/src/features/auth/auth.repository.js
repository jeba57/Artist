import { query } from "../../config/db.js";
import { generateId } from "../../utils/ids.js";

export const findUserByEmail = async (email) => {
  const { rows } = await query(`SELECT * FROM users WHERE email = $1`, [email]);
  return rows[0] || null;
};

export const findUserById = async (id) => {
  const { rows } = await query(
    `SELECT id, name, email, avatar_url, role, created_at FROM users WHERE id = $1`,
    [id]
  );
  return rows[0] || null;
};

export const createUser = async ({ name, email, passwordHash = null, googleId = null, avatarUrl = null }) => {
  const id = generateId("usr_");
  const { rows } = await query(
    `INSERT INTO users (id, name, email, password_hash, google_id, avatar_url)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, name, email, avatar_url, role, created_at`,
    [id, name, email, passwordHash, googleId, avatarUrl]
  );
  return rows[0];
};

export const findOrCreateGoogleUser = async ({ googleId, email, name, avatarUrl }) => {
  const { rows } = await query(`SELECT * FROM users WHERE google_id = $1 OR email = $2`, [googleId, email]);
  if (rows[0]) {
    if (!rows[0].google_id) {
      await query(`UPDATE users SET google_id = $1 WHERE id = $2`, [googleId, rows[0].id]);
    }
    return rows[0];
  }
  return createUser({ name, email, googleId, avatarUrl });
};
