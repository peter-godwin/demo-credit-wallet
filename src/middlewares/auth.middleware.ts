import {NextFunction, Request, Response} from "express";
import db from "../config/db";
import {HttpStatus, sendError} from "../utils/response.util";

declare global {
    namespace Express {
        interface Request {
            userId?: string;
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
        const user = await db("users").where({id: token}).first();

        if (!user) {
            sendError(res, "Unauthorized invalid token", HttpStatus.UNAUTHORIZED);
            return;
        }

        req.userId = user.id;
        next();
    } catch {
        sendError(res, "Authentication error", HttpStatus.INTERNAL_SERVER_ERROR);
    }
};