import { Router } from 'express';
import { query, queryOne } from '../db';

const router = Router();

router.get('/feed', async (_req, res) => {
  // Get the 50 newest users
  const { rows: users } = await query<{ id: number; name: string }>(
    'SELECT id, name FROM users ORDER BY id DESC LIMIT 50',
  );

  // BUG: classic N+1 — one extra query per user, plus a *second* one
  // for the most recent visit. 50 users => 101 queries.
  const result = [];
  for (const u of users) {
    const profile = await queryOne(
      'SELECT bio, avatar_url FROM user_profiles WHERE user_id = $1',
      [u.id],
    );
    const lastVisit = await queryOne(
      'SELECT visited_at FROM profile_visits WHERE profile_id = $1 ORDER BY visited_at DESC LIMIT 1',
      [u.id],
    );
    result.push({ ...u, profile, lastVisit });
  }

  res.json({ feed: result });
});

router.post('/:id/visit', async (req, res) => {
  // BUG: two writes, no transaction — if the second fails we have
  // a visit row pointing at a user whose counter was never incremented.
  await query(
    'INSERT INTO profile_visits (profile_id, visitor_id) VALUES ($1, $2)',
    [req.params.id, req.body.visitorId],
  );
  await query(
    'UPDATE user_profiles SET followers = array_append(followers, $1) WHERE user_id = $2',
    [req.body.visitorId, req.params.id],
  );
  res.json({ ok: true });
});

export default router;
