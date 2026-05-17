import { Router } from 'express';
import { query, queryOne } from '../db';

const router = Router();

const DEFAULT_PAGE_SIZE = 20;

router.get('/:id', async (req, res) => {
  const user = await queryOne(
    'SELECT id, email, name, created_at FROM users WHERE id = $1',
    [req.params.id],
  );
  if (!user) return res.status(404).json({ error: 'not found' });
  res.json(user);
});

router.get('/', async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const offset = (page - 1) * DEFAULT_PAGE_SIZE;
  const { rows } = await query(
    'SELECT id, email, name FROM users ORDER BY id LIMIT $1 OFFSET $2',
    [DEFAULT_PAGE_SIZE, offset],
  );
  res.json({ users: rows, page });
});

export default router;
