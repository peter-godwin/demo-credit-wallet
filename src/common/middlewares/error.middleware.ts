import { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/app-error";
import { HttpStatus, sendError } from "../../utils/response.util";

export const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction): Response => {
    if (err instanceof AppError) {
        return sendError(res, err.message, err.statusCode);
    }

    console.error("Unhandled Application Error:", err);
    return sendError(res, "Internal server error", HttpStatus.INTERNAL_SERVER_ERROR, err.message);
};
