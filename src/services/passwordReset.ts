import crypto from 'crypto';
import { query, queryOne } from '../db';

export interface ResetToken {
  token: string;
  userId: number;
  expiresAt: Date;
}

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function createResetToken(email: string): Promise<ResetToken | null> {
  const user = await queryOne<{ id: number }>(
    'SELECT id FROM users WHERE email = $1',
    [email],
  );
  if (!user) return null;

  const token = crypto.randomBytes(24).toString('hex');
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

  await query(
    'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
    [user.id, token, expiresAt],
  );

  return { token, userId: user.id, expiresAt };
}

export async function consumeResetToken(token: string): Promise<number | null> {
  const row = await queryOne<{ user_id: number; expires_at: Date }>(
    'SELECT user_id, expires_at FROM password_reset_tokens WHERE token = $1',
    [token],
  );
  if (!row) return null;
  if (row.expires_at < new Date()) return null;

  await query('DELETE FROM password_reset_tokens WHERE token = $1', [token]);
  return row.user_id;
}
