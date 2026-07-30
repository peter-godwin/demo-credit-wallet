import { NextFunction, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import db from "../config/db";

export const idempotencyHandler = () => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const idempotencyKey = req.headers["x-idempotency-key"] as string;

        if (!idempotencyKey || req.method === "GET") {
            next();
            return;
        }

        const userId = req.userId || "anonymous";

        try {
            const existingRecord = await db("idempotency_keys")
                .where({ key: idempotencyKey, user_id: userId })
                .first();

            if (existingRecord) {
                res.status(existingRecord.response_code).json(JSON.parse(existingRecord.response_body));
                return;
            }

            const originalJson = res.json.bind(res);

            res.json = (body: unknown): Response => {
                const responseCode = res.statusCode;
                const responseBody = JSON.stringify(body);

                // Save key asynchronously
                db("idempotency_keys")
                    .insert({
                        id: uuidv4(),
                        key: idempotencyKey,
                        user_id: userId,
                        request_path: req.originalUrl,
                        response_code: responseCode,
                        response_body: responseBody,
                    })
                    .catch((err) => console.error("Failed to save idempotency key:", err));

                return originalJson(body);
            };

            next();
        } catch (error) {
            console.error("Idempotency middleware error:", error);
            next();
        }
    };
};
