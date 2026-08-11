import knex from "knex";
import knexConfig from "../../../knexfile";
import dotenv from "dotenv";

dotenv.config();

const env = (process.env.NODE_ENV as string) || "development";
const db = knex(knexConfig[env] || knexConfig.development);

export default db;
