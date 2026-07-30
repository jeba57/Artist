import { body } from "express-validator";

export const sellerRegisterValidation = [
  body("shopName").trim().isLength({ min: 2, max: 100 }).withMessage("Shop name is required (2-100 characters)."),
  body("ownerName").trim().isLength({ min: 2, max: 100 }).withMessage("Owner's full name is required."),
  body("email").isEmail().withMessage("A valid email is required.").normalizeEmail(),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters.")
    .matches(/\d/)
    .withMessage("Password must contain a number."),
  body("phone")
    .trim()
    .matches(/^[6-9]\d{9}$/)
    .withMessage("Enter a valid 10-digit Indian mobile number."),
  body("bio").trim().isLength({ min: 20, max: 2000 }).withMessage("Tell buyers about your craft (at least 20 characters)."),
  body("craftSpecialty").trim().notEmpty().withMessage("Craft specialty is required."),
  body("location").trim().notEmpty().withMessage("Location is required."),
  body("yearsOfExperience").optional().isInt({ min: 0, max: 80 }).toInt(),
  body("gstin").optional({ checkFalsy: true }).trim(),
  body("pan").optional({ checkFalsy: true }).trim(),
];

export const sellerLoginValidation = [
  body("email").isEmail().withMessage("A valid email is required.").normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required."),
];
