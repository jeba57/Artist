import { Router } from "express";
import * as authController from "./auth.controller.js";
import { registerValidation, loginValidation, googleLoginValidation } from "./auth.validation.js";
import { validate } from "../../middlewares/validate.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { rateLimit } from "../../middlewares/rateLimiter.js";

const router = Router();

const authRateLimit = rateLimit({ windowSeconds: 60 * 15, max: 10, routeKey: "auth" });

router.post("/register", authRateLimit, validate(registerValidation), authController.register);
router.post("/login", authRateLimit, validate(loginValidation), authController.login);
router.post("/google", authRateLimit, validate(googleLoginValidation), authController.googleLogin);
router.post("/refresh", authController.refresh);
router.post("/logout", requireAuth, authController.logout);
router.get("/me", requireAuth, authController.me);

export default router;
