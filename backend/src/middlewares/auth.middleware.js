import { verifyAccessToken } from "../utils/jwt.js";
import { ApiError } from "../utils/ApiError.js";

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
