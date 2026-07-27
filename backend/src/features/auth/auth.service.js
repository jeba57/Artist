import bcrypt from "bcryptjs";
import { OAuth2Client } from "./googleClient.js";
import { ApiError } from "../../utils/ApiError.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../utils/jwt.js";
import { redis } from "../../config/redis.js";
import * as authRepo from "./auth.repository.js";

const REFRESH_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

const issueTokens = async (user) => {
  const payload = { id: user.id, email: user.email, role: user.role };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  // Redis-backed refresh token allow-list ("sessions" cache namespace).
  // Lets us revoke a single session (logout) without invalidating a
  // signing secret for everyone.
  await redis.set(`session:${user.id}:${refreshToken.slice(-16)}`, "1", "EX", REFRESH_TOKEN_TTL_SECONDS);

  return { accessToken, refreshToken };
};

export const registerBuyer = async ({ name, email, password }) => {
  const existing = await authRepo.findUserByEmail(email);
  if (existing) throw ApiError.conflict("An account with this email already exists.");

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await authRepo.createUser({ name, email, passwordHash });
  const tokens = await issueTokens(user);
  return { user, ...tokens };
};

export const loginBuyer = async ({ email, password }) => {
  const user = await authRepo.findUserByEmail(email);
  if (!user || !user.password_hash) throw ApiError.unauthorized("Invalid email or password.");

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw ApiError.unauthorized("Invalid email or password.");

  const tokens = await issueTokens(user);
  const { password_hash, ...safeUser } = user;
  return { user: safeUser, ...tokens };
};

export const loginWithGoogle = async (idToken) => {
  const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  const ticket = await client.verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT_ID });
  const payload = ticket.getPayload();

  const user = await authRepo.findOrCreateGoogleUser({
    googleId: payload.sub,
    email: payload.email,
    name: payload.name,
    avatarUrl: payload.picture,
  });

  const tokens = await issueTokens(user);
  return { user, ...tokens };
};

export const refreshSession = async (refreshToken) => {
  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    throw ApiError.unauthorized("Session expired. Please log in again.");
  }

  const sessionExists = await redis.get(`session:${decoded.id}:${refreshToken.slice(-16)}`);
  if (!sessionExists) throw ApiError.unauthorized("Session revoked. Please log in again.");

  const user = await authRepo.findUserById(decoded.id);
  if (!user) throw ApiError.unauthorized("Account no longer exists.");

  return issueTokens(user);
};

export const logout = async (userId, refreshToken) => {
  if (refreshToken) {
    await redis.del(`session:${userId}:${refreshToken.slice(-16)}`);
  }
};
