import { Pool } from 'pg';

export const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
});

export async function query<T = any>(sql: string, params: any[] = []) {
  const result = await db.query(sql, params);
  return { rows: result.rows as T[] };
}

export async function queryOne<T = any>(sql: string, params: any[] = []) {
  const { rows } = await query<T>(sql, params);
  return rows[0] ?? null;
}
