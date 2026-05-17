import React, { useState } from 'react';

export function PasswordResetForm() {
  const [email, setEmail] = useState('');

  // BUG (Pixel): no loading state, no error UI, no success state.
  const submit = async () => {
    await fetch('/api/auth/reset', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  };

  return (
    <div style={{ background: '#fff', color: '#dddddd' }}>
      {/* BUG (Pixel): #dddddd on #fff ≈ 1.5:1, fails WCAG AA. */}

      {/* BUG (Pixel): input with no label, no aria, no autocomplete hint. */}
      <input value={email} onChange={(e) => setEmail(e.target.value)} />

      {/* BUG (Pixel): clickable span — not focusable, not announced as a button. */}
      <span onClick={submit} style={{ cursor: 'pointer' }}>send</span>
    </div>
  );
}
