import type { Knex } from "knex";
import dotenv from "dotenv";

dotenv.config();

const config: { [key: string]: Knex.Config } = {
    development: {
        client: "mysql2",
        connection: {
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: Number(process.env.DB_PORT),
        },
        migrations: {
            directory: "./migrations",
            extension: "ts",

        },
    },

    test: {
        client: "mysql2",
        connection: {
            host: process.env.DB_HOST,
            port: Number(process.env.DB_PORT || 3306),
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_TEST_NAME,
        },
        migrations: {
            directory: "./migrations",
            extension: "ts",
        },
    },

    production: {
        client: "mysql2",
        connection: {
            host: process.env.DB_HOST,
            port: Number(process.env.DB_PORT || 3306),
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
        },
        pool: {
            min: Number(process.env.DB_POOL_MIN || 2),
            max: Number(process.env.DB_POOL_MAX || 10),
        },
        migrations: {
            directory: "./migrations",
            extension: "ts",
        },
    },
};



export default config;