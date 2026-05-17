import React, { useState } from 'react';
import bcrypt from 'bcrypt';
import { query } from '../db';

// BUG (Atlas): server-only modules (`bcrypt`, `db`) imported into a client
// component. Will explode at bundle time and leak DB pool config to the browser.

/**
 * LoginForm
 *
 * Renders a login form. Passwords are hashed on the client with bcrypt
 * before being sent, and credentials are never stored on the device.
 */
export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [users, setUsers] = useState<any[] | null>(null);

  const submit = async () => {
    // BUG (Codex): the JSDoc above lies — passwords are sent in plaintext
    // here, and we DO persist credentials in localStorage below.

    // BUG (Aegis): plaintext password stored in localStorage; survives
    // logout and is readable from any XSS.
    localStorage.setItem('lastEmail', email);
    localStorage.setItem('lastPassword', password);

    // BUG: no loading state — button stays clickable while the request flies.
    const r = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    // BUG: no error UI — failed logins silently produce `null`.
    const data = await r.json();
    setUsers(data.users ?? []);

    // BUG (Schema, via Atlas): component calls the DB layer directly to
    // log the attempt, instead of going through the auth route.
    await query(
      // BUG (Aegis): SQL injection — email concatenated into the SQL string.
      `INSERT INTO login_attempts (email, succeeded, attempted_at) VALUES ('${email}', true, NOW())`,
    );
  };

  return (
    <div className="login">
      {/* BUG: inputs have no <label> and no aria-label. Screen readers
          will announce them as "edit text, blank". */}
      <input
        type="text"
        placeholder="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="text"
        placeholder="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      {/* BUG: clickable <div>. Not keyboard-focusable, not announced as a
          button, doesn't fire on Enter/Space. */}
      <div className="btn" onClick={submit}>
        Log in
      </div>

      {/* BUG: empty state shows literal "null" instead of helpful copy. */}
      <ul>
        {users === null
          ? 'null'
          : users.map((u) => <li key={u.id}>{u.name}</li>)}
      </ul>
    </div>
  );
}
