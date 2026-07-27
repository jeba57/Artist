import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/ApiResponse.js";
import * as authService from "./auth.service.js";
import { ApiError } from "../../utils/ApiError.js";

const REFRESH_COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/api/auth",
};

const setAuthCookies = (res, { accessToken, refreshToken }) => {
  res.cookie("accessToken", accessToken, { ...REFRESH_COOKIE_OPTS, maxAge: 15 * 60 * 1000, path: "/" });
  res.cookie("refreshToken", refreshToken, REFRESH_COOKIE_OPTS);
};

export const register = asyncHandler(async (req, res) => {
  const result = await authService.registerBuyer(req.body);
  setAuthCookies(res, result);
  sendSuccess(res, {
    statusCode: 201,
    message: "Account created.",
    data: { user: result.user, accessToken: result.accessToken },
  });
});

export const login = asyncHandler(async (req, res) => {
  const result = await authService.loginBuyer(req.body);
  setAuthCookies(res, result);
  sendSuccess(res, { message: "Logged in.", data: { user: result.user, accessToken: result.accessToken } });
});

export const googleLogin = asyncHandler(async (req, res) => {
  const result = await authService.loginWithGoogle(req.body.idToken);
  setAuthCookies(res, result);
  sendSuccess(res, { message: "Logged in with Google.", data: { user: result.user, accessToken: result.accessToken } });
});

export const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken || req.body.refreshToken;
  if (!token) throw ApiError.unauthorized("No refresh token provided.");

  const tokens = await authService.refreshSession(token);
  setAuthCookies(res, tokens);
  sendSuccess(res, { message: "Session refreshed.", data: { accessToken: tokens.accessToken } });
});

export const logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken || req.body.refreshToken;
  if (req.user?.id) await authService.logout(req.user.id, token);
  res.clearCookie("accessToken", { path: "/" });
  res.clearCookie("refreshToken", { path: "/api/auth" });
  sendSuccess(res, { message: "Logged out." });
});

export const me = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: { user: req.user } });
});
