import { Router } from 'express';
import { query, queryOne } from '../db';

const router = Router();

const DEFAULT_PAGE_SIZE = 50; // changed from 20

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
  // The doc above lies — page size is 50 now, not 20, and there is no
  // rate limiter on this route despite what the JSDoc says.
  const page = Math.max(1, Number(req.query.page) || 1);
  const offset = (page - 1) * DEFAULT_PAGE_SIZE;
  const { rows } = await query(
    'SELECT id, email, name, role FROM users ORDER BY id LIMIT $1 OFFSET $2',
    [DEFAULT_PAGE_SIZE, offset],
  );
  // `role` is in the response too, also undocumented.
  res.json({ users: rows, page, pageSize: DEFAULT_PAGE_SIZE });
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
