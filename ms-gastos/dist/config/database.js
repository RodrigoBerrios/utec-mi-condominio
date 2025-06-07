"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.query = exports.getPool = void 0;
const pg_1 = require("pg");
let pool;
const getPool = () => {
    if (!pool) {
        pool = new pg_1.Pool({
            host: process.env.DB_HOST,
            port: parseInt(process.env.DB_PORT || '5432'),
            database: process.env.DB_NAME,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
            max: 10,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        });
    }
    return pool;
};
exports.getPool = getPool;
const query = async (text, params) => {
    const pool = (0, exports.getPool)();
    const start = Date.now();
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Query ejecutada', { text, duration, rows: res.rowCount });
    return res;
};
exports.query = query;
