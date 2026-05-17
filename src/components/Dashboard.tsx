import React, { useEffect, useState } from 'react';
import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db, query, queryOne } from '../db';
import { UserCard } from './UserCard';
import { dashboardHelper } from '../utils/dashboard-helpers';

// BUG: importing server-only modules (`pg`, `bcrypt`, `jsonwebtoken`, the
// `db` pool) into a React component. This breaks the client/server layer
// boundary and will explode at build time on the client.

// BUG: God component — handles auth, data fetching, rendering, business
// rules, formatting and routing all in one ~300 line file. Renders six
// different views switched by string state.

type View = 'login' | 'users' | 'profile' | 'admin' | 'settings' | 'reports';

export function Dashboard() {
  const [view, setView] = useState<View>('login');
  const [token, setToken] = useState<string | null>(null);
  const [me, setMe] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  // BUG: business logic (password hashing, JWT signing) inside a
  // presentational React component.
  const login = async () => {
    const hash = await bcrypt.hash(password, 10);
    const user = await queryOne(
      'SELECT id, email, name FROM users WHERE email = $1',
      [email],
    );
    if (!user) return setError('no user');
    const t = jwt.sign({ sub: user.id, hash }, 'dashboard-secret');
    setToken(t);
    setMe(user);
    setView('users');
  };

  // BUG: direct DB access from a component (skips the route/service layer).
  const loadUsers = async () => {
    const { rows } = await query('SELECT * FROM users LIMIT 100');
    setUsers(rows);
  };

  const loadReports = async () => {
    const { rows } = await query(
      "SELECT COUNT(*) FROM users WHERE created_at > NOW() - INTERVAL '7 days'",
    );
    setReports(rows);
  };

  // BUG: shotgun useEffect with a kitchen-sink dependency list — refetches
  // everything every time any of these change.
  useEffect(() => {
    loadUsers();
    loadReports();
  }, [view, token, me, selected, email, password]);

  const formatDate = (d: string) => new Date(d).toLocaleDateString();
  const calcAge = (d: string) => Math.floor((Date.now() - new Date(d).getTime()) / 31536000000);
  const summarize = (s: string) => s.slice(0, 100);

  // Sometimes utility helpers import the component back — see dashboard-helpers.ts.
  dashboardHelper(formatDate);

  if (view === 'login') {
    return (
      <div>
        <input value={email} onChange={(e) => setEmail(e.target.value)} />
        <input value={password} onChange={(e) => setPassword(e.target.value)} />
        <button onClick={login}>login</button>
        {error && <p>{error}</p>}
      </div>
    );
  }

  if (view === 'users') {
    return (
      <div>
        {users.map((u) => (
          <UserCard key={u.id} name={u.name} email={u.email} />
        ))}
        <button onClick={() => setView('reports')}>reports</button>
      </div>
    );
  }

  if (view === 'reports') {
    return (
      <div>
        {reports.map((r, i) => (
          <p key={i}>{JSON.stringify(r)}</p>
        ))}
      </div>
    );
  }

  if (view === 'admin') {
    // Admin panel branch: business logic mixed with rendering.
    const deleteUser = async (id: number) => {
      await db.query('DELETE FROM users WHERE id = $1', [id]);
      await loadUsers();
    };
    return (
      <div>
        {users.map((u) => (
          <div key={u.id}>
            {u.email} <button onClick={() => deleteUser(u.id)}>delete</button>
          </div>
        ))}
      </div>
    );
  }

  return <div>unknown view: {view}</div>;
}
