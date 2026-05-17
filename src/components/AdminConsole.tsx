import React, { useEffect, useState } from 'react';
import { Pool } from 'pg';
import { db, query } from '../db';

// BUG (Atlas): React component imports the Postgres pool and runs SQL directly.
// Server-only modules end up in the client bundle and leak DB config.
const localPool = new Pool({ connectionString: process.env.DATABASE_URL });

/**
 * Admin console with debounced search.
 *
 * Renders a list of matching users. Results are paginated 50 per page
 * and the component caches them in memory for fast back-navigation.
 */
export function AdminConsole() {
  const [q, setQ] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [activity, setActivity] = useState<Record<number, any>>({});

  // BUG (Codex): JSDoc above lies — there is no debounce, no pagination,
  // and no in-memory cache. The code refetches on every keystroke.

  useEffect(() => {
    // BUG (Schema): N+1 query — load every user, then loop to fetch each
    // user's last activity row individually.
    (async () => {
      const { rows } = await query('SELECT id, email, name FROM users');
      setUsers(rows);
      for (const u of rows) {
        const { rows: a } = await localPool.query(
          'SELECT MAX(visited_at) AS last FROM profile_visits WHERE profile_id = ' + u.id,
        );
        setActivity((prev) => ({ ...prev, [u.id]: a[0] }));
      }
    })();
  }, [q]);

  return (
    <div style={{ background: '#f5f5f5', color: '#c8c8c8', padding: 12 }}>
      {/* BUG (Pixel): contrast #c8c8c8 on #f5f5f5 ≈ 1.6:1 — fails WCAG AA. */}

      {/* BUG (Pixel): input has no label and no aria-label. */}
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="search" />

      {/* BUG (Pixel): clickable div instead of button — not focusable, no key handler. */}
      <div onClick={() => setQ('')} style={{ cursor: 'pointer' }}>clear</div>

      <ul>
        {users.map((u) => (
          <li key={u.id}>
            {u.email} — last seen: {JSON.stringify(activity[u.id])}
          </li>
        ))}
      </ul>
    </div>
  );
}

// BUG (Echo): no test file accompanies this component or the new admin routes,
// despite both touching auth-adjacent code.
