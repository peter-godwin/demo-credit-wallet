import knex from "knex";
import knexConfig from "../../knexfile";
import dotenv from "dotenv";

dotenv.config();

const env = (process.env.NODE_ENV as string);
const db = knex(knexConfig[env]);

export default db;