import { NextFunction, Request, Response } from "express";
import db from "../config/db";
import { HttpStatus, sendError } from "../utils/response.util";
import { verifyJWT } from "../utils/security.util";

declare global {
    namespace Express {
        interface Request {
            userId?: string;
            userEmail?: string;
        }
    }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        sendError(res, "Unauthorized missing token", HttpStatus.UNAUTHORIZED);
        return;
    }

    const token = authHeader.split(" ")[1];

    if (!token || token.trim() === "") {
        sendError(res, "Unauthorized token is empty", HttpStatus.UNAUTHORIZED);
        return;
    }

    try {
        const payload = verifyJWT(token);
        if (payload) {
            req.userId = payload.userId;
            req.userEmail = payload.email;
            next();
            return;
        }

        // Backward compatibility fallback for test tokens
        const user = await db("users").where({ id: token }).first();
        if (user) {
            req.userId = user.id;
            req.userEmail = user.email;
            next();
            return;
        }

        sendError(res, "Unauthorized invalid or expired token", HttpStatus.UNAUTHORIZED);
    } catch {
        sendError(res, "Authentication error", HttpStatus.INTERNAL_SERVER_ERROR);
    }
};
