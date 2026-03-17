import knex from 'knex';
import dbConfig from '../config/dbConfig';

const db = knex(dbConfig);

export default db;