import express, {NextFunction, Request, Response} from "express";
import v1Routes from "./routes/v1";
import {HttpStatus, sendError} from "./utils/response.util";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/api/v1/health", (_req: Request, res: Response) => {
    res.status(200).json({
        success: true,
        message: "Demo Credit Wallet API",
        timestamp: new Date().toISOString(),
        version: "v1"
    });
});

app.use("/api/v1", v1Routes);

app.use((_req: Request, res: Response) => {
    sendError(res, "Route not found", HttpStatus.NOT_FOUND);
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error("Unhandled error:", err);
    sendError(res, "Internal server error",  HttpStatus.INTERNAL_SERVER_ERROR, err.message);
});

export default app;