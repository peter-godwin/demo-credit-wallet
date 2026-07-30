import { v4 as uuidv4 } from "uuid";
import db from "../../config/db";
import { User } from "../user/user.model";
import { Wallet } from "../wallet/wallet.model";
import { checkKarmaBlacklist } from "../karma/karma.service";
import { emailService } from "../email/email.service";
import { generateAccountNumber } from "../../utils/account.util";
import { comparePassword, generateJWT, generateOTPCode, hashPassword, hashPin, verifyRefreshToken } from "../../common/utils/security.util";
import { AuthTokens, ChangePasswordDTO, ForgotPasswordDTO, LoginAuthDTO, RegisterAuthDTO, ResetPasswordDTO, VerifyEmailDTO } from "./auth.types";

export class AuthService {
    async register(dto: RegisterAuthDTO): Promise<{ user: User; wallet: Wallet; message: string }> {
        const [emailCheck, phoneCheck] = await Promise.all([
            checkKarmaBlacklist(dto.email),
            checkKarmaBlacklist(dto.phone),
        ]);

        if (emailCheck.isBlacklisted || phoneCheck.isBlacklisted) {
            throw new Error("User onboarding denied identity found on the Karma blacklist");
        }

        const existingUser = await db("users")
            .where({ email: dto.email.toLowerCase().trim() })
            .orWhere({ phone: dto.phone.trim() })
            .first();

        if (existingUser) {
            const conflict = existingUser.email === dto.email.toLowerCase().trim() ? "email" : "phone number";
            throw new Error(`A user with this ${conflict} already exists`);
        }

        const passwordHash = await hashPassword(dto.password);

        const { user, wallet, otpCode } = await db.transaction(async (trx) => {
            const userId = uuidv4();
            const walletId = uuidv4();
            const accountNumber = await generateAccountNumber();

            const [createdUser] = await trx("users")
                .insert({
                    id: userId,
                    first_name: dto.first_name.trim(),
                    last_name: dto.last_name.trim(),
                    email: dto.email.toLowerCase().trim(),
                    phone: dto.phone.trim(),
                    bvn: dto.bvn,
                    password_hash: passwordHash,
                    is_email_verified: false,
                })
                .then(() => trx("users").where({ id: userId }));

            const [createdWallet] = await trx("wallets")
                .insert({
                    id: walletId,
                    user_id: userId,
                    account_number: accountNumber,
                    balance: 0.0,
                    is_active: true,
                })
                .then(() => trx("wallets").where({ id: walletId }));

            const code = generateOTPCode(6);
            const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

            await trx("verification_tokens").insert({
                id: uuidv4(),
                user_id: userId,
                code,
                type: "email_verification",
                expires_at: expiresAt,
            });

            return { user: createdUser, wallet: createdWallet, otpCode: code };
        });

        // Send OTP email
        await emailService.sendVerificationOTP(user.email, user.first_name, otpCode);

        return {
            user,
            wallet,
            message: "Registration successful. Please check your email for verification code.",
        };
    }

    async login(dto: LoginAuthDTO): Promise<{ user: User; wallet: Wallet | null; tokens: AuthTokens }> {
        const user = await db("users")
            .where({ email: dto.email.toLowerCase().trim() })
            .first();

        if (!user || !user.password_hash) {
            throw new Error("Invalid email or password");
        }

        const isPasswordValid = await comparePassword(dto.password, user.password_hash);
        if (!isPasswordValid) {
            throw new Error("Invalid email or password");
        }

        if (!user.is_email_verified) {
            throw new Error("Email address is not verified. Please verify your email first.");
        }

        const wallet = await db("wallets").where({ user_id: user.id }).first() || null;
        const tokens = generateJWT({ userId: user.id, email: user.email });

        return { user, wallet, tokens };
    }

    async verifyEmail(dto: VerifyEmailDTO): Promise<boolean> {
        const user = await db("users")
            .where({ email: dto.email.toLowerCase().trim() })
            .first();

        if (!user) {
            throw new Error("User not found");
        }

        if (user.is_email_verified) {
            return true;
        }

        const tokenRecord = await db("verification_tokens")
            .where({ user_id: user.id, code: dto.code, type: "email_verification" })
            .whereNull("used_at")
            .where("expires_at", ">", new Date())
            .first();

        if (!tokenRecord) {
            throw new Error("Invalid or expired verification code");
        }

        await db("verification_tokens")
            .where({ id: tokenRecord.id })
            .update({ used_at: new Date() });

        await db("users")
            .where({ id: user.id })
            .update({ is_email_verified: true, updated_at: new Date() });

        return true;
    }

    async resendVerificationCode(email: string): Promise<boolean> {
        const user = await db("users")
            .where({ email: email.toLowerCase().trim() })
            .first();

        if (!user) {
            throw new Error("User not found");
        }

        if (user.is_email_verified) {
            throw new Error("Email is already verified");
        }

        const code = generateOTPCode(6);
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

        await db("verification_tokens").insert({
            id: uuidv4(),
            user_id: user.id,
            code,
            type: "email_verification",
            expires_at: expiresAt,
        });

        await emailService.sendVerificationOTP(user.email, user.first_name, code);
        return true;
    }

    async setTransactionPin(userId: string, pin: string): Promise<boolean> {
        if (!/^\d{4}$/.test(pin)) {
            throw new Error("Transaction PIN must be exactly 4 digits");
        }

        const hashedPin = await hashPin(pin);

        await db("users")
            .where({ id: userId })
            .update({ transaction_pin_hash: hashedPin, updated_at: new Date() });

        return true;
    }

    async refreshToken(refreshToken: string): Promise<AuthTokens> {
        const payload = verifyRefreshToken(refreshToken);
        if (!payload) {
            throw new Error("Invalid or expired refresh token");
        }

        const user = await db("users").where({ id: payload.userId }).first();
        if (!user) {
            throw new Error("User not found");
        }

        const wallet = await db("wallets").where({ user_id: user.id }).first() || null;
        const tokens = generateJWT({ userId: user.id, email: user.email });

        return tokens;
    }

    async forgotPassword(email: string): Promise<boolean> {
        const user = await db("users")
            .where({ email: email.toLowerCase().trim() })
            .first();

        // Always return success to prevent email enumeration
        if (!user) {
            return true;
        }

        const code = generateOTPCode(6);
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

        await db("verification_tokens").insert({
            id: uuidv4(),
            user_id: user.id,
            code,
            type: "password_reset",
            expires_at: expiresAt,
        });

        await emailService.sendPasswordResetOTP(user.email, user.first_name, code);
        return true;
    }

    async resetPassword(dto: ResetPasswordDTO): Promise<boolean> {
        const user = await db("users")
            .where({ email: dto.email.toLowerCase().trim() })
            .first();

        if (!user) {
            throw new Error("User not found");
        }

        const tokenRecord = await db("verification_tokens")
            .where({ user_id: user.id, code: dto.code, type: "password_reset" })
            .whereNull("used_at")
            .where("expires_at", ">", new Date())
            .first();

        if (!tokenRecord) {
            throw new Error("Invalid or expired reset code");
        }

        if (dto.newPassword.length < 6) {
            throw new Error("Password must be at least 6 characters");
        }

        const passwordHash = await hashPassword(dto.newPassword);

        await db("verification_tokens")
            .where({ id: tokenRecord.id })
            .update({ used_at: new Date() });

        await db("users")
            .where({ id: user.id })
            .update({ password_hash: passwordHash, updated_at: new Date() });

        return true;
    }

    async changePassword(userId: string, dto: ChangePasswordDTO): Promise<boolean> {
        const user = await db("users").where({ id: userId }).first();

        if (!user || !user.password_hash) {
            throw new Error("User not found");
        }

        const isPasswordValid = await comparePassword(dto.currentPassword, user.password_hash);
        if (!isPasswordValid) {
            throw new Error("Current password is incorrect");
        }

        if (dto.newPassword.length < 6) {
            throw new Error("New password must be at least 6 characters");
        }

        const passwordHash = await hashPassword(dto.newPassword);

        await db("users")
            .where({ id: userId })
            .update({ password_hash: passwordHash, updated_at: new Date() });

        return true;
    }
}

export const authService = new AuthService();
export default authService;
