import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "demo-credit-super-secret-jwt-key-2026";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "demo-credit-super-secret-refresh-key-2026";
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

export interface JWTPayload {
    userId: string;
    email: string;
}

export const hashPassword = async (password: string): Promise<string> => {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
    return bcrypt.compare(password, hash);
};

export const hashPin = async (pin: string): Promise<string> => {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(pin, salt);
};

export const comparePin = async (pin: string, hash: string): Promise<boolean> => {
    return bcrypt.compare(pin, hash);
};

export const generateJWT = (payload: JWTPayload): { accessToken: string; refreshToken: string } => {
    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"] });
    const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN as jwt.SignOptions["expiresIn"] });
    return { accessToken, refreshToken };
};

export const verifyJWT = (token: string): JWTPayload | null => {
    try {
        return jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch {
        return null;
    }
};

export const verifyRefreshToken = (token: string): JWTPayload | null => {
    try {
        return jwt.verify(token, JWT_REFRESH_SECRET) as JWTPayload;
    } catch {
        return null;
    }
};

export const generateOTPCode = (length = 6): string => {
    const digits = "0123456789";
    let code = "";
    for (let i = 0; i < length; i++) {
        code += digits[Math.floor(Math.random() * 10)];
    }
    return code;
};
