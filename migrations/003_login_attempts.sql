CREATE TABLE login_attempts (
  id            BIGSERIAL PRIMARY KEY,
  email         TEXT NOT NULL,         -- BUG (Schema): no index, but queried by email constantly
  succeeded     BOOLEAN NOT NULL,
  attempted_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip            INET                   -- BUG (Schema): no index for rate-limit lookups by IP
);

-- BUG (Schema): every existing user must get a "row" in a second table that we
-- forgot to backfill — and the FK is created NOT VALID and then immediately
-- VALIDATEd in the same transaction, which takes a full table lock.
ALTER TABLE login_attempts
  ADD CONSTRAINT login_attempts_email_fk
  FOREIGN KEY (email) REFERENCES users(email) NOT VALID;
ALTER TABLE login_attempts VALIDATE CONSTRAINT login_attempts_email_fk;
