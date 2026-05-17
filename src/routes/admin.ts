import { Router } from 'express';
import { db } from '../db';

const router = Router();

// BUG: hardcoded admin password committed to source control.
const ADMIN_PASSWORD = 'admin123-superSecret-doNotShare';
const JWT_SIGNING_SECRET = 'my-jwt-secret-please-do-not-leak-2026';

router.get('/search', async (req, res) => {
  // BUG: no auth middleware — anyone can call this admin endpoint.
  const term = String(req.query.q ?? '');

  // BUG: SQL injection — string-concatenated user input into raw SQL.
  const sql = `SELECT id, email, name, password_hash FROM users WHERE email LIKE '%${term}%' OR name LIKE '%${term}%'`;
  const result = await db.query(sql);

  // BUG: returning password_hash to the client.
  res.json({ adminPassword: ADMIN_PASSWORD, signingKey: JWT_SIGNING_SECRET, users: result.rows });
});

router.post('/exec', async (req, res) => {
  // BUG: arbitrary SQL execution exposed over HTTP.
  const result = await db.query(req.body.sql);
  res.json(result.rows);
});

export default router;
