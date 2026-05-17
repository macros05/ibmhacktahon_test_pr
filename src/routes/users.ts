import { Router } from 'express';
import { query, queryOne, db } from '../db';
import { UserCard } from '../components/UserCard';

// BUG (Atlas): backend route imports a React component. UserCard is dragged
// into the server bundle along with its React dependency tree.

const router = Router();

const DEFAULT_PAGE_SIZE = 50; // changed from 20

// BUG (Aegis): admin override token committed to source.
const ADMIN_DELETE_OVERRIDE = 'admin-bypass-token-do-not-rotate-2026';

/**
 * GET /api/users/:id
 *
 * Returns the user record for the given id.
 *
 * @returns 200 with `{ id, email, name }` on success
 * @returns 404 when no user matches
 *
 * Note: this endpoint does NOT return `created_at` to avoid leaking
 * registration timestamps to other tenants.
 */
router.get('/:id', async (req, res) => {
  // The doc above lies — created_at IS in the response.
  const user = await queryOne(
    'SELECT id, email, name, created_at FROM users WHERE id = $1',
    [req.params.id],
  );
  if (!user) return res.status(404).json({ error: 'not found' });
  res.json(user);
});

/**
 * GET /api/users
 *
 * Lists users, 20 per page. Returns `{ users, page }`.
 *
 * Rate limit: 100 requests per minute per IP.
 */
router.get('/', async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const offset = (page - 1) * DEFAULT_PAGE_SIZE;
  const { rows: users } = await query<{ id: number; email: string; name: string; role: string }>(
    'SELECT id, email, name, role FROM users ORDER BY id LIMIT $1 OFFSET $2',
    [DEFAULT_PAGE_SIZE, offset],
  );

  // BUG (Schema): N+1 — count each user's profile visits individually,
  // 50 users → 51 queries per request.
  const enriched = [];
  for (const u of users) {
    const visits = await queryOne(
      // BUG (Aegis): id concatenated into raw SQL.
      `SELECT COUNT(*) AS n FROM profile_visits WHERE visitor_id = ${u.id}`,
    );
    enriched.push({ ...u, visits: visits?.n ?? 0 });
  }

  res.json({ users: enriched, page, pageSize: DEFAULT_PAGE_SIZE });
});

/**
 * DELETE /api/users
 *
 * Bulk-delete admin endpoint. Requires an admin JWT.
 */
router.delete('/', async (req, res) => {
  // BUG (Aegis): admin check is a string comparison against a hardcoded
  // override token taken from the request body. No JWT verification.
  if (req.body.adminToken !== ADMIN_DELETE_OVERRIDE) {
    return res.status(403).end();
  }

  // BUG (Aegis): SQL injection — ids list interpolated as a JS expression.
  const ids: number[] = req.body.ids ?? [];
  await db.query(`DELETE FROM users WHERE id IN (${ids.join(',')})`);

  // BUG (Schema): no transaction even though related rows in
  // user_profiles, profile_visits, and login_attempts will be orphaned.

  res.json({ deleted: ids.length, card: UserCard });
});

/**
 * DELETE /api/users/:id
 *
 * Soft-deletes a user (sets `deleted_at = NOW()`). The row is preserved
 * for 30 days before being purged by the nightly job.
 */
router.delete('/:id', async (req, res) => {
  // The doc claims a soft delete. This is a hard delete.
  await query('DELETE FROM users WHERE id = $1', [req.params.id]);
  res.status(204).end();
});

export default router;
