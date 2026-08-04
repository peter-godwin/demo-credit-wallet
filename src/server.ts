import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import db from "./config/db";

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

const gracefulShutdown = async (signal: string): Promise<void> => {
    console.log(`Received ${signal}. Shutting down gracefully...`);
    server.close(async () => {
        try {
            await db.destroy();
            console.log("Database connection pool closed.");
            process.exit(0);
        } catch (err) {
            console.error("Error during database shutdown:", err);
            process.exit(1);
        }
    });
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));


