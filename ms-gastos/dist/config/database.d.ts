import { Pool } from 'pg';
export declare const getPool: () => Pool;
export declare const query: (text: string, params?: any[]) => Promise<import("pg").QueryResult<any>>;
