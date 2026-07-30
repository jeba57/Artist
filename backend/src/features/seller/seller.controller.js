import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import * as sellerService from "./seller.service.js";

const REFRESH_COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/api/seller/auth",
};

const setSellerCookies = (res, { accessToken, refreshToken }) => {
  res.cookie("sellerAccessToken", accessToken, { ...REFRESH_COOKIE_OPTS, maxAge: 15 * 60 * 1000, path: "/" });
  res.cookie("sellerRefreshToken", refreshToken, REFRESH_COOKIE_OPTS);
};

/** multer-storage-cloudinary sets `.path` to the uploaded file's secure Cloudinary URL. */
const fileUrl = (files, field) => files?.[field]?.[0]?.path || null;

const parseJsonField = (raw, fieldName) => {
  if (!raw) return null;
  if (typeof raw === "object") return raw; // already parsed (e.g. JSON request instead of multipart)
  try {
    return JSON.parse(raw);
  } catch {
    throw ApiError.badRequest(`"${fieldName}" must be valid JSON.`);
  }
};

export const register = asyncHandler(async (req, res) => {
  const files = req.files || {};
  const bankDetails = parseJsonField(req.body.bankDetails, "bankDetails");
  const pickupAddress = parseJsonField(req.body.pickupAddress, "pickupAddress");

  const result = await sellerService.registerSeller({
    shopName: req.body.shopName,
    ownerName: req.body.ownerName,
    email: req.body.email,
    password: req.body.password,
    phone: req.body.phone,
    bio: req.body.bio,
    craftSpecialty: req.body.craftSpecialty,
    location: req.body.location,
    yearsOfExperience: req.body.yearsOfExperience,
    gstin: req.body.gstin || null,
    pan: req.body.pan || null,
    bankDetails,
    pickupAddress,
    avatarUrl: fileUrl(files, "logo"),
    govIdUrl: fileUrl(files, "govId"),
    panCardUrl: fileUrl(files, "panCard"),
    gstCertificateUrl: fileUrl(files, "gstCertificate"),
    bankProofUrl: fileUrl(files, "bankProof"),
  });

  setSellerCookies(res, result);
  sendSuccess(res, {
    statusCode: 201,
    message: "Application submitted! We'll review your documents and get back to you.",
    data: { seller: result.seller, accessToken: result.accessToken },
  });
});

export const login = asyncHandler(async (req, res) => {
  const result = await sellerService.loginSeller(req.body);
  setSellerCookies(res, result);
  sendSuccess(res, { message: "Logged in.", data: { seller: result.seller, accessToken: result.accessToken } });
});

export const me = asyncHandler(async (req, res) => {
  const seller = await sellerService.getSellerProfile(req.seller.id);
  sendSuccess(res, { data: seller });
});

export const resubmit = asyncHandler(async (req, res) => {
  const files = req.files || {};
  const bankDetails = parseJsonField(req.body.bankDetails, "bankDetails");
  const pickupAddress = parseJsonField(req.body.pickupAddress, "pickupAddress");

  const seller = await sellerService.resubmitApplication(req.seller.id, {
    shopName: req.body.shopName,
    ownerName: req.body.ownerName,
    phone: req.body.phone,
    bio: req.body.bio,
    craftSpecialty: req.body.craftSpecialty,
    location: req.body.location,
    yearsOfExperience: req.body.yearsOfExperience,
    gstin: req.body.gstin || undefined,
    pan: req.body.pan || undefined,
    bankDetails: bankDetails || undefined,
    pickupAddress: pickupAddress || undefined,
    avatarUrl: fileUrl(files, "logo") || undefined,
    govIdUrl: fileUrl(files, "govId") || undefined,
    panCardUrl: fileUrl(files, "panCard") || undefined,
    gstCertificateUrl: fileUrl(files, "gstCertificate") || undefined,
    bankProofUrl: fileUrl(files, "bankProof") || undefined,
  });

  sendSuccess(res, { message: "Application resubmitted for review.", data: seller });
});

export const logout = asyncHandler(async (req, res) => {
  res.clearCookie("sellerAccessToken", { path: "/" });
  res.clearCookie("sellerRefreshToken", { path: "/api/seller/auth" });
  sendSuccess(res, { message: "Logged out." });
});
