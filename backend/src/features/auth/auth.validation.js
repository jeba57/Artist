import { body } from "express-validator";

export const registerValidation = [
  body("name").trim().isLength({ min: 2, max: 80 }).withMessage("Name must be 2-80 characters."),
  body("email").isEmail().withMessage("A valid email is required.").normalizeEmail(),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters.")
    .matches(/\d/)
    .withMessage("Password must contain a number."),
];

export const loginValidation = [
  body("email").isEmail().withMessage("A valid email is required.").normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required."),
];

export const googleLoginValidation = [body("idToken").notEmpty().withMessage("Google idToken is required.")];
