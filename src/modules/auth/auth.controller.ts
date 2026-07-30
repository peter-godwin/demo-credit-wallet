import { Request, Response } from "express";
import authService from "./auth.service";
import userService from "../user/user.service";
import { HttpStatus, sendError, sendSuccess, sendValidationError } from "../../common/utils/response.util";
import { validateCreateUser } from "../../common/utils/validation.util";

export class AuthController {
    async register(req: Request, res: Response): Promise<void> {
        const errors = validateCreateUser(req.body);
        if (!req.body.password || typeof req.body.password !== "string" || req.body.password.length < 6) {
            errors.push({ field: "password", message: "Password must be at least 6 characters" });
        }

        if (errors.length > 0) {
            sendValidationError(res, errors);
            return;
        }

        try {
            const result = await authService.register({
                first_name: req.body.first_name,
                last_name: req.body.last_name,
                email: req.body.email,
                phone: req.body.phone,
                password: req.body.password,
                bvn: req.body.bvn,
            });
            sendSuccess(res, result.message, { user: result.user, wallet: result.wallet }, HttpStatus.CREATED);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Registration failed";

            if (message.includes("Karma blacklist")) {
                sendError(res, message, HttpStatus.FORBIDDEN);
                return;
            }
            if (message.includes("already exists")) {
                sendError(res, message, HttpStatus.CONFLICT);
                return;
            }

            sendError(res, message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async login(req: Request, res: Response): Promise<void> {
        const { email, password } = req.body;

        if (!email || !password) {
            sendError(res, "Email and password are required", HttpStatus.UNPROCESSABLE);
            return;
        }

        try {
            const result = await authService.login({ email, password });
            sendSuccess(res, "Login successful", result);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Login failed";

            if (message.includes("Invalid email") || message.includes("not verified")) {
                sendError(res, message, HttpStatus.UNAUTHORIZED);
                return;
            }

            sendError(res, message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async verifyEmail(req: Request, res: Response): Promise<void> {
        const { email, code } = req.body;

        if (!email || !code) {
            sendError(res, "Email and code are required", HttpStatus.UNPROCESSABLE);
            return;
        }

        try {
            await authService.verifyEmail({ email, code });
            sendSuccess(res, "Email verified successfully");
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Email verification failed";
            sendError(res, message, HttpStatus.BAD_REQUEST);
        }
    }

    async resendVerification(req: Request, res: Response): Promise<void> {
        const { email } = req.body;

        if (!email) {
            sendError(res, "Email is required", HttpStatus.UNPROCESSABLE);
            return;
        }

        try {
            await authService.resendVerificationCode(email);
            sendSuccess(res, "Verification code sent to your email");
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Could not resend verification code";
            sendError(res, message, HttpStatus.BAD_REQUEST);
        }
    }

    async setPin(req: Request, res: Response): Promise<void> {
        const { pin } = req.body;

        if (!pin || !/^\d{4}$/.test(pin)) {
            sendError(res, "PIN must be a 4-digit number", HttpStatus.UNPROCESSABLE);
            return;
        }

        try {
            await authService.setTransactionPin(req.userId!, pin);
            sendSuccess(res, "Transaction PIN set successfully");
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Could not set transaction PIN";
            sendError(res, message, HttpStatus.BAD_REQUEST);
        }
    }

    async getProfile(req: Request, res: Response): Promise<void> {
        try {
            const result = await userService.getUserById(req.userId!);
            if (!result) {
                sendError(res, "User profile not found", HttpStatus.NOT_FOUND);
                return;
            }
            sendSuccess(res, "Profile retrieved successfully", result);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Could not retrieve profile";
            sendError(res, message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async refreshToken(req: Request, res: Response): Promise<void> {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            sendError(res, "Refresh token is required", HttpStatus.UNPROCESSABLE);
            return;
        }

        try {
            const tokens = await authService.refreshToken(refreshToken);
            sendSuccess(res, "Token refreshed successfully", tokens);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Token refresh failed";
            sendError(res, message, HttpStatus.UNAUTHORIZED);
        }
    }

    async forgotPassword(req: Request, res: Response): Promise<void> {
        const { email } = req.body;

        if (!email) {
            sendError(res, "Email is required", HttpStatus.UNPROCESSABLE);
            return;
        }

        try {
            await authService.forgotPassword(email);
            // Always return success to prevent email enumeration
            sendSuccess(res, "If an account exists with this email, a password reset code has been sent");
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Could not process password reset request";
            sendError(res, message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async resetPassword(req: Request, res: Response): Promise<void> {
        const { email, code, newPassword } = req.body;

        if (!email || !code || !newPassword) {
            sendError(res, "Email, code, and new password are required", HttpStatus.UNPROCESSABLE);
            return;
        }

        try {
            await authService.resetPassword({ email, code, newPassword });
            sendSuccess(res, "Password reset successfully");
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Password reset failed";
            sendError(res, message, HttpStatus.BAD_REQUEST);
        }
    }

    async changePassword(req: Request, res: Response): Promise<void> {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            sendError(res, "Current password and new password are required", HttpStatus.UNPROCESSABLE);
            return;
        }

        try {
            await authService.changePassword(req.userId!, { currentPassword, newPassword });
            sendSuccess(res, "Password changed successfully");
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Password change failed";
            if (message.includes("incorrect")) {
                sendError(res, message, HttpStatus.UNAUTHORIZED);
                return;
            }
            sendError(res, message, HttpStatus.BAD_REQUEST);
        }
    }
}

export const authController = new AuthController();
export default authController;
