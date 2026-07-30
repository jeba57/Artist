import { verifyAccessToken } from "../utils/jwt.js";
import { ApiError } from "../utils/ApiError.js";
import { query } from "../config/db.js";

const extractToken = (req) => {
  const header = req.headers.authorization;
  if (header && header.startsWith("Bearer ")) return header.split(" ")[1];
  if (req.cookies?.accessToken) return req.cookies.accessToken;
  return null;
};

export const requireAuth = (req, res, next) => {
  const token = extractToken(req);
  if (!token) return next(ApiError.unauthorized("Login required"));

  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded; // { id, email, role }
    next();
  } catch {
    next(ApiError.unauthorized("Invalid or expired session"));
  }
};

// Attaches req.user if a valid token is present, but never rejects.
// Used on routes like product details where guests can browse but
// logged-in buyers get personalization (wishlist state, etc).
export const optionalAuth = (req, res, next) => {
  const token = extractToken(req);
  if (!token) return next();
  try {
    req.user = verifyAccessToken(token);
  } catch {
    // ignore invalid token for optional routes
  }
  next();
};

export const requireAdmin = (req, res, next) => {
  if (req.user?.role !== "ADMIN") return next(ApiError.forbidden("Admin access required"));
  next();
};




export const requireSellerAuth = (req, res, next) => {
  const token = extractToken(req);
  if (!token) return next(ApiError.unauthorized("Seller login required"));

  try {
    const decoded = verifyAccessToken(token);
    if (decoded.type !== "SELLER") return next(ApiError.unauthorized("Invalid seller session"));
    req.seller = decoded; // { id, email, type: "SELLER" }
    next();
  } catch {
    next(ApiError.unauthorized("Invalid or expired seller session"));
  }
};

// Gates actual seller actions (listing products, viewing orders) to
// APPROVED sellers only. Deliberately re-checks the database rather
// than trusting the JWT's verification status — so an admin approval
// (or rejection) takes effect immediately, without the seller having
// to log out and back in for a fresh token.
export const requireVerifiedSeller = async (req, res, next) => {
  try {
    const { rows } = await query(`SELECT verification_status FROM artisans WHERE id = $1`, [req.seller.id]);
    const artisan = rows[0];
    if (!artisan) return next(ApiError.unauthorized("Seller account not found"));
    if (artisan.verification_status === "APPROVED") return next();
    return next(
      ApiError.forbidden(
        artisan.verification_status === "REJECTED"
          ? "Your seller application was not approved. Check your dashboard for details."
          : "Your seller account is still pending verification."
      )
    );
  } catch (err) {
    next(err);
  }
};


