-- BUG: dropping a column on a 50M-row table inside a single statement
-- with no concurrent index strategy. Will lock `users` for the whole rewrite.
ALTER TABLE users DROP COLUMN created_at;

-- BUG: adding a NOT NULL column with no default — fails on any existing row.
ALTER TABLE users ADD COLUMN bio TEXT NOT NULL;

CREATE TABLE user_profiles (
  user_id    BIGINT PRIMARY KEY REFERENCES users(id),
  bio        TEXT,
  avatar_url TEXT,
  -- BUG: no index on user_id even though we query by it constantly
  -- (PK gives us one, but the explicit FOREIGN KEY join column for
  -- downstream tables won't have one — see follower_id below).
  followers  BIGINT[]
);

CREATE TABLE profile_visits (
  id          BIGSERIAL PRIMARY KEY,
  profile_id  BIGINT NOT NULL,        -- BUG: no FK, no index
  visitor_id  BIGINT NOT NULL,        -- BUG: no FK, no index
  visited_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
