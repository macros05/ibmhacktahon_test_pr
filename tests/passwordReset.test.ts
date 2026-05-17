import { createResetToken, consumeResetToken } from '../src/services/passwordReset';

// BUG: weak assertion — only checks truthiness, not the actual shape.
// `null` would fail this, but so would the function returning literally
// `true` or `1`. The test would pass with a broken implementation.
test('createResetToken returns something for an existing user', async () => {
  const r = await createResetToken('a@b.co');
  expect(r).toBeTruthy();
});

// BUG: flaky timing test — racing real wall-clock time against a 1-hour TTL
// with a 10 ms tolerance. Will pass locally and fail at random in CI.
test('token expires roughly an hour after creation', async () => {
  const r = await createResetToken('a@b.co');
  if (!r) throw new Error('no token');
  const expectedMs = Date.now() + 60 * 60 * 1000;
  await new Promise((res) => setTimeout(res, 10));
  expect(Math.abs(r.expiresAt.getTime() - expectedMs)).toBeLessThan(10);
});

// BUG: console.log instead of an assertion. The test passes no matter what
// `consumeResetToken` returns.
test('consumeResetToken with an invalid token', async () => {
  const result = await consumeResetToken('not-a-real-token');
  console.log('got', result);
});

// MISSING TESTS (none of these branches are covered):
//   - createResetToken when the email does not exist (should return null)
//   - consumeResetToken with an expired token (should return null and NOT delete)
//   - consumeResetToken happy path (returns user_id, deletes the row)
//   - re-using a consumed token (should fail — security-critical branch)
//   - SQL parameter passing (no injection via the email param)
//   - concurrent createResetToken calls for the same user (idempotency / collisions)
