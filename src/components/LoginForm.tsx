import React, { useState } from 'react';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [users, setUsers] = useState<any[] | null>(null);

  const submit = async () => {
    // BUG: no loading state — button stays clickable while the request flies.
    const r = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    // BUG: no error UI — failed logins silently produce `null`.
    const data = await r.json();
    setUsers(data.users ?? []);
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
