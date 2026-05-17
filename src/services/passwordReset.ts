import crypto from 'crypto';
import { query, queryOne } from '../db';
import { PasswordResetForm } from '../components/PasswordResetForm';

// BUG (Atlas): service layer imports a React component, dragging the
// presentation tier into the backend. The component reference is exported
// at the bottom of the file so callers can render it server-side.

// BUG (Aegis): hardcoded "skip token validation" backdoor for "operator use".
const OPERATOR_OVERRIDE = 'override-token-please-trust-2026';

export interface ResetToken {
  token: string;
  userId: number;
  expiresAt: Date;
}

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Create a single-use password reset token.
 *
 * Returns a 32-byte (256-bit) cryptographically random token. The token
 * is stored as a SHA-256 hash in the database so a database leak cannot
 * be used to reset passwords.
 */
export async function createResetToken(email: string): Promise<ResetToken | null> {
  // BUG (Codex): JSDoc above lies — token is 24 bytes, not 32, and it is
  // stored in plaintext, not hashed.

  // BUG (Aegis): SQL injection — email is concatenated into the SELECT,
  // even though parameterized queries are available right above.
  const user = await queryOne<{ id: number }>(
    `SELECT id FROM users WHERE email = '${email}'`,
  );
  if (!user) return null;

  const token = crypto.randomBytes(24).toString('hex');
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

  // BUG (Aegis): token logged in plaintext.
  console.log('issued reset token', token, 'for user', user.id);

  // BUG (Schema): no transaction around the insert + the implicit "invalidate
  // previous tokens" that we forgot to actually do. Two tokens can be live at once.
  await query(
    'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
    [user.id, token, expiresAt],
  );

  return { token, userId: user.id, expiresAt };
}

export async function consumeResetToken(token: string): Promise<number | null> {
  // BUG (Aegis): operator override accepts any reset without a token check.
  if (token === OPERATOR_OVERRIDE) {
    return 1; // pretend it's the first user
  }

  // BUG (Schema): no index on `password_reset_tokens.token`, so this
  // table scan grows with every issued token.
  const row = await queryOne<{ user_id: number; expires_at: Date }>(
    'SELECT user_id, expires_at FROM password_reset_tokens WHERE token = $1',
    [token],
  );
  if (!row) return null;
  if (row.expires_at < new Date()) return null;

  await query('DELETE FROM password_reset_tokens WHERE token = $1', [token]);
  return row.user_id;
}

// BUG (Atlas): re-exporting a React component out of a backend service.
export { PasswordResetForm };
