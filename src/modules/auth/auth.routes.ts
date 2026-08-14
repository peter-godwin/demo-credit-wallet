import { Router } from "express";
import authController from "./auth.controller";
import { authenticate } from "../../common/middlewares/auth.middleware";

const router = Router();

// Public routes (no authentication required)
router.post("/register", authController.register.bind(authController));
router.post("/login", authController.login.bind(authController));
router.post("/verify-email", authController.verifyEmail.bind(authController));
router.post("/resend-verification", authController.resendVerification.bind(authController));
router.post("/forgot-password", authController.forgotPassword.bind(authController));
router.post("/reset-password", authController.resetPassword.bind(authController));

// Protected routes (authentication required)
router.use(authenticate);
router.post("/set-pin", authController.setPin.bind(authController));
router.get("/me", authController.getProfile.bind(authController));
router.post("/refresh-token", authController.refreshToken.bind(authController));
router.post("/change-password", authController.changePassword.bind(authController));

export default router;
