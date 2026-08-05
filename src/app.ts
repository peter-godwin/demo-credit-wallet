import express, { NextFunction, Request, Response } from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import v1Routes from "./routes/v1";
import { HttpStatus, sendError } from "./utils/response.util";

const app = express();

// Security HTTP headers & CORS
app.use(helmet());
app.use(cors());

// General rate limiter for API routes
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many requests from this IP, please try again later after 15 minutes.",
    },
});

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.get("/api/v1/health", (_req: Request, res: Response) => {
    res.status(200).json({
        success: true,
        message: "LendPay Wallet API",
        timestamp: new Date().toISOString(),
        version: "v1",
    });
});

app.use("/api/v1", apiLimiter, v1Routes);

app.use((_req: Request, res: Response) => {
    sendError(res, "Route not found", HttpStatus.NOT_FOUND);
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error("Unhandled error:", err);
    sendError(res, "Internal server error", HttpStatus.INTERNAL_SERVER_ERROR, err.message);
});

export default app;