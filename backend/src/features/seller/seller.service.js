import bcrypt from "bcryptjs";
import { ApiError } from "../../utils/ApiError.js";
import { signAccessToken, signRefreshToken } from "../../utils/jwt.js";
import * as sellerRepo from "./seller.repository.js";

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;

const issueSellerTokens = (artisan) => {
  const payload = { id: artisan.id, email: artisan.email, type: "SELLER" };
  return { accessToken: signAccessToken(payload), refreshToken: signRefreshToken(payload) };
};

const validateBusinessDetails = ({ gstin, pan, bankDetails }) => {
  if (gstin && !GSTIN_REGEX.test(gstin)) throw ApiError.badRequest("GSTIN doesn't look valid. Double-check the format.");
  if (pan && !PAN_REGEX.test(pan)) throw ApiError.badRequest("PAN doesn't look valid (expected format: ABCDE1234F).");
  if (!bankDetails?.accountHolderName || !bankDetails?.accountNumber || !bankDetails?.ifsc || !bankDetails?.bankName) {
    throw ApiError.badRequest("Complete bank details (account holder name, account number, IFSC, bank name) are required.");
  }
  if (!IFSC_REGEX.test(bankDetails.ifsc)) throw ApiError.badRequest("IFSC code doesn't look valid.");
};

export const registerSeller = async (input) => {
  const existing = await sellerRepo.findArtisanByEmail(input.email);
  if (existing) throw ApiError.conflict("A seller account with this email already exists.");

  validateBusinessDetails({ gstin: input.gstin, pan: input.pan, bankDetails: input.bankDetails });

  if (!input.govIdUrl) throw ApiError.badRequest("A government ID document is required.");
  if (!input.bankProofUrl) throw ApiError.badRequest("A bank proof document (passbook/cancelled cheque) is required.");
  if (!input.pickupAddress?.line1 || !input.pickupAddress?.city || !input.pickupAddress?.pincode || !input.pickupAddress?.phone) {
    throw ApiError.badRequest("Complete pickup address (line 1, city, pincode, phone) is required.");
  }

  const passwordHash = await bcrypt.hash(input.password, 12);

  const artisan = await sellerRepo.createSellerApplication({
    shopName: input.shopName,
    ownerName: input.ownerName,
    email: input.email,
    passwordHash,
    phone: input.phone,
    bio: input.bio,
    craftSpecialty: input.craftSpecialty,
    location: input.location,
    yearsOfExperience: input.yearsOfExperience,
    gstin: input.gstin,
    pan: input.pan,
    panCardUrl: input.panCardUrl,
    gstCertificateUrl: input.gstCertificateUrl,
    govIdUrl: input.govIdUrl,
    bankProofUrl: input.bankProofUrl,
    bankDetailsJson: input.bankDetails,
    pickupAddress: input.pickupAddress,
    avatarUrl: input.avatarUrl,
  });

  const tokens = issueSellerTokens(artisan);
  return { seller: toSafeSeller(artisan), ...tokens };
};

export const loginSeller = async ({ email, password }) => {
  const artisan = await sellerRepo.findArtisanByEmail(email);
  if (!artisan || !artisan.password_hash) throw ApiError.unauthorized("Invalid email or password.");

  const valid = await bcrypt.compare(password, artisan.password_hash);
  if (!valid) throw ApiError.unauthorized("Invalid email or password.");

  const tokens = issueSellerTokens(artisan);
  return { seller: toSafeSeller(artisan), ...tokens };
};

export const getSellerProfile = async (artisanId) => {
  const artisan = await sellerRepo.findArtisanById(artisanId);
  if (!artisan) throw ApiError.notFound("Seller account not found.");
  return toSafeSeller(artisan);
};

export const resubmitApplication = async (artisanId, updates) => {
  if (updates.gstin || updates.pan || updates.bankDetails) {
    validateBusinessDetails({
      gstin: updates.gstin,
      pan: updates.pan,
      bankDetails: updates.bankDetails || (await sellerRepo.findArtisanById(artisanId))?.bank_details_json,
    });
  }

  const updated = await sellerRepo.updateAndResubmitApplication(artisanId, {
    name: updates.shopName,
    bio: updates.bio,
    avatarUrl: updates.avatarUrl,
    location: updates.location,
    craftSpecialty: updates.craftSpecialty,
    yearsOfExperience: updates.yearsOfExperience,
    ownerName: updates.ownerName,
    phone: updates.phone,
    gstin: updates.gstin,
    pan: updates.pan,
    panCardUrl: updates.panCardUrl,
    gstCertificateUrl: updates.gstCertificateUrl,
    govIdUrl: updates.govIdUrl,
    bankProofUrl: updates.bankProofUrl,
    bankDetailsJson: updates.bankDetails,
    pickupAddress: updates.pickupAddress,
  });

  if (!updated) throw ApiError.badRequest("Your application can't be resubmitted right now (it may already be approved).");
  return toSafeSeller(updated);
};


/** Strips password hash before anything ever reaches the client. */
const toSafeSeller = (artisan) => {
  const { password_hash, ...safe } = artisan;
  return safe;
};
