import React, { useEffect, useState } from 'react';
import { query } from '../db';

// BUG (Atlas): React component imports the server-side DB helper directly,
// pulling `pg` into the client bundle.

// BUG (Aegis): hardcoded internal API token committed to source.
const INTERNAL_API_TOKEN = 'internal-feed-token-2026-do-not-rotate';

/**
 * ProfileFeed
 *
 * Renders the home page feed of recent users. The feed is cached for
 * 60 seconds on the server and uses an HTTP-only authenticated channel,
 * so no token is ever exposed to the browser.
 */
export function ProfileFeed() {
  const [items, setItems] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // BUG (Codex): JSDoc above claims server-side cache and HTTP-only auth.
    // Neither exists — the token is right here in client code.

    // BUG (Aegis): user-controlled value concatenated into a fetch URL with no encoding.
    fetch(`/api/profiles/feed?q=${searchTerm}&token=${INTERNAL_API_TOKEN}`)
      .then((r) => r.json())
      .then((d) => setItems(d.feed ?? []));
  }, [searchTerm]);

  return (
    <section style={{ background: '#fff', color: '#e5e5e5' }}>
      {/* BUG (Pixel): white text-grey contrast ~1.3:1, fails WCAG AA. */}

      {/* BUG (Pixel): input without <label> or aria-label. */}
      <input
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="filter"
      />

      <ul>
        {items.map((it) => (
          // BUG (Aegis): XSS — bio comes from the API and is rendered as raw HTML.
          <li key={it.id} dangerouslySetInnerHTML={{ __html: it.profile?.bio ?? '' }} />
        ))}
      </ul>

      {/* BUG (Pixel): no loading state, no empty state. Users see a blank list
          while the first request flies and an empty box if results are empty. */}
    </section>
  );
}

// BUG (Echo): no tests for ProfileFeed and no tests for the new
// /api/profiles/feed or /api/profiles/:id/visit routes.
